"""Genera las guías descargables de XploraSG a partir de las fichas verificadas.

Uso (desde la raíz del proyecto):
  1. Exporta los lugares aprobados a scripts/guias/lugares.json (consulta al final de este archivo).
  2. python3 scripts/guias/build.py          -> crea los HTML (requiere Pillow)
  3. node scripts/guias/print.mjs            -> imprime los PDF en frontend/public/guias (requiere Playwright)

Todo el contenido viene de la base: no se inventan horarios, costos, coordenadas ni distancias.
Fotos: content/fichas/media/lugares/<slug>.(jpg|webp|png) o la carpeta indicada en XPLORA_FOTOS.
"""
import base64, html, io, json, math, os, re, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
REPO = PROJECT / 'frontend'
FONTS = REPO / 'node_modules/@fontsource'
PHOTOS = pathlib.Path(os.environ.get('XPLORA_FOTOS', PROJECT / 'content/fichas/media/lugares'))

def photo_for(slug):
    for ext in ('webp', 'jpg', 'jpeg', 'png'):
        candidate = PHOTOS / f'{slug}.{ext}'
        if candidate.exists():
            return candidate
    return None

places = json.loads((ROOT / 'lugares.json').read_text())
by_slug = {p['slug']: p for p in places}

MUNICIPIOS = {  # cabeceras municipales (tabla municipios)
    'Jalpan de Serra': (21.2186, -99.4722), 'Pinal de Amoles': (21.1378, -99.6267),
    'Arroyo Seco': (21.5475, -99.6897), 'Landa de Matamoros': (21.1861, -99.3183),
    'San Joaquín': (20.9167, -99.5667), 'Peñamiller': (21.0500, -99.8167),
}
# Fotos con marca de agua o baja calidad: no se incluyen en el catálogo.
EXCLUDED_PHOTOS = {'mision-de-san-miguel-conca', 'mision-de-tilaco', 'rio-verdito', 'canon-del-paraiso'}

esc = lambda s: html.escape(s or '')
clean = lambda s: re.sub(r'\s*\[Enlace a Google Maps\]', '', s or '').strip()

def font_face():
    faces = [('Fraunces', 'fraunces/files/fraunces-latin-400-normal.woff2', 400, 'normal'),
             ('Fraunces', 'fraunces/files/fraunces-latin-500-normal.woff2', 500, 'normal'),
             ('Fraunces', 'fraunces/files/fraunces-latin-400-italic.woff2', 400, 'italic'),
             ('Poppins', 'poppins/files/poppins-latin-400-normal.woff2', 400, 'normal'),
             ('Poppins', 'poppins/files/poppins-latin-500-normal.woff2', 500, 'normal')]
    out = []
    for fam, path, w, st in faces:
        data = base64.b64encode((FONTS / path).read_bytes()).decode()
        out.append(f"@font-face{{font-family:'{fam}';src:url(data:font/woff2;base64,{data}) format('woff2');font-weight:{w};font-style:{st}}}")
    return '\n'.join(out)

def img_data(path: pathlib.Path, width=900, quality=72):
    im = Image.open(path).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=quality, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

LOGO = 'data:image/png;base64,' + base64.b64encode((lambda: (lambda b: (Image.open(REPO / 'public/brand/xplorasg-logo.webp').convert('RGBA').save(b, 'PNG'), b.getvalue())[1])(io.BytesIO()))()).decode()

CSS = """
:root{--ink:#1F2C24;--green:#2F5D3E;--sage:#6E8B6F;--terra:#9E552F;--cream:#F3EDE2;--sand:#E6DCCB;--paper:#FAF7F1}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Poppins',sans-serif;color:var(--ink);background:var(--paper);font-size:8.6pt;line-height:1.55}
.page{width:148mm;height:210mm;padding:14mm 13mm 12mm;position:relative;overflow:hidden;page-break-after:always;background:var(--paper)}
.page:last-child{page-break-after:auto}
h1,h2,h3,.serif{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-.01em}
h1{font-size:30pt;line-height:1.02}
h2{font-size:17pt;line-height:1.1}
h3{font-size:12pt;line-height:1.2}
em{font-style:italic;color:var(--green)}
.eyebrow{display:flex;align-items:center;gap:6px;font-size:6.6pt;letter-spacing:.22em;text-transform:uppercase;color:var(--terra);font-weight:500}
.eyebrow:before{content:'';width:16px;height:1px;background:currentColor}
.rule{border-top:1px solid var(--sand)}
.muted{color:rgba(31,44,36,.72)}
.folio{position:absolute;bottom:7mm;left:13mm;right:13mm;display:flex;justify-content:space-between;font-size:6.5pt;color:rgba(31,44,36,.7);border-top:1px solid var(--sand);padding-top:2.5mm}
dl.facts{display:grid;grid-template-columns:20mm 1fr;border-top:1px solid var(--sand)}
dl.facts dt,dl.facts dd{border-bottom:1px solid var(--sand);padding:1.6mm 0}
dl.facts dt{font-size:7pt;color:rgba(31,44,36,.72);font-weight:500}
.cover{background:var(--cream);display:flex;flex-direction:column}
.cover .logo{width:44mm}
.cover .bottom{margin-top:auto}
.note{border-left:1px solid var(--sage);padding-left:3mm;font-size:7.4pt}
.num{font-family:'Fraunces',serif;color:var(--terra);font-size:15pt;line-height:1}
"""

def page(inner, folio_left, n, cls=''):
    return f"<section class='page {cls}'>{inner}<div class='folio'><span>{folio_left}</span><span>{n}</span></div></section>"

def doc(title, pages):
    return f"<!doctype html><html lang='es'><head><meta charset='utf-8'><title>{esc(title)}</title><style>{font_face()}{CSS}</style></head><body>{''.join(pages)}</body></html>"

# ---------------------------------------------------------------- Guía de bolsillo
def project(lat, lon, w, h, box=(20.82, 21.62, -99.92, -99.10)):
    s, n, wl, e = box
    k = math.cos(math.radians(21.2))
    x = (lon - wl) / (e - wl) * w
    y = (n - lat) / (n - s) * h
    return x, y

def schematic_map():
    W, H = 300, 300
    exact = [p for p in places if p['lat'] is not None]
    parts = [f"<svg viewBox='0 0 {W} {H}' width='100%' xmlns='http://www.w3.org/2000/svg' font-family='Poppins' font-size='7.2'>",
             f"<rect x='0.5' y='0.5' width='{W-1}' height='{H-1}' fill='#FAF7F1' stroke='#E6DCCB'/>"]
    # retícula de coordenadas cada 0.2°
    for lat in [21.0, 21.2, 21.4, 21.6]:
        _, y = project(lat, -99.9, W, H)
        parts.append(f"<line x1='0' x2='{W}' y1='{y:.1f}' y2='{y:.1f}' stroke='#E6DCCB' stroke-width='.6'/><text x='4' y='{y-2:.1f}' fill='#6b7468' font-size='5.6'>{lat:.1f}° N</text>")
    for lon in [-99.8, -99.6, -99.4, -99.2]:
        x, _ = project(21.2, lon, W, H)
        parts.append(f"<line y1='0' y2='{H}' x1='{x:.1f}' x2='{x:.1f}' stroke='#E6DCCB' stroke-width='.6'/><text x='{x+2:.1f}' y='{H-4}' fill='#6b7468' font-size='5.6'>{abs(lon):.1f}° O</text>")
    for i, p in enumerate(exact, 1):
        x, y = project(p['lat'], p['lon'], W, H)
        parts.append(f"<circle cx='{x:.1f}' cy='{y:.1f}' r='3.2' fill='#2F5D3E'/><text x='{x:.1f}' y='{y+2.3:.1f}' fill='#fff' font-size='4.6' text-anchor='middle'>{i}</text>")
    for name, (lat, lon) in MUNICIPIOS.items():
        x, y = project(lat, lon, W, H)
        dx, dy, anchor = {'Jalpan de Serra': (0, -7, 'middle'), 'Landa de Matamoros': (2, 15, 'end')}.get(name, (6, 2.5, 'start'))
        parts.append(f"<circle cx='{x:.1f}' cy='{y:.1f}' r='3.4' fill='#FAF7F1' stroke='#1F2C24' stroke-width='1'/>"
                     f"<text x='{x+dx:.1f}' y='{y+dy:.1f}' fill='#1F2C24' font-family='Fraunces' font-size='8' text-anchor='{anchor}'>{esc(name)}</text>")
        if name == 'Pinal de Amoles':
            parts.append(f"<path d='M{x-4:.1f} {y+16:.1f} l4 -7 l4 7 z' fill='none' stroke='#9E552F' stroke-width='1'/>"
                         f"<text x='{x+6:.1f}' y='{y+15.5:.1f}' fill='#9E552F' font-size='6.6'>2 miradores (p. 4)</text>")
    parts.append('</svg>')
    return ''.join(parts), exact

def pocket_guide():
    svg, exact = schematic_map()
    pages = []
    pages.append(page(f"""
      <img class='logo' src='{LOGO}' alt='XploraSG'>
      <div class='bottom'>
        <p class='eyebrow'>Guía de bolsillo</p>
        <h1 style='margin-top:5mm'>Miradores e <em>itinerarios</em> de la Sierra Gorda</h1>
        <p style='margin-top:5mm;max-width:100mm' class='muted'>Un mapa esquemático, los miradores con su horario y acceso, y tres recorridos armados con las fichas verificadas de XploraSG. Imprímela o guárdala en tu teléfono: funciona sin señal.</p>
        <p style='margin-top:8mm;font-size:7pt' class='muted'>Edición octubre 2026 · Datos de las fichas publicadas en XploraSG. Confirma horarios y costos antes de salir.</p>
      </div>""", 'XploraSG · Guía de bolsillo', 1, 'cover'))

    legend = ''.join(f"<li style='display:flex;gap:2.5mm;padding:1.1mm 0;border-bottom:1px solid var(--sand)'><b style='color:var(--green);width:4mm'>{i}</b>{esc(p['nombre'])} <span class='muted'>· {esc(p['municipio'])}</span></li>" for i, p in enumerate(exact, 1))
    pages.append(page(f"""
      <p class='eyebrow'>Mapa esquemático</p>
      <h2 style='margin-top:3mm'>Seis municipios, un mismo paisaje</h2>
      <div style='margin:4mm auto 0;width:100mm'>{svg}</div>
      <ul style='list-style:none;margin-top:3mm;font-size:7.4pt;border-top:1px solid var(--sand)'>{legend}</ul>
      <p class='note' style='margin-top:3mm'>○ Cabecera municipal · ● Lugar con coordenadas verificadas · △ Mirador (ubicado en su municipio; la ficha aún no tiene coordenadas). Esquema orientativo: no sustituye un mapa de navegación.</p>
    """, 'Mapa', 2))

    miradores = [by_slug['cuatro-palos'], by_slug['mirador-de-cristal']]
    def facts(p):
        rows = [('Municipio', p['municipio']), ('Horario', p['horarios']), ('Costo', p['costo']), ('Cómo llegar', p['acceso']), ('Antes de ir', p['recomendaciones'])]
        return '<dl class="facts">' + ''.join(f"<dt>{k}</dt><dd>{esc(clean(v))}</dd>" for k, v in rows if v) + '</dl>'
    pages.append(page(f"""
      <p class='eyebrow'>Miradores</p>
      <h2 style='margin-top:3mm'>Donde la sierra se ve completa</h2>
      <h3 style='margin-top:6mm'>{esc(miradores[0]['nombre'])}</h3>
      <p class='muted' style='margin:1.5mm 0 3mm'>{esc(miradores[0]['descripcion'])}</p>
      {facts(miradores[0])}
    """, 'Miradores', 3))
    pages.append(page(f"""
      <p class='eyebrow'>Miradores</p>
      <h3 style='margin-top:4mm'>{esc(miradores[1]['nombre'])}</h3>
      <p class='muted' style='margin:1.5mm 0 3mm'>{esc(miradores[1]['descripcion'])}</p>
      {facts(miradores[1])}
      <p class='note' style='margin-top:6mm'>Los dos miradores están en Pinal de Amoles, la parte más alta y fría de la ruta. Si hay tormenta, no subas: así lo indica la ficha de Cuatro Palos.</p>
    """, 'Miradores', 4))

    routes = [
        ('Ruta de las misiones', 'Las cinco misiones franciscanas, Patrimonio Mundial de la UNESCO. Pensada para 2 días con noche en Jalpan.',
         ['mision-de-jalpan', 'mision-de-landa', 'mision-de-tilaco', 'mision-de-tancoyol', 'mision-de-san-miguel-conca']),
        ('Pinal de Amoles: miradores y bosque', 'Un día de montaña. Sal de madrugada para ver el mar de nubes en Cuatro Palos.',
         ['cuatro-palos', 'mirador-de-cristal', 'el-chuveje']),
        ('Agua y cañones', 'Ríos, pozas y cascadas. Sólo con buen tiempo: con lluvia, los ríos y cañones crecen rápido.',
         ['las-adjuntas', 'cascadas-maravilla', 'balneario-el-oasis']),
    ]
    for idx, (title, intro, slugs) in enumerate(routes):
        steps = ''.join(
            f"<li style='display:grid;grid-template-columns:9mm 1fr;padding:2.4mm 0;border-bottom:1px solid var(--sand)'><span class='num'>{i:02d}</span>"
            f"<div><p class='serif' style='font-size:10pt'>{esc(by_slug[s]['nombre'])}</p><p class='muted' style='font-size:7.2pt'>{esc(by_slug[s]['municipio'])} · {esc(clean(by_slug[s]['horarios']))}</p>"
            f"<p style='font-size:7.2pt'>{esc(clean(by_slug[s]['costo']))}</p></div></li>"
            for i, s in enumerate(slugs, 1))
        pages.append(page(f"""
          <p class='eyebrow'>Itinerario {idx + 1} de 3</p>
          <h2 style='margin-top:3mm'>{esc(title)}</h2>
          <p class='muted' style='margin-top:2mm'>{esc(intro)}</p>
          <ol style='list-style:none;margin-top:5mm;border-top:1px solid var(--sand)'>{steps}</ol>
          <p class='note' style='margin-top:4mm'>El orden es una propuesta. Los tiempos de traslado dependen del camino y del clima: consúltalos en el mapa de XploraSG antes de salir.</p>
        """, 'Itinerarios', 5 + idx))

    tips = [
        ('Lleva efectivo', 'En varias comunidades no hay terminal y las cuotas ejidales se pagan en el lugar.'),
        ('Prepárate para no tener señal', 'Abre las fichas y guárdalas en Favoritos antes de salir; descarga el mapa de la zona en tu teléfono.'),
        ('Respeta la lluvia', 'Con tormenta evita ríos, cañones y cascadas. Las crecidas llegan rápido.'),
        ('Contrata guías locales', 'Algunos sitios, como el Sótano del Barro o las pinturas rupestres, se visitan sólo con guías de la comunidad.'),
        ('No dejes rastro', 'Llévate tu basura, usa bloqueador biodegradable y no nades donde la ficha lo prohíbe.'),
    ]
    tip_html = ''.join(f"<li style='padding:2.4mm 0;border-bottom:1px solid var(--sand)'><p class='serif' style='font-size:10.5pt'>{t}</p><p class='muted'>{d}</p></li>" for t, d in tips)
    pages.append(page(f"""
      <p class='eyebrow'>Antes de salir</p>
      <h2 style='margin-top:3mm'>Cinco cosas que conviene saber</h2>
      <ul style='list-style:none;margin-top:5mm;border-top:1px solid var(--sand)'>{tip_html}</ul>
      <p style='margin-top:6mm' class='muted'>Más lugares, horarios y el clima de hoy en <b style='color:var(--ink)'>XploraSG</b>. Pregúntale a Chatboot por una ruta para hoy.</p>
    """, 'Antes de salir', 8))
    return doc('XploraSG · Guía de bolsillo', pages)

# ---------------------------------------------------------------- Catálogo de vistas
def views_catalog():
    spots = [p for p in places if p['slug'] not in EXCLUDED_PHOTOS and photo_for(p['slug'])]
    pages = [page(f"""
      <img class='logo' src='{LOGO}' alt='XploraSG'>
      <div class='bottom'>
        <p class='eyebrow'>Catálogo de vistas &amp; fotografías</p>
        <h1 style='margin-top:5mm'>Puntos <em>fotográficos</em> de la Sierra Gorda</h1>
        <p style='margin-top:5mm;max-width:100mm' class='muted'>{len(spots)} lugares con su fotografía, qué retratar y cuándo ir, según las fichas verificadas de XploraSG.</p>
        <p style='margin-top:8mm;font-size:7pt' class='muted'>Edición octubre 2026 · Fotografías de las fichas del proyecto XploraSG.</p>
      </div>""", 'XploraSG · Catálogo de vistas', 1, 'cover')]
    n = 2
    for i in range(0, len(spots), 2):
        blocks = []
        for p in spots[i:i + 2]:
            photo = img_data(photo_for(p['slug']), width=820, quality=70)
            what = clean(p['actividades']) or ''
            blocks.append(f"""
              <article style='margin-bottom:5mm'>
                <img src='{photo}' alt='{esc(p['nombre'])}' style='width:100%;height:58mm;object-fit:cover;border-radius:2mm;display:block'>
                <div style='display:flex;justify-content:space-between;gap:4mm;margin-top:2.5mm;align-items:baseline'>
                  <h3>{esc(p['nombre'])}</h3><span class='muted' style='font-size:7pt;white-space:nowrap'>{esc(p['municipio'])}</span>
                </div>
                <dl class='facts' style='margin-top:1.5mm;font-size:7.3pt'>
                  {f"<dt>Qué retratar</dt><dd>{esc(what)}</dd>" if what else ''}
                  <dt>Cuándo ir</dt><dd>{esc(clean(p['horarios']))}</dd>
                </dl>
              </article>""")
        pages.append(page(''.join(blocks), 'Vistas & fotografías', n)); n += 1
    pages.append(page("""
      <p class='eyebrow'>Fotografía responsable</p>
      <h2 style='margin-top:3mm'>Antes de disparar</h2>
      <ul style='list-style:none;margin-top:5mm;border-top:1px solid var(--sand)'>
        <li style='padding:2.4mm 0;border-bottom:1px solid var(--sand)'>Pide permiso antes de fotografiar a personas de las comunidades.</li>
        <li style='padding:2.4mm 0;border-bottom:1px solid var(--sand)'>En misiones y templos, respeta las celebraciones: no uses flash durante misa.</li>
        <li style='padding:2.4mm 0;border-bottom:1px solid var(--sand)'>Quédate en los senderos y miradores marcados; no te acerques a bordes ni a caídas de agua.</li>
        <li style='padding:2.4mm 0;border-bottom:1px solid var(--sand)'>En el Sótano del Barro, observa a las guacamayas en silencio: la ficha prohíbe hacer ruido al borde del sótano.</li>
      </ul>
      <p style='margin-top:6mm' class='muted'>Comparte tus fotos etiquetando a <b style='color:var(--ink)'>@xplora.sg</b>.</p>
    """, 'Vistas & fotografías', n))
    return doc('XploraSG · Catálogo de vistas & fotografías', pages), len(spots), n

(ROOT / 'guia-de-bolsillo.html').write_text(pocket_guide())
catalog, count, pages = views_catalog()
(ROOT / 'catalogo-de-vistas.html').write_text(catalog)
print('ok', count, 'puntos,', pages, 'páginas en el catálogo')

# Consulta para exportar lugares.json (psql -At):
# select json_agg(row_to_json(t)) from (
#   select l.slug, l.nombre, mu.nombre municipio, ca.nombre categoria, l.latitud::float8 lat, l.longitud::float8 lon,
#          l.descripcion, l.actividades, l.horarios, l.costo, l.info_acceso acceso, l.recomendaciones, l.direccion
#   from lugares_turisticos l join municipios mu on mu.id = l.municipio_id join categorias ca on ca.id = l.categoria_id
#   where l.estado_aprobacion = 'aprobado' and l.deleted_at is null order by mu.nombre, l.nombre) t;
