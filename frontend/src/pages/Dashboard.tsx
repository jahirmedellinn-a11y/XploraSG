import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Cuenta XploraSG</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Hola, {user?.nombre?.split(' ')[0] || 'viajero'}</h1>
      <p className="mt-3 text-stone-600">Desde aquí podrás administrar tu experiencia en la plataforma.</p>

      <div className="mt-9 grid gap-6 md:grid-cols-[1fr_.8fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black">Tu perfil</h2>
          <dl className="mt-6 grid gap-5 text-sm">
            <div><dt className="font-bold text-stone-500">Nombre</dt><dd className="mt-1 text-base font-semibold">{user?.nombre || 'Sin nombre'}</dd></div>
            <div><dt className="font-bold text-stone-500">Correo</dt><dd className="mt-1 text-base font-semibold">{user?.email}</dd></div>
            <div><dt className="font-bold text-stone-500">Rol</dt><dd className="mt-2"><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-900">{user?.rol}</span></dd></div>
          </dl>
          <button type="button" onClick={handleLogout} className="mt-8 rounded-full border border-red-200 px-5 py-3 text-sm font-black text-red-700 hover:bg-red-50">Cerrar sesión</button>
        </div>

        <div className="rounded-[2rem] bg-emerald-950 p-7 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">Estado actual</p>
          <h2 className="mt-3 text-2xl font-black">Cuenta conectada</h2>
          <p className="mt-3 text-sm leading-6 text-emerald-100/75">Tu sesión está validada con Supabase y vinculada al perfil interno de XploraSG.</p>
          {user?.rol === 'administrador' && (
            <div className="mt-7 rounded-2xl bg-white/10 p-4 text-sm leading-6">
              <p>Tienes acceso administrativo para revisar lugares y servicios.</p>
              <Link to="/admin/contenido" className="mt-4 inline-flex rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-emerald-950">Abrir revisión de contenido</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

