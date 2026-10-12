import { useEffect, useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, useMessages } from '../i18n';
import { common } from '../i18n/common';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Footer } from '../components/Footer';
import { AssistantWidget } from '../components/assistant/AssistantWidget';
import {
  CalendarIcon, CloseIcon, CompassIcon, HeartIcon, LodgingIcon, MapIcon, ShieldIcon,
} from '../components/brand/icons';

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

// Navegación de texto con un subrayado fino para la sección activa.
const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative inline-flex h-10 items-center whitespace-nowrap px-1 text-sm transition-colors duration-300 after:absolute after:inset-x-1 after:bottom-1.5 after:h-px after:origin-left after:bg-brand-blue after:transition-transform after:duration-300 ${
    isActive
      ? 'text-brand-blue after:scale-x-100'
      : 'text-brand-blue/75 after:scale-x-0 hover:text-brand-blue hover:after:scale-x-100'
  }`;

// Menú desplegable móvil: filas de texto con filete.
const menuClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 border-b border-brand-sand py-3.5 text-[15px] transition-colors duration-300 ${
    isActive ? 'font-medium text-brand-green' : 'text-brand-blue/80 hover:text-brand-blue'
  }`;

const bottomNavClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex h-full flex-col items-center justify-center gap-1 text-[10px] transition-colors duration-300 before:absolute before:inset-x-5 before:top-0 before:h-px before:transition-colors before:duration-300 ${
    isActive ? 'font-medium text-brand-green before:bg-brand-green' : 'text-brand-blue/70 before:bg-transparent hover:text-brand-blue'
  }`;

const iconButton = 'grid size-10 place-items-center rounded-full text-brand-blue/75 transition-colors duration-300 hover:bg-brand-light hover:text-brand-blue';

export const AppShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const { isAuthenticated, user, sessionNotice, dismissSessionNotice } = useAuth();
  const { pathname } = useLocation();
  const { lang, setLang } = useLanguage();
  const m = useMessages(common);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Cerrar al cambiar de página (se deriva durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  const mainLinks: Array<{ to: string; label: string; Icon: IconType }> = [
    { to: '/explorar', label: m.explore, Icon: CompassIcon },
    { to: '/mapa', label: m.map, Icon: MapIcon },
    { to: '/servicios', label: m.services, Icon: LodgingIcon },
    { to: '/agenda', label: m.agenda, Icon: CalendarIcon },
  ];

  const roleLink = user?.rol === 'administrador'
    ? { to: '/admin', label: m.adminPanel }
    : user?.rol === 'prestador'
      ? { to: '/mi-negocio', label: m.myBusiness }
      : null;

  const languageButton = (extra = '') => (
    <button
      type="button"
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      aria-label={m.switchToLabel}
      title={m.switchToLabel}
      lang={lang === 'es' ? 'en' : 'es'}
      className={`inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tracking-[0.08em] text-brand-blue/75 transition-colors duration-300 hover:bg-brand-light hover:text-brand-blue ${extra}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
      </svg>
      {lang === 'es' ? 'EN' : 'ES'}
    </button>
  );

  const firstName = user?.nombre?.split(' ')[0] || m.myAccount;

  return (
    <div className="min-h-screen bg-brand-paper text-brand-blue">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-full focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white">
        {lang === 'en' ? 'Skip to content' : 'Saltar al contenido'}
      </a>

      <header className={`sticky top-0 z-[1000] border-b bg-brand-paper transition-colors duration-300 ${scrolled ? 'border-brand-sand' : 'border-transparent'}`}>
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-5 sm:gap-4 lg:px-8">
          <Link to="/" className="shrink-0 rounded-2xl transition-all duration-300 hover:opacity-85" aria-label={m.homeLabel}>
            <BrandLogo variant="horizontal" className="[&_.brand-tagline]:hidden sm:[&_.brand-tagline]:flex" />
          </Link>

          <nav className="mx-auto hidden items-center gap-5 lg:flex xl:gap-8" aria-label={m.mainNav}>
            {mainLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navClass}>{label}</NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-1 lg:ml-0 lg:flex">
            <span
              role="status"
              title={isOnline ? m.onlineTitle : m.offlineTitle}
              className={`mr-1 inline-flex h-8 items-center gap-2 rounded-full px-2.5 text-xs ${isOnline ? 'text-brand-blue/70' : 'bg-ochre-100 font-medium text-ochre-950'}`}
            >
              <i className={`size-1.5 rounded-full ${isOnline ? 'bg-brand-green' : 'bg-ochre-600'}`} aria-hidden="true" />
              <span className={`whitespace-nowrap ${isOnline ? 'sr-only xl:not-sr-only' : ''} ${isOnline && isAuthenticated ? 'xl:sr-only' : ''}`}>{isOnline ? m.online : m.offline}</span>
            </span>
            {languageButton()}
            <NavLink to="/favoritos" aria-label={m.favorites} title={m.favorites} className={({ isActive }) => `${iconButton} ${isActive ? 'bg-brand-light text-brand-green' : ''}`}>
              <HeartIcon className="size-[18px]" />
            </NavLink>
            <span className="mx-2 h-5 w-px bg-brand-sand" aria-hidden="true" />
            {roleLink && (
              <NavLink to={roleLink.to} className={({ isActive }) => `mr-1 inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm transition-colors duration-300 ${isActive ? 'text-brand-green' : 'text-brand-blue/75 hover:text-brand-green'}`}>
                <ShieldIcon className="size-4" />
                {roleLink.label}
              </NavLink>
            )}
            {isAuthenticated ? (
              <Link to="/dashboard" className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-brand-blue/15 pl-1 pr-4 text-sm text-brand-blue transition-colors duration-300 hover:border-brand-blue/40">
                <span className="font-display grid size-8 place-items-center rounded-full bg-brand-light text-sm text-brand-blue">{firstName.charAt(0).toUpperCase()}</span>
                <span className="max-w-28 truncate">{firstName}</span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary h-10 min-h-0 px-5">
                {m.login}
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <span role="status" title={isOnline ? m.onlineTitle : m.offlineTitle} className="hidden size-10 place-items-center min-[420px]:grid">
              <i className={`size-2 rounded-full ${isOnline ? 'bg-brand-green' : 'bg-ochre-600'}`} aria-hidden="true" />
              <span className="sr-only">{isOnline ? m.online : m.offline}</span>
            </span>
            {languageButton()}
            <button
              type="button"
              className={`${iconButton} border border-brand-blue/15`}
              aria-label={m.openMenu}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <CloseIcon className="size-5" /> : (
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="max-h-[calc(100dvh-72px-4rem)] overflow-y-auto border-t border-brand-sand bg-brand-paper px-5 pb-6 pt-2 lg:hidden" aria-label={m.mobileNav}>
            <div className="mx-auto grid max-w-7xl">
              {mainLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} className={menuClass}><span className="font-display text-xl">{label}</span></NavLink>
              ))}
              <NavLink to="/asistente" className={menuClass}>{m.assistant}</NavLink>
              <NavLink to="/favoritos" className={menuClass}><HeartIcon className="size-4" />{m.favorites}</NavLink>
              <NavLink to="/nosotros" className={menuClass}>{m.aboutUs}</NavLink>
              {roleLink && <NavLink to={roleLink.to} className={menuClass}><ShieldIcon className="size-4" />{roleLink.label}</NavLink>}
              <NavLink to={isAuthenticated ? '/dashboard' : '/login'} className={({ isActive }) => `${menuClass({ isActive })} border-b-0`}>
                {isAuthenticated ? m.myAccount : m.login}
              </NavLink>
            </div>
          </nav>
        )}
        {!isOnline && (
          <div role="status" className="border-t border-ochre-200 bg-ochre-100 px-5 py-2 text-center text-xs font-medium text-ochre-950">
            {m.offlineBanner}
          </div>
        )}
        {sessionNotice && pathname !== '/login' && (
          <div role="status" className="flex items-center justify-center gap-3 border-t border-ochre-200 bg-ochre-50 px-5 py-2 text-xs font-medium text-ochre-900">
            {sessionNotice}
            <Link to="/login" className="underline underline-offset-2">{m.login}</Link>
            <button type="button" onClick={dismissSessionNotice} aria-label={m.closeNotice}><CloseIcon className="size-3.5" /></button>
          </div>
        )}
      </header>

      {/* Al cambiar de idioma se vuelve a montar la página para pedir el contenido traducido. */}
      <main id="contenido" className="pb-20 lg:pb-0"><Outlet key={lang} /></main>

      {/* Paneles internos con pie discreto; páginas públicas con el pie completo. */}
      <Footer variant={/^\/(admin|mi-negocio|dashboard)/.test(pathname) ? 'slim' : 'full'} />

      <AssistantWidget key={lang} />

      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-brand-sand bg-brand-paper pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label={m.bottomNav}>
        <div className="grid h-16 grid-cols-5 items-stretch px-1">
          {[...mainLinks, { to: '/favoritos', label: m.favorites, Icon: HeartIcon }].map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={bottomNavClass}>
              <Icon className="size-[21px]" strokeWidth={1.4} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
