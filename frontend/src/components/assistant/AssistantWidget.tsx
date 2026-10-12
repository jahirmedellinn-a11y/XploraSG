// Chatboot flotante: botón en papel con el pájaro de línea fina. Se abre como tarjeta en escritorio
// y como hoja inferior en móvil, sin tapar la navegación principal.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMessages } from '../../i18n';
import { assistantMessages } from '../../i18n/assistant';
import { BirdMark, CloseIcon } from '../brand/icons';
import { AssistantChat } from './AssistantChat';

const TEASER_KEY = 'xplora:assistantTeaser';

export const AssistantWidget = () => {
  const m = useMessages(assistantMessages);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hidden = pathname === '/asistente' || pathname.startsWith('/admin') || pathname === '/login';

  // Burbuja de bienvenida una sola vez por sesión.
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(TEASER_KEY) === '1'; } catch { /* sin almacenamiento */ }
    if (seen) return;
    // Aparece cuando la persona ya se desplazó (no tapa el buscador del inicio) y tras unos segundos.
    let timer = 0;
    const onScroll = () => {
      if (window.scrollY < 700 || timer) return;
      timer = window.setTimeout(() => setTeaser(true), 1200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const dismissTeaser = () => {
    setTeaser(false);
    try { sessionStorage.setItem(TEASER_KEY, '1'); } catch { /* sin almacenamiento */ }
  };

  const toggle = () => {
    dismissTeaser();
    setMounted(true);
    setOpen((value) => !value);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    // En móvil la hoja ocupa la pantalla: se bloquea el scroll del fondo.
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    const previous = document.body.style.overflow;
    if (mobile) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Otras pantallas pueden abrir el asistente con el evento 'xplora:open-assistant'.
  useEffect(() => {
    const open = () => { setMounted(true); setOpen(true); };
    window.addEventListener('xplora:open-assistant', open);
    return () => window.removeEventListener('xplora:open-assistant', open);
  }, []);

  // Cerrar al cambiar de página (se deriva durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  if (hidden) return null;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={m.closeWidget}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[1090] bg-brand-blue/30 sm:hidden"
        />
      )}

      {mounted && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={m.chatName}
          hidden={!open}
          className="assistant-panel fixed inset-x-0 bottom-0 z-[1100] flex h-[86dvh] flex-col overflow-hidden rounded-t-xl border border-brand-blue/15 bg-brand-paper shadow-soft sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-xl"
        >
          <header className="relative flex items-center gap-3 border-b border-brand-sand bg-brand-light px-5 py-3.5 text-brand-blue">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-brand-sand bg-brand-paper text-brand-blue">
              <BirdMark className="size-7" />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="font-display truncate text-lg leading-tight">{m.chatName}</p>
              <p className="label-quiet mt-0.5 flex items-center gap-1.5 truncate">
                <i className={`size-1.5 shrink-0 rounded-full ${online ? 'bg-brand-green' : 'bg-ochre-600'}`} aria-hidden="true" />
                {online ? m.widgetStatus : m.statusOffline}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChatKey((value) => value + 1)}
              aria-label={m.newChat}
              title={m.newChat}
              className="relative grid size-9 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-sand/70 hover:text-brand-blue"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" /></svg>
            </button>
            <Link
              to="/asistente"
              aria-label={m.expand}
              title={m.expand}
              className="relative grid size-9 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-sand/70 hover:text-brand-blue"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>
            </Link>
            <button
              type="button"
              onClick={() => { setOpen(false); fabRef.current?.focus(); }}
              aria-label={m.closeWidget}
              className="relative grid size-9 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-sand/70 hover:text-brand-blue"
            >
              <CloseIcon className="size-4" />
            </button>
          </header>
          <div className="min-h-0 flex-1">
            <AssistantChat key={chatKey} variant="widget" autoFocus={open} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className={`fixed bottom-[5.5rem] right-4 z-[1100] items-end gap-3 sm:bottom-6 sm:right-6 ${open ? 'hidden sm:flex' : 'flex'}`}>
        {teaser && !open && (
          <div className="animate-fade-up relative mb-2 hidden max-w-[220px] rounded-lg border border-brand-blue/15 bg-brand-paper px-4 py-3 font-display text-[15px] leading-snug text-brand-blue sm:block">
            {m.widgetTeaser}
            <button type="button" onClick={dismissTeaser} aria-label={m.closeWidget} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-brand-sand bg-white text-brand-blue/70 hover:text-brand-blue">
              <CloseIcon className="size-3" />
            </button>
          </div>
        )}
        <button
          ref={fabRef}
          type="button"
          onClick={toggle}
          aria-label={open ? m.closeWidget : m.openWidget}
          aria-expanded={open}
          className={`assistant-fab group relative grid size-14 place-items-center rounded-full border shadow-soft transition-colors duration-300 ${open ? 'is-open border-brand-blue bg-brand-blue text-white' : 'border-brand-blue/20 bg-brand-paper text-brand-blue hover:border-brand-blue/50 hover:bg-brand-light'}`}
        >
          <span className={`absolute transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100'}`}>
            <BirdMark className="size-9" />
          </span>
          <span className={`absolute transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>
            <CloseIcon className="size-5" />
          </span>
        </button>
      </div>
    </>
  );
};
