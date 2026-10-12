import { Link } from 'react-router-dom';
import type { TourismService } from '../types/catalog';
import { WhatsAppButton } from './WhatsAppButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { ArrowRightIcon } from './brand/icons';
import { Photo } from './home/HomeUi';
import { photoLabelClass } from './ui/visuals';

const messages = defineMessages({
  fallbackType: 'Servicio turístico',
  provider: 'Prestador:',
  noDescription: 'Información en preparación.',
  price: 'Precio',
  details: 'Ver detalle',
  viewDetail: (name: string) => `Ver detalle: ${name}`,
}, {
  fallbackType: 'Tourism service',
  provider: 'Provider:',
  noDescription: 'Information coming soon.',
  price: 'Price',
  details: 'View details',
  viewDetail: (name: string) => `View details: ${name}`,
});

// Tarjeta de servicio, misma familia que PlaceCard: foto con etiqueta, municipio en versalitas, nombre en serif,
// prestador, una línea de descripción, precio con filete y WhatsApp como botón verde bosque sobrio.
// El enlace al detalle va después del botón de WhatsApp (el primer enlace con icono de la tarjeta es WhatsApp).
export const ServiceCard = ({ service }: { service: TourismService }) => {
  const { lang } = useLanguage();
  const m = useMessages(messages);
  const badge = categoryLabel(service.categoria, lang) || service.tipoServicio || m.fallbackType;

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
        <Photo
          src={service.imagenPrincipal?.url}
          name={service.nombre}
          alt={service.imagenPrincipal?.altText || service.nombre}
          imgClassName="img-zoom"
          nameClassName="text-xl"
        />
        <span className={photoLabelClass}>{badge}</span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {service.municipio && (
          <p className="truncate meta">{service.municipio}</p>
        )}
        <h3 className="font-display mt-1.5 line-clamp-2 text-[1.35rem] leading-snug text-brand-blue underline-offset-4 group-hover:underline">
          {service.nombre}
        </h3>
        <p className="mt-1 truncate text-[13px] text-brand-blue/70">{m.provider} {service.prestador}</p>
        {service.tipoServicio && service.tipoServicio !== badge && (
          <p className="mt-0.5 line-clamp-1 text-[13px] text-brand-green">{service.tipoServicio}</p>
        )}
        <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-brand-blue/70">{service.descripcion || m.noDescription}</p>
        {service.rangoPrecio && (
          <p className="mt-3 flex gap-3 border-t border-brand-sand pt-3 text-[13px] leading-5">
            <span className="shrink-0 pt-px text-xs font-medium text-brand-gold">{m.price}</span>
            <span className="line-clamp-2 text-brand-blue">{service.rangoPrecio}</span>
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-5">
          <WhatsAppButton serviceName={service.nombre} serviceId={service.id} contacto={service.contacto} className="relative z-10 min-h-10 min-w-0 px-4 text-[13px]" />
          {service.slug && (
            <Link
              to={`/servicios/${service.slug}`}
              aria-label={m.viewDetail(service.nombre)}
              className="inline-flex items-center gap-2 border-b border-brand-blue/25 pb-0.5 text-[13px] font-medium text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:border-brand-green group-hover:text-brand-green"
            >
              {m.details}
              <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};
