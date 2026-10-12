// Textos fijos de las páginas legales (el cuerpo de cada documento vive en pages/LegalPages.tsx).
import { defineMessages } from '.';

export const legalMessages = defineMessages({
  lastUpdated: 'Última actualización: 6 de octubre de 2026',
  discrepancyNote: '',
  contactPlaceholder: '[correo de contacto del proyecto]',
  privacyEyebrow: 'Protección de datos',
  privacyTitle: 'Aviso de privacidad',
  termsEyebrow: 'Condiciones',
  termsTitle: 'Términos de uso',
}, {
  lastUpdated: 'Last updated: October 6, 2026',
  discrepancyNote: 'This English version is provided for convenience. In case of discrepancy, the Spanish version prevails.',
  contactPlaceholder: '[project contact email]',
  privacyEyebrow: 'Data protection',
  privacyTitle: 'Privacy notice',
  termsEyebrow: 'Conditions',
  termsTitle: 'Terms of use',
});
