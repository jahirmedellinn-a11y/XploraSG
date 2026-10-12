import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../i18n';
import { unauthorizedMessages } from '../i18n/auth';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

/**
 * Bloquea rutas privadas en el cliente de forma estricta e instantánea.
 * - Sin sesión → Interceptación inmediata y redirección a /login sin fugas visuales.
 * - Con sesión pero sin el rol requerido → Redirección a /unauthorized.
 * - Durante verificación → Pantalla de carga limpia de seguridad.
 */
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const m = useMessages(unauthorizedMessages);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-5 py-24 text-center" role="status" aria-live="polite">
        <span className="size-7 animate-spin rounded-full border-2 border-brand-blue/12 border-t-brand-green" aria-hidden="true" />
        <p className="font-display mt-5 text-lg italic text-brand-blue/70">{m.verifyingSession}</p>
      </div>
    );
  }

  // Interceptación instantánea: si no hay sesión válida o token presente, borra residuo y redirige a /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: 'sin-sesion' }} />;
  }

  // Verificación estricta de rol
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname, reason: 'sin-permiso' }} />;
  }

  return <Outlet />;
};

