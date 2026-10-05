import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-emerald-950 text-white shadow-sm'
      : 'text-stone-600 hover:bg-emerald-50 hover:text-emerald-950'
  }`;

export const AppShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-stone-900">
      <header className="sticky top-0 z-[1000] border-b border-stone-200/80 bg-[#f7f7f2]/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="group flex items-center gap-3" aria-label="XploraSG, inicio">
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-950 text-white shadow-sm transition group-hover:-rotate-3">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m3 18 5-8 4 5 3-4 6 7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 18h18" strokeLinecap="round" />
                <circle cx="16.5" cy="6.5" r="2" fill="#f6c453" stroke="none" />
              </svg>
            </span>
            <span>
              <span className="block text-lg font-black leading-none tracking-tight text-emerald-950">XploraSG</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Sierra Gorda</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            <NavLink to="/explorar" className={navClass}>Explorar</NavLink>
            <NavLink to="/mapa" className={navClass}>Mapa</NavLink>
            <NavLink to="/servicios" className={navClass}>Servicios</NavLink>
            <NavLink to="/asistente" className={navClass}>Asistente</NavLink>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span
              role="status"
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${isOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'}`}
              title={isOnline ? 'Conexión disponible' : 'Se mostrarán los datos sincronizados disponibles'}
            >
              <i className={`size-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`} aria-hidden="true" />
              {isOnline ? 'En línea' : 'Sin conexión'}
            </span>
            {isAuthenticated ? (
              <Link to="/dashboard" className="rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm font-bold text-emerald-950 shadow-sm hover:border-emerald-700">
                {user?.nombre?.split(' ')[0] || 'Mi cuenta'}
              </Link>
            ) : (
              <Link to="/login" className="rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm font-bold text-emerald-950 shadow-sm hover:border-emerald-700">
                Iniciar sesión
              </Link>
            )}
          </div>

          <span
            role="status"
            className={`ml-auto mr-2 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold md:hidden ${isOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'}`}
          >
            <i className={`size-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`} aria-hidden="true" />
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>

          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-stone-200 bg-white md:hidden"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d={menuOpen ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-stone-200 bg-white px-5 py-4 md:hidden" aria-label="Navegación móvil">
            <div className="mx-auto grid max-w-7xl gap-2" onClick={() => setMenuOpen(false)}>
              <NavLink to="/explorar" className={navClass}>Explorar</NavLink>
              <NavLink to="/mapa" className={navClass}>Mapa</NavLink>
              <NavLink to="/servicios" className={navClass}>Servicios</NavLink>
              <NavLink to="/asistente" className={navClass}>Asistente</NavLink>
              <NavLink to={isAuthenticated ? '/dashboard' : '/login'} className={navClass}>
                {isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
              </NavLink>
            </div>
          </nav>
        )}
        {!isOnline && (
          <div role="status" className="border-t border-amber-200 bg-amber-100 px-5 py-2 text-center text-xs font-bold text-amber-950">
            Sin conexión. XploraSG mostrará la información que ya se sincronizó en este dispositivo.
          </div>
        )}
      </header>

      <main className="pb-20 md:pb-0"><Outlet /></main>

      <footer className="border-t border-stone-200 bg-emerald-950 text-emerald-50 mb-16 md:mb-0">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:grid-cols-[1fr_auto] sm:items-end lg:px-8">
          <div>
            <p className="text-xl font-black">XploraSG</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-emerald-100/70">
              Una guía para descubrir con respeto la naturaleza, cultura y comunidades de la Sierra Gorda queretana.
            </p>
          </div>
          <p className="text-xs text-emerald-100/60">Datos cartográficos © OpenStreetMap contributors</p>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-stone-200 bg-white md:hidden" aria-label="Navegación móvil inferior">
        <div className="grid h-16 grid-cols-4 items-center px-2">
          <NavLink to="/explorar" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 ${isActive ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            <span className="text-[10px]">Explorar</span>
          </NavLink>
          <NavLink to="/mapa" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 ${isActive ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
            <span className="text-[10px]">Mapa</span>
          </NavLink>
          <NavLink to="/servicios" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 ${isActive ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.999 2.999 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
            <span className="text-[10px]">Servicios</span>
          </NavLink>
          <NavLink to="/agenda" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 ${isActive ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-emerald-700'}`}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            <span className="text-[10px]">Agenda</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

