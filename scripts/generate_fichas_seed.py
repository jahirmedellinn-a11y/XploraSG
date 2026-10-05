#!/usr/bin/env python3
"""Genera la semilla SQL idempotente desde catalogo_extraido.json."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


CULTURAL_PLACE_SLUGS = {
    "mision-de-jalpan",
    "mision-de-tancoyol",
    "tancama",
    "mision-de-san-miguel-conca",
    "mision-de-landa",
    "mision-de-tilaco",
    "vestigios-prehistoricos",
    "ranas",
}


def sql_string(value: object | None) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def field(record: dict[str, object], key: str, *alternatives: str) -> str | None:
    fields = record["campos"]
    assert isinstance(fields, dict)
    for candidate in (key, *alternatives):
        value = fields.get(candidate)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def service_category(source_category: str) -> str:
    value = source_category.lower()
    if any(term in value for term in ("hospedaje", "cabaña", "camping")):
        return "Hospedaje"
    if any(term in value for term in ("alimentación", "restaurante", "fonda")):
        return "Gastronomía"
    if any(term in value for term in ("guía", "tour", "aventura", "transporte")):
        return "Aventura"
    return "Servicios Comunitarios"


def coordinate_values(record: dict[str, object]) -> tuple[str, str]:
    # Las Adjuntas es la única ficha que incluye coordenadas numéricas.
    if record["slug"] == "las-adjuntas":
        return "21.3934", "-99.5852"
    return "NULL", "NULL"


def place_rows(records: list[dict[str, object]]) -> str:
    rows: list[str] = []
    for record in records:
        latitude, longitude = coordinate_values(record)
        category = "Cultura y Arqueología" if record["slug"] in CULTURAL_PLACE_SLUGS else "Naturaleza"
        values = (
            record["municipio"],
            category,
            record["slug"],
            record["nombre"],
            field(record, "Descripción"),
            field(record, "Ubicación exacta"),
            field(record, "Cómo llegar"),
            field(record, "Horarios"),
            field(record, "Costo"),
            field(record, "Actividades"),
            field(record, "Servicios disponibles"),
            field(record, "Accesibilidad"),
            field(record, "Recomendaciones y restricciones"),
            field(record, "Contacto"),
            field(record, "Fuente y fecha de verificación", "Fuente y verificación"),
        )
        quoted = [sql_string(value) for value in values]
        quoted.extend((latitude, longitude))
        rows.append("    (" + ", ".join(quoted) + ")")
    return ",\n".join(rows)


def provider_rows(records: list[dict[str, object]]) -> str:
    rows: list[str] = []
    for record in records:
        provider_slug = f"{record['slug']}-prestador"
        source = field(record, "Fuente y verificación", "Fuente y fecha de verificación")
        description = f"Prestador provisional de la ficha del servicio {record['nombre']}."
        values = (provider_slug, record["prestador"], description, source)
        rows.append("    (" + ", ".join(sql_string(value) for value in values) + ")")
    return ",\n".join(rows)


def service_rows(records: list[dict[str, object]]) -> str:
    rows: list[str] = []
    for record in records:
        source_category = str(record["categoria_fuente"])
        provider_slug = f"{record['slug']}-prestador"
        values = (
            provider_slug,
            record["municipio"],
            service_category(source_category),
            record["slug"],
            record["nombre"],
            field(record, "Descripción"),
            source_category,
            field(record, "Precio", "Costo"),
            field(record, "Contacto público", "Contacto"),
            field(record, "Horarios", "Horario"),
            field(record, "Ubicación", "Ubicación exacta"),
            field(record, "Reservación"),
            field(record, "Capacidad y requisitos"),
            field(record, "Accesibilidad"),
            field(record, "Lugares relacionados"),
            field(record, "Fuente y verificación", "Fuente y fecha de verificación"),
        )
        rows.append("    (" + ", ".join(sql_string(value) for value in values) + ")")
    return ",\n".join(rows)


def generate(payload: dict[str, object]) -> str:
    places = payload["lugares"]
    services = payload["servicios"]
    assert isinstance(places, list)
    assert isinstance(services, list)
    place_slugs = ", ".join(sql_string(record["slug"]) for record in places)
    service_slugs = ", ".join(sql_string(record["slug"]) for record in services)

    return f"""-- 003_content_from_fichas.sql
-- Generado por scripts/generate_fichas_seed.py.
-- Fuente: fichas DOCX entregadas para XploraSG.
-- Los 20 lugares y 16 servicios permanecen como borrador.

WITH ficha (
  municipio, categoria, slug, nombre, descripcion, direccion, info_acceso,
  horarios, costo, actividades, servicios_disponibles, accesibilidad,
  recomendaciones, contacto, fuente_verificacion, latitud, longitud
) AS (
  VALUES
{place_rows(places)}
)
INSERT INTO public.lugares_turisticos (
  municipio_id, categoria_id, slug, nombre, descripcion, direccion, info_acceso,
  horarios, costo, actividades, servicios_disponibles, accesibilidad,
  recomendaciones, contacto, fuente_verificacion, latitud, longitud,
  estado_aprobacion
)
SELECT
  m.id, c.id, f.slug, f.nombre, f.descripcion, f.direccion, f.info_acceso,
  f.horarios, f.costo, f.actividades, f.servicios_disponibles, f.accesibilidad,
  f.recomendaciones, f.contacto, f.fuente_verificacion, f.latitud, f.longitud,
  'borrador'
FROM ficha AS f
JOIN public.municipios AS m ON m.nombre = f.municipio
JOIN public.categorias AS c ON c.nombre = f.categoria
ON CONFLICT (slug) DO UPDATE SET
  municipio_id = EXCLUDED.municipio_id,
  categoria_id = EXCLUDED.categoria_id,
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  direccion = EXCLUDED.direccion,
  info_acceso = EXCLUDED.info_acceso,
  horarios = EXCLUDED.horarios,
  costo = EXCLUDED.costo,
  actividades = EXCLUDED.actividades,
  servicios_disponibles = EXCLUDED.servicios_disponibles,
  accesibilidad = EXCLUDED.accesibilidad,
  recomendaciones = EXCLUDED.recomendaciones,
  contacto = EXCLUDED.contacto,
  fuente_verificacion = EXCLUDED.fuente_verificacion,
  latitud = COALESCE(EXCLUDED.latitud, lugares_turisticos.latitud),
  longitud = COALESCE(EXCLUDED.longitud, lugares_turisticos.longitud),
  estado_aprobacion = 'borrador',
  updated_at = CURRENT_TIMESTAMP,
  deleted_at = NULL;

WITH ficha (slug, nombre_comercial, descripcion, fuente_verificacion) AS (
  VALUES
{provider_rows(services)}
)
INSERT INTO public.prestadores (
  usuario_id, slug, nombre_comercial, descripcion, fuente_verificacion,
  estado_aprobacion
)
SELECT
  NULL, slug, nombre_comercial, descripcion, fuente_verificacion, 'borrador'
FROM ficha
ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
  nombre_comercial = EXCLUDED.nombre_comercial,
  descripcion = EXCLUDED.descripcion,
  fuente_verificacion = EXCLUDED.fuente_verificacion,
  estado_aprobacion = 'borrador',
  updated_at = CURRENT_TIMESTAMP,
  deleted_at = NULL;

WITH ficha (
  prestador_slug, municipio, categoria, slug, nombre, descripcion,
  tipo_servicio, rango_precio, contacto, horario, ubicacion, reservacion,
  capacidad_requisitos, accesibilidad, lugares_relacionados,
  fuente_verificacion
) AS (
  VALUES
{service_rows(services)}
)
INSERT INTO public.servicios (
  prestador_id, municipio_id, categoria_id, slug, nombre, descripcion,
  tipo_servicio, rango_precio, contacto, horario, ubicacion, reservacion,
  capacidad_requisitos, accesibilidad, lugares_relacionados,
  fuente_verificacion, estado_aprobacion
)
SELECT
  p.id, m.id, c.id, f.slug, f.nombre, f.descripcion, f.tipo_servicio,
  f.rango_precio, f.contacto, f.horario, f.ubicacion, f.reservacion,
  f.capacidad_requisitos, f.accesibilidad, f.lugares_relacionados,
  f.fuente_verificacion, 'borrador'
FROM ficha AS f
JOIN public.prestadores AS p ON p.slug = f.prestador_slug
JOIN public.municipios AS m ON m.nombre = f.municipio
JOIN public.categorias AS c ON c.nombre = f.categoria
ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
  prestador_id = EXCLUDED.prestador_id,
  municipio_id = EXCLUDED.municipio_id,
  categoria_id = EXCLUDED.categoria_id,
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  tipo_servicio = EXCLUDED.tipo_servicio,
  rango_precio = EXCLUDED.rango_precio,
  contacto = EXCLUDED.contacto,
  horario = EXCLUDED.horario,
  ubicacion = EXCLUDED.ubicacion,
  reservacion = EXCLUDED.reservacion,
  capacidad_requisitos = EXCLUDED.capacidad_requisitos,
  accesibilidad = EXCLUDED.accesibilidad,
  lugares_relacionados = EXCLUDED.lugares_relacionados,
  fuente_verificacion = EXCLUDED.fuente_verificacion,
  estado_aprobacion = 'borrador',
  updated_at = CURRENT_TIMESTAMP,
  deleted_at = NULL;

DO $$
DECLARE
  total_lugares INT;
  total_servicios INT;
BEGIN
  SELECT COUNT(*) INTO total_lugares
  FROM public.lugares_turisticos
  WHERE slug IN ({place_slugs}) AND deleted_at IS NULL;

  SELECT COUNT(*) INTO total_servicios
  FROM public.servicios
  WHERE slug IN ({service_slugs}) AND deleted_at IS NULL;

  IF total_lugares <> 20 THEN
    RAISE EXCEPTION 'Se esperaban 20 lugares importados; se encontraron %', total_lugares;
  END IF;
  IF total_servicios <> 16 THEN
    RAISE EXCEPTION 'Se esperaban 16 servicios importados; se encontraron %', total_servicios;
  END IF;
END;
$$;
"""


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=root / "content" / "fichas" / "catalogo_extraido.json")
    parser.add_argument("--output", type=Path, default=root / "database" / "seeds" / "003_content_from_fichas.sql")
    args = parser.parse_args()

    payload = json.loads(args.input.read_text(encoding="utf-8"))
    sql = generate(payload)
    args.output.write_text(sql, encoding="utf-8", newline="\n")
    print(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
