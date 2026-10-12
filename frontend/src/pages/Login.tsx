import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthFlowError, homeForRole, useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { messagesNow, useMessages } from '../i18n';
import { loginMessages } from '../i18n/auth';
import { ArrowRightIcon, ShieldIcon } from '../components/brand/icons';
import { supabase } from '../supabaseClient';

type Mode = 'login' | 'registro' | 'recuperar';

/** Convierte los errores de Supabase/backend en mensajes claros en el idioma activo. */
const friendlyError = (error: unknown, mode: Mode): { text: string; unconfirmed?: boolean } => {
  if (error instanceof AuthFlowError) return { text: error.message };
  const m = messagesNow(loginMessages);
  const message = (error as { message?: string })?.message || '';
  if (/invalid login credentials/i.test(message)) return { text: m.errInvalidCredentials };
  if (/email not confirmed/i.test(message)) return { text: m.errNotConfirmed, unconfirmed: true };
  if (/already registered|user already exists/i.test(message)) return { text: m.errAlreadyRegistered };
  if (/password should be at least|weak password/i.test(message)) return { text: m.errWeakPassword };
  if (/rate limit|too many|for security purposes/i.test(message)) return { text: m.errRateLimit };
  if (/invalid email|unable to validate email/i.test(message)) return { text: m.errInvalidEmail };
  if (/failed to fetch|network/i.test(message)) return { text: m.errNetwork };
  if (/signups not allowed/i.test(message)) return { text: m.errSignupsDisabled };
  return { text: message || (mode === 'registro' ? m.errRegisterFailed : m.errLoginFailed) };
};

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {!open && <path d="M3 3l18 18" strokeLinecap="round" />}
  </svg>
);

const MailIcon = ({ className = 'size-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 7 8 6 8-6" />
  </svg>
);

const AlertIcon = ({ className = 'size-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" />
  </svg>
);

/** Pantallas de cuenta: sólo el formulario, centrado en una hoja blanca con borde fino. */
export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
    <div className="mx-auto w-full max-w-xl sm:rounded-xl sm:border sm:border-brand-blue/10 sm:bg-white sm:px-12 sm:py-14">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  </section>
);

export const Login = () => {
  const m = useMessages(loginMessages);
  usePageTitle(m.pageTitle);
  const [mode, setMode] = useState<Mode>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, register, requestPasswordReset, resendConfirmation, isAuthenticated, user, sessionNotice, dismissSessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requested = (location.state as { from?: string } | null)?.from;
  const safeRequested = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : null;

  if (isAuthenticated && !submitting) return <Navigate to={safeRequested ?? homeForRole(user?.rol)} replace />;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setUnconfirmed(false);
    setPassword('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setError('');
    setNotice('');
    setUnconfirmed(false);

    if (mode === 'registro' && !acceptedPrivacy) {
      setError(m.errAcceptPrivacy);
      return;
    }
    if (mode === 'registro' && supabase && password.length < 8) {
      setError(m.errMinLength);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'recuperar') {
        await requestPasswordReset(cleanEmail);
        setNotice(m.resetSent(cleanEmail));
        return;
      }
      if (mode === 'registro') {
        const result = await register(cleanEmail, nombre.trim(), password);
        if (result.requiresEmailConfirmation) {
          setMode('login');
          setPassword('');
          setNotice(m.accountCreated(cleanEmail));
          return;
        }
        navigate(safeRequested ?? '/dashboard', { replace: true });
        return;
      }
      const loggedUser = await login(cleanEmail, password);
      navigate(safeRequested ?? homeForRole(loggedUser.rol), { replace: true });
    } catch (requestError) {
      const { text, unconfirmed: needsConfirmation } = friendlyError(requestError, mode);
      setError(text);
      setUnconfirmed(Boolean(needsConfirmation));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await resendConfirmation(email.trim().toLowerCase());
      setUnconfirmed(false);
      setNotice(m.confirmationResent);
    } catch (requestError) {
      setError(friendlyError(requestError, 'login').text);
    }
  };

  const titles: Record<Mode, string> = { login: m.titleLogin, registro: m.titleRegister, recuperar: m.titleRecover };

  const isRecover = mode === 'recuperar';

  return (
    <AuthLayout>
      <h1 className="text-[2.25rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]">{titles[mode]}</h1>
      <p className="mt-3 text-sm leading-6 text-brand-blue/70">
        {isRecover ? m.recoverHint : supabase ? m.secureHint : m.devHint}
      </p>

      {sessionNotice && (
        <div role="status" className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm font-medium text-ochre-900">
          <span className="flex gap-2.5"><AlertIcon className="mt-0.5 size-4 shrink-0" />{sessionNotice}</span>
          <button type="button" onClick={dismissSessionNotice} aria-label={m.closeNotice} className="grid size-6 shrink-0 place-items-center rounded-full text-ochre-900/70 hover:bg-ochre-100 hover:text-ochre-900">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm font-medium leading-6 text-clay-800">
          <AlertIcon className="mt-0.5 size-5 shrink-0 text-clay-600" />
          <div>
            {error}
            {unconfirmed && supabase && (
              <button type="button" onClick={() => void resend()} className="mt-1 block font-medium text-clay-900 underline underline-offset-4">
                {m.resendConfirmation}
              </button>
            )}
          </div>
        </div>
      )}
      {notice && (
        <div role="status" className="mt-6 flex gap-3 border-l-2 border-brand-green bg-brand-light px-4 py-3 text-sm leading-6 text-brand-blue">
          <ShieldIcon className="mt-0.5 size-5 shrink-0 text-brand-green" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 grid gap-5" noValidate={false}>
        {mode === 'registro' && (
          <label className="grid gap-2 text-sm font-medium text-brand-blue/80">
            {m.fullName}
            <input type="text" value={nombre} onChange={(event) => setNombre(event.target.value)} className="text-sm field" placeholder={m.namePlaceholder} autoComplete="name" maxLength={100} required />
          </label>
        )}
        <div className="grid gap-2">
          <label htmlFor="login-email" className="text-sm font-medium text-brand-blue/80">{m.email}</label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand-blue/35" />
            <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="text-sm field pl-12" placeholder={m.emailPlaceholder} autoComplete="email" maxLength={255} required />
          </div>
        </div>
        {supabase && !isRecover && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="text-sm font-medium text-brand-blue/80">{m.password}</label>
              {mode === 'login' && (
                <button type="button" onClick={() => switchMode('recuperar')} className="text-xs text-brand-blue/75 underline decoration-brand-blue/20 underline-offset-4 transition-colors duration-300 hover:text-brand-green hover:decoration-brand-green">
                  {m.forgotPassword}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="text-sm field pr-12"
                autoComplete={mode === 'registro' ? 'new-password' : 'current-password'}
                minLength={mode === 'registro' ? 8 : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? m.hidePassword : m.showPassword}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-brand-blue/70 transition-colors duration-300 hover:bg-brand-light hover:text-brand-blue"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {mode === 'registro' && <span className="text-xs text-brand-blue/70">{m.passwordHint}</span>}
          </div>
        )}

        {mode === 'registro' && (
          <label className="flex items-start gap-3 border-y border-brand-sand py-4 text-sm leading-6 text-brand-blue/75">
            <input type="checkbox" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--color-brand-green)]" required />
            <span>
              {m.acceptPrefix}<Link to="/privacidad" target="_blank" className="font-medium text-brand-green underline decoration-brand-green/30 underline-offset-4">{m.privacyNotice}</Link>{m.acceptMiddle}{' '}
              <Link to="/terminos" target="_blank" className="font-medium text-brand-green underline decoration-brand-green/30 underline-offset-4">{m.termsOfUse}</Link>{m.acceptSuffix}
            </span>
          </label>
        )}

        <button type="submit" disabled={submitting} className="btn btn-accent mt-2 min-h-13 w-full">
          {submitting && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
          {submitting ? m.processing : mode === 'registro' ? m.submitRegister : isRecover ? m.submitRecover : m.submitLogin}
          {!submitting && <ArrowRightIcon className="size-4" />}
        </button>
      </form>

      <div className="mt-9 grid gap-3 border-t border-brand-sand pt-6 text-center text-sm text-brand-blue/75">
        {mode === 'login' && (
          <p>{m.noAccount}{' '}
            <button type="button" onClick={() => switchMode('registro')} className="font-medium text-brand-green underline decoration-brand-green/30 underline-offset-4 transition-colors duration-300 hover:text-brand-blue">{m.signUpFree}</button>
          </p>
        )}
        {mode !== 'login' && (
          <p>{mode === 'registro' ? m.haveAccount : m.remembered}
            <button type="button" onClick={() => switchMode('login')} className="font-medium text-brand-green underline decoration-brand-green/30 underline-offset-4 transition-colors duration-300 hover:text-brand-blue">{m.signIn}</button>
          </p>
        )}
        <p className="text-xs"><Link to="/" className="text-brand-blue/70 transition-colors duration-300 hover:text-brand-blue">{m.backHome}</Link></p>
      </div>
    </AuthLayout>
  );
};
