import { buildWhatsappUrl } from '../utils/whatsapp';
import { trackEvent } from '../services/feedbackApi';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { common } from '../i18n/common';

const messages = defineMessages({
  ariaLabel: (name: string) => `Reservar o contactar ${name} por WhatsApp`,
}, {
  ariaLabel: (name: string) => `Book or contact ${name} on WhatsApp`,
});

interface WhatsAppButtonProps {
  serviceName: string;
  serviceId?: number;
  contacto: string | null | undefined;
  size?: 'md' | 'lg';
  className?: string;
}

export const WhatsAppIcon = ({ className = 'size-5' }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} fill-current`}>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.4 9.4 0 0 1 9.43 9.44c0 5.2-4.23 9.43-9.43 9.43M20.08 3.9A11.3 11.3 0 0 0 12.05.5C5.8.5.7 5.6.7 11.86c0 2 .52 3.95 1.52 5.67L.6 23.5l6.1-1.6a11.3 11.3 0 0 0 5.35 1.36h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.33-8.03" />
  </svg>
);

export const WhatsAppButton = ({ serviceName, serviceId, contacto, size = 'md', className = '' }: WhatsAppButtonProps) => {
  const { lang } = useLanguage();
  const m = useMessages(messages);
  const c = useMessages(common);
  return (
    <a
      onClick={() => trackEvent('clic_whatsapp', { referenciaId: serviceId })}
      href={buildWhatsappUrl(serviceName, contacto, lang)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={m.ariaLabel(serviceName)}
      className={`btn btn-accent whitespace-nowrap ${size === 'lg' ? 'min-h-13 px-6 text-base' : ''} ${className}`}
    >
      <WhatsAppIcon className={size === 'lg' ? 'size-5' : 'size-4'} />
      {c.bookContact}
    </a>
  );
};
