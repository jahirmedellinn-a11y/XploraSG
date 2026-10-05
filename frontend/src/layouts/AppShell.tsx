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

      <main><Outlet /></main>

      <footer className="border-t border-stone-200 bg-emerald-950 text-emerald-50">
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
    </div>
  );
};

