import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../i18n';
import { unauthorizedMessages } from '../i18n/auth';
import { ArrowRightIcon } from '../components/brand/icons';

export const UnauthorizedPage = () => {
  const { isAuthenticated } = useAuth();
  const m = useMessages(unauthorizedMessages);
  const location = useLocation();
  const state = (location.state ?? {}) as { from?: string; reason?: string };
  const needsLogin = !isAuthenticated || state.reason === 'sin-sesion';
  const from = state.from && state.from.startsWith('/') ? state.from : '/dashboard';

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="grid gap-10 border-t border-brand-sand pt-10 md:grid-cols-12 md:gap-8 lg:pt-14">
        <div className="md:col-span-4">
          <span className="grid size-16 place-items-center rounded-full border border-brand-gold/40 text-brand-gold lg:size-20" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-7 lg:size-8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
              <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
              <path d="M12 14.5v2.5" />
            </svg>
          </span>
        </div>
        <div className="max-w-xl md:col-span-8">
          <p className="eyebrow">{m.eyebrow}</p>
          <h1 className="mt-5 text-[2.25rem] leading-[1.08] text-brand-blue sm:text-5xl">
            {needsLogin ? m.needsLoginTitle : m.noPermissionTitle}
          </h1>
          <p className="mt-5 text-[15px] leading-7 text-brand-blue/75">
            {needsLogin ? m.needsLoginText : m.noPermissionText}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            {needsLogin && (
              <Link to="/login" state={{ from }} className="btn btn-accent min-h-12 px-7">
                {m.login}
                <ArrowRightIcon className="size-4" />
              </Link>
            )}
            <Link to="/" className="inline-flex items-center gap-2 border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green">
              {m.backHome}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
