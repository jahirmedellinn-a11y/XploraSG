// Construye el enlace "Reservar / Contactar" por WhatsApp.
// Prioridad: teléfono real del contacto del servicio → VITE_WHATSAPP_RESERVAS → número de demostración.
const FALLBACK_WHATSAPP =
  (import.meta.env.VITE_WHATSAPP_RESERVAS as string | undefined)?.replace(/\D/g, '') || '524411234567';

const PHONE_PATTERN = /(?:\+?52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)\d{3,4}[\s.-]?\d{4}/;

export const whatsappNumberFrom = (contacto: string | null | undefined): string => {
  const match = contacto?.match(PHONE_PATTERN);
  const digits = match?.[0].replace(/\D/g, '') ?? '';
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  return FALLBACK_WHATSAPP;
};

export const hasRealPhone = (contacto: string | null | undefined): boolean => {
  const digits = contacto?.match(PHONE_PATTERN)?.[0].replace(/\D/g, '') ?? '';
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('52'));
};

export const buildWhatsappUrl = (serviceName: string, contacto: string | null | undefined, lang: 'es' | 'en' = 'es'): string => {
  const spanish = `Hola, vi "${serviceName}" en XploraSG y me gustaría información para reservar.`;
  // Los prestadores hablan español: al turista extranjero se le prepara un mensaje bilingüe.
  const message = lang === 'en'
    ? `Hello! I saw "${serviceName}" on XploraSG and I'd like booking information.\n\n(${spanish} Escribo en inglés.)`
    : spanish;
  return `https://wa.me/${whatsappNumberFrom(contacto)}?text=${encodeURIComponent(message)}`;
};
