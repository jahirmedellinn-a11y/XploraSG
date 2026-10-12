// Panel de recursos de las pantallas de cuenta: guías ilustradas en PDF para llevar sin señal.
// Los PDF viven en public/guias y se generan con los datos de las fichas verificadas (scripts/guias en la raíz del proyecto).
import { defineMessages, useMessages } from '../../i18n';
import { DownloadIcon } from '../brand/icons';

const messages = defineMessages({
  eyebrow: 'Guías para llevar',
  title: 'Descárgalas antes de salir',
  intro: 'Funcionan sin señal: guárdalas en tu teléfono o imprímelas.',
  items: [
    {
      file: '/guias/xplorasg-guia-de-bolsillo.pdf',
      title: 'Guía de bolsillo',
      text: 'Mapa de miradores e itinerarios por la Sierra Gorda.',
      meta: 'PDF · 8 páginas · 300 KB',
    },
    {
      file: '/guias/xplorasg-catalogo-de-vistas.pdf',
      title: 'Catálogo de vistas & fotografías',
      text: 'Puntos fotográficos destacados, qué retratar y cuándo ir.',
      meta: 'PDF · 10 páginas · 1.4 MB',
    },
  ],
  download: (title: string, meta: string) => `Descargar ${title} (${meta})`,
}, {
  eyebrow: 'Guides to take along',
  title: 'Download them before you go',
  intro: 'They work with no signal: save them on your phone or print them.',
  items: [
    {
      file: '/guias/xplorasg-guia-de-bolsillo.pdf',
      title: 'Pocket guide',
      text: 'Map of viewpoints and itineraries across the Sierra Gorda (in Spanish).',
      meta: 'PDF · 8 pages · 300 KB',
    },
    {
      file: '/guias/xplorasg-catalogo-de-vistas.pdf',
      title: 'Views & photography catalog',
      text: 'Featured photo spots, what to shoot and when to go (in Spanish).',
      meta: 'PDF · 10 pages · 1.4 MB',
    },
  ],
  download: (title: string, meta: string) => `Download ${title} (${meta})`,
});

export const GuideDownloads = ({ className = '' }: { className?: string }) => {
  const m = useMessages(messages);
  return (
    <section className={className} aria-labelledby="guide-downloads">
      <p className="eyebrow">{m.eyebrow}</p>
      <h2 id="guide-downloads" className="font-display mt-4 text-2xl leading-tight text-brand-blue">{m.title}</h2>
      <p className="mt-2 text-sm leading-6 text-brand-blue/75">{m.intro}</p>
      <ul className="mt-6 border-b border-brand-sand">
        {m.items.map((item) => (
          <li key={item.file} className="border-t border-brand-sand">
            <a
              href={item.file}
              download
              aria-label={m.download(item.title, item.meta)}
              className="group flex items-start gap-4 py-4"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-brand-blue/20 text-brand-blue transition-colors duration-300 group-hover:border-brand-green group-hover:bg-brand-green group-hover:text-white">
                <DownloadIcon className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="font-display block text-lg leading-snug text-brand-blue underline decoration-transparent underline-offset-4 transition-colors duration-300 group-hover:decoration-brand-green/50">{item.title}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-brand-blue/75">{item.text}</span>
                <span className="meta mt-1 block">{item.meta}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};
