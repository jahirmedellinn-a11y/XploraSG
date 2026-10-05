#!/usr/bin/env python3
"""Extrae las fichas DOCX a JSON y JPEG sin depender de python-docx.

Los documentos fuente contienen imágenes con extensión ``.undefined`` y sin
declaración MIME en ``[Content_Types].xml``. Word puede mostrarlas, pero los
lectores DOCX estrictos las rechazan. Este extractor lee el OOXML directamente,
valida la firma binaria JPEG y conserva cada registro como borrador.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from zipfile import ZipFile

from lxml import etree


WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

NS = {
    "w": WORD_NS,
    "a": DRAWING_NS,
    "r": OFFICE_REL_NS,
    "pr": PACKAGE_REL_NS,
}


@dataclass(frozen=True)
class Source:
    filename: str
    kind: str
    municipality: str


SOURCES = (
    Source("Fichas_Lugares_Arroyo_Seco_Con_Imagenes.docx", "lugar", "Arroyo Seco"),
    # V3 reemplaza V2: agrega Tancama y conserva las otras tres fichas.
    Source("Fichas_Lugares_Jalpan_V3.docx", "lugar", "Jalpan de Serra"),
    Source("Fichas_Lugares_Landa_de_Matamoros.docx", "lugar", "Landa de Matamoros"),
    Source("Fichas_Lugares_Penamiller.docx", "lugar", "Peñamiller"),
    Source("Fichas_Lugares_Pinal_de_Amoles.docx", "lugar", "Pinal de Amoles"),
    Source("Fichas_Lugares_San_Joaquin.docx", "lugar", "San Joaquín"),
    Source("Servicios_Turisticos_Arroyo_Seco_Con_Imagenes.docx", "servicio", "Arroyo Seco"),
    Source("Servicios_Turisticos_Jalpan_V2.docx", "servicio", "Jalpan de Serra"),
    Source("Servicios_Turisticos_Landa_de_Matamoros_Real.docx", "servicio", "Landa de Matamoros"),
    Source("Servicios_Turisticos_Penamiller.docx", "servicio", "Peñamiller"),
    Source("Servicios_Turisticos_San_Joaquin.docx", "servicio", "San Joaquín"),
)


PLACE_SLUGS = {
    "Las Adjuntas": "las-adjuntas",
    "Misión de San Miguel Concá": "mision-de-san-miguel-conca",
    "Sótano del Barro": "sotano-del-barro",
    "Misión de Santiago Apóstol de Jalpan": "mision-de-jalpan",
    "Misión de Nuestra Señora de la Luz de Tancoyol": "mision-de-tancoyol",
    "Presa de Jalpan": "presa-jalpan",
    "Zona Arqueológica Tancama": "tancama",
    "Misión de Santa María del Agua de Landa": "mision-de-landa",
    "Misión de San Francisco del Valle de Tilaco": "mision-de-tilaco",
    "Comunidad de Neblinas / Río Neblinas": "neblinas",
    "Cascada de Río Verdito": "rio-verdito",
    "Balneario El Oasis": "balneario-el-oasis",
    "Cañón del Paraíso": "canon-del-paraiso",
    "Vestigios y Pinturas Rupestres en Peñamiller": "vestigios-prehistoricos",
    "Mirador Cuatro Palos": "cuatro-palos",
    "Cascada El Chuveje": "el-chuveje",
    "Mirador de Cristal (Peña de las Guacamayas)": "mirador-de-cristal",
    "Cascadas Maravillas / Cascada Las Maravillas": "cascadas-maravilla",
    "Grutas de los Herrera": "grutas-de-los-herrera",
    "Zona Arqueológica Ranas": "ranas",
}


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(char for char in normalized if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")


def node_text(node: etree._Element) -> str:
    chunks = [part.strip() for part in node.xpath(".//w:t/text()", namespaces=NS) if part.strip()]
    return " ".join(chunks)


def relationship_targets(archive: ZipFile) -> dict[str, str]:
    relationships = etree.fromstring(archive.read("word/_rels/document.xml.rels"))
    return {
        relation.get("Id", ""): relation.get("Target", "")
        for relation in relationships.xpath("//pr:Relationship", namespaces=NS)
    }


def table_fields(table: etree._Element) -> dict[str, str]:
    fields: dict[str, str] = {}
    for row in table.xpath("./w:tr", namespaces=NS):
        cells = row.xpath("./w:tc", namespaces=NS)
        if len(cells) < 2:
            continue
        key = node_text(cells[0]).strip()
        value = " ".join(node_text(cell).strip() for cell in cells[1:]).strip()
        if key:
            fields[key] = value
    return fields


def image_from_table(
    archive: ZipFile,
    table: etree._Element,
    relationships: dict[str, str],
) -> tuple[bytes, str]:
    image_ids = table.xpath(".//a:blip/@r:embed", namespaces=NS)
    if len(image_ids) != 1:
        raise ValueError(f"Se esperaba una imagen por ficha; se encontraron {len(image_ids)}")

    target = relationships.get(image_ids[0])
    if not target:
        raise ValueError(f"No existe la relación de imagen {image_ids[0]}")

    member = f"word/{target.lstrip('/')}"
    payload = archive.read(member)
    if not payload.startswith(b"\xff\xd8\xff"):
        raise ValueError(f"La imagen {member} no tiene firma JPEG")
    return payload, target


def get_required(fields: dict[str, str], *keys: str) -> str:
    for key in keys:
        value = fields.get(key, "").strip()
        if value:
            return value
    raise ValueError(f"Falta uno de los campos requeridos: {', '.join(keys)}")


def normalize_record(
    source: Source,
    fields: dict[str, str],
    image_relative_path: str,
    image_target: str,
) -> dict[str, object]:
    if source.kind == "lugar":
        name = get_required(fields, "Nombre oficial", "Nombre")
        slug = PLACE_SLUGS.get(name)
        if not slug:
            raise ValueError(f"Lugar no reconocido para la semilla existente: {name}")
        category = get_required(fields, "Categoría")
        provider = None
    else:
        name = get_required(fields, "Nombre", "Nombre oficial")
        slug = slugify(name)
        category = get_required(fields, "Tipo de servicio", "Categoría")
        provider = get_required(fields, "Prestador responsable", "Prestador")

    return {
        "tipo": source.kind,
        "municipio": source.municipality,
        "nombre": name,
        "slug": slug,
        "categoria_fuente": category,
        "prestador": provider,
        "estado_aprobacion": "borrador",
        "campos": fields,
        "imagen": {
            "archivo": image_relative_path.replace("\\", "/"),
            "mime_type": "image/jpeg",
            "target_docx_original": image_target,
            "derechos_verificados": False,
            "destino_recomendado": "xplorasg-review",
        },
        "fuente": {
            "archivo": source.filename,
            "version": "V3" if source.filename == "Fichas_Lugares_Jalpan_V3.docx" else None,
        },
    }


def extract_source(root: Path, output: Path, source: Source) -> list[dict[str, object]]:
    source_path = root / source.filename
    if not source_path.is_file():
        raise FileNotFoundError(source_path)

    kind_folder = "lugares" if source.kind == "lugar" else "servicios"
    media_folder = output / "media" / kind_folder
    media_folder.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, object]] = []
    with ZipFile(source_path) as archive:
        document = etree.fromstring(archive.read("word/document.xml"))
        relationships = relationship_targets(archive)
        tables = document.xpath("//w:body/w:tbl", namespaces=NS)

        for table in tables:
            fields = table_fields(table)
            provisional_name = get_required(fields, "Nombre oficial", "Nombre")
            provisional_slug = PLACE_SLUGS.get(provisional_name, slugify(provisional_name))
            filename = f"{provisional_slug}.jpg"
            destination = media_folder / filename
            payload, target = image_from_table(archive, table, relationships)
            destination.write_bytes(payload)
            relative_path = destination.relative_to(root)
            records.append(normalize_record(source, fields, str(relative_path), target))
    return records


def assert_unique(records: Iterable[dict[str, object]], field: str) -> None:
    values = [str(record[field]) for record in records]
    duplicates = sorted({value for value in values if values.count(value) > 1})
    if duplicates:
        raise ValueError(f"Valores duplicados en {field}: {', '.join(duplicates)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    output = (args.output or root / "content" / "fichas").resolve()
    output.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, object]] = []
    for source in SOURCES:
        records.extend(extract_source(root, output, source))

    places = [record for record in records if record["tipo"] == "lugar"]
    services = [record for record in records if record["tipo"] == "servicio"]
    if len(places) != 20:
        raise ValueError(f"Se esperaban 20 lugares; se extrajeron {len(places)}")
    if len(services) != 16:
        raise ValueError(f"Se esperaban 16 servicios de las fichas; se extrajeron {len(services)}")
    assert_unique(places, "slug")
    assert_unique(services, "slug")

    payload = {
        "version": 1,
        "estado": "borrador",
        "criterio": {
            "lugares": 20,
            "servicios_en_fichas": 16,
            "servicios_en_plantilla": 15,
            "nota": (
                "Se conservan los 16 servicios de las fichas sin publicar. "
                "Pinal de Amoles no tiene ficha de servicio y la distribución difiere de la plantilla."
            ),
        },
        "lugares": places,
        "servicios": services,
    }
    catalog_path = output / "catalogo_extraido.json"
    catalog_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Catálogo: {catalog_path}")
    print(f"Lugares: {len(places)}")
    print(f"Servicios: {len(services)}")
    print(f"Imágenes JPEG: {len(records)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
