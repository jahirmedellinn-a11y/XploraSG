import { Link } from 'react-router-dom';
import { siFacebook, siInstagram, siTiktok, siYoutube, type SocialIcon } from './brand/socialIcons';
import { useMessages } from '../i18n';
import { common } from '../i18n/common';
import { CONTACT_EMAIL, SOCIAL_LINKS } from '../config/contact';
import { BrandLogo } from './brand/BrandLogo';

// Logotipos oficiales de cada red (simple-icons, CC0), en un solo color de la paleta.
const SOCIALS: Array<{ name: string; href: string; icon: SocialIcon }> = [
  { name: 'Facebook', href: SOCIAL_LINKS.facebook, icon: siFacebook },
  { name: 'Instagram', href: SOCIAL_LINKS.instagram, icon: siInstagram },
  { name: 'TikTok', href: SOCIAL_LINKS.tiktok, icon: siTiktok },
  { name: 'YouTube', href: SOCIAL_LINKS.youtube, icon: siYoutube },
];

const YEAR = new Date().getFullYear();

const linkClass = 'text-brand-light/70 transition-colors duration-300 hover:text-white';
const headingClass = 'text-[11px] font-medium uppercase tracking-[0.22em] text-brand-light/60';

const LegalLinks = ({ label, terms, privacy, tone = 'dark' }: { label: string; terms: string; privacy: string; tone?: 'dark' | 'light' }) => (
  <nav aria-label={label} className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
    <Link to="/terminos" className={`transition-colors duration-300 ${tone === 'dark' ? 'hover:text-white' : 'hover:text-brand-green'}`}>{terms}</Link>
    <Link to="/privacidad" className={`transition-colors duration-300 ${tone === 'dark' ? 'hover:text-white' : 'hover:text-brand-green'}`}>{privacy}</Link>
  </nav>
);

/**
 * Pie de página global.
 * - variant="full": páginas públicas (eslogan editorial, enlaces, redes y legales).
 * - variant="slim": paneles internos (admin, prestador, cuenta) para no distraer del trabajo.
 */
export const Footer = ({ variant = 'full' }: { variant?: 'full' | 'slim' }) => {
  const m = useMessages(common);

  if (variant === 'slim') {
    return (
      <footer className="mb-16 mt-12 border-t border-brand-sand text-brand-blue/70 lg:mb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" className="h-7 w-auto" />
            <span>{m.rights(YEAR)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors duration-300 hover:text-brand-green">{CONTACT_EMAIL}</a>
            <LegalLinks label={m.legalNav} terms={m.terms} privacy={m.privacy} tone="light" />
          </div>
        </div>
      </footer>
    );
  }

  // "Explora. Conecta." + "Vive la Sierra Gorda." en cursiva.
  const sloganParts = m.slogan.split(/(?<=\.)\s+/);
  const sloganLead = sloganParts.slice(0, -1).join(' ');
  const sloganLast = sloganParts[sloganParts.length - 1];

  return (
    <footer className="mt-16 bg-brand-blue pb-16 text-brand-light lg:pb-0">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
          <div className="lg:col-span-5">
            <BrandLogo variant="horizontal" tone="light" />
            <p className="font-display mt-8 text-[2rem] leading-[1.1] text-brand-light sm:text-4xl">
              {sloganLead} <em className="italic text-brand-sand/80">{sloganLast}</em>
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-brand-light/60">{m.footerTagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:pt-3">
            <nav aria-label={m.footerNav}>
              <p className={headingClass}>{m.footerDiscover}</p>
              <ul className="mt-5 grid gap-3 text-sm">
                <li><Link to="/explorar" className={linkClass}>{m.places}</Link></li>
                <li><Link to="/servicios" className={linkClass}>{m.providers}</Link></li>
                <li><Link to="/agenda" className={linkClass}>{m.agenda}</Link></li>
                <li><Link to="/mapa" className={linkClass}>{m.map}</Link></li>
              </ul>
            </nav>
            <div>
              <p className={headingClass}>{m.footerPlan}</p>
              <ul className="mt-5 grid gap-3 text-sm">
                <li><Link to="/asistente" className={linkClass}>{m.assistant}</Link></li>
                <li><Link to="/favoritos" className={linkClass}>{m.favorites}</Link></li>
                <li><Link to="/encuesta" className={linkClass}>{m.rateUs}</Link></li>
              </ul>
            </div>
            <div>
              <p className={headingClass}>{m.footerProject}</p>
              <ul className="mt-5 grid gap-3 text-sm">
                <li><Link to="/nosotros" className={linkClass}>{m.aboutUs}</Link></li>
                <li><a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{m.footerContact}</a></li>
                <li><Link to="/terminos" className={linkClass}>{m.terms}</Link></li>
                <li><Link to="/privacidad" className={linkClass}>{m.privacy}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-light/60">
            {m.writeUs}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-light underline decoration-white/25 underline-offset-4 transition-colors duration-300 hover:decoration-white">
              {CONTACT_EMAIL}
            </a>
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-brand-light/60">{m.followUs}</p>
            <ul className="flex gap-2" aria-label={m.socialNav}>
              {SOCIALS.map(({ name, href, icon }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={m.socialLabel(name)}
                    title={name}
                    className="grid size-10 place-items-center rounded-full border border-white/15 text-brand-light/80 transition-colors duration-300 hover:border-white/50 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d={icon.path} /></svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-[11px] text-brand-light/60 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <p>{m.rights(YEAR)}</p>
            <p className="text-brand-light/60">{m.footerMade} · {m.credits}</p>
          </div>
          <LegalLinks label={m.legalNav} terms={m.terms} privacy={m.privacy} />
        </div>
      </div>
    </footer>
  );
};
