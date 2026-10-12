import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthFlowError, homeForRole, useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useMessages } from '../i18n';
import { authCallbackMessages } from '../i18n/auth';
import { AuthLayout } from './Login';
import { ArrowRightIcon, ShieldIcon } from '../components/brand/icons';

/** Supabase devuelve errores del enlace en el fragmento (#error=…&error_description=…) o en la consulta. */
type LinkError = { expired: true } | { expired: false; description: string | null };

const linkError = (): LinkError | null => {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
  const code = params.get('error_code') || params.get('error');
  if (!code) return null;
  if (/expired/i.test(code)) return { expired: true };
  return { expired: false, description: params.get('error_description')?.replace(/\+/g, ' ') || null };
};

/** Texto visible del error del enlace en el idioma activo (la descripción de Supabase llega tal cual). */
const linkErrorText = (error: LinkError, m: (typeof authCallbackMessages)['es']): string =>
  error.expired ? m.linkExpired : error.description || m.linkInvalid;

const Card = ({ children }: { children: ReactNode }) => (
  <AuthLayout><div className="animate-fade-up">{children}</div></AuthLayout>
);

/** Icono de estado de la tarjeta (éxito o aviso). */
const StatusBadge = ({ tone }: { tone: 'success' | 'warning' }) => (
  <div className={`mb-7 grid size-14 place-items-center rounded-full border ${tone === 'success' ? 'border-brand-green/35 text-brand-green' : 'border-brand-gold/40 text-brand-gold'}`} aria-hidden="true">
    {tone === 'success'
      ? <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
      : <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 14.5 14.5 9.5" /><path d="M11 6.5 12.6 5a4.2 4.2 0 0 1 6 6L17 12.5M13 17.5 11.4 19a4.2 4.2 0 0 1-6-6L7 11.5" /></svg>}
  </div>
);

const Waiting = ({ text }: { text: string }) => (
  <Card>
    <div className="flex items-center gap-3 py-6 text-brand-blue/70" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-blue/15 border-t-brand-green" aria-hidden="true" />
      {text}
    </div>
  </Card>
);

/** /restablecer-contrasena — destino del correo "Restablecer contraseña". */
export const ResetPasswordPage = () => {
  const m = useMessages(authCallbackMessages);
  usePageTitle(m.resetPageTitle);
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [error] = useState(linkError);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [waited, setWaited] = useState(false);

  // Supabase tarda un instante en leer el enlace; si tras unos segundos no hay sesión, el enlace no sirve.
  useEffect(() => {
    const timer = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (password.length < 8) return setFormError(m.errMinLength);
    if (password !== confirm) return setFormError(m.errMismatch);
    setSaving(true);
    try {
      await updatePassword(password);
      setDone(true);
      window.setTimeout(() => navigate(homeForRole(user?.rol), { replace: true }), 1800);
    } catch (requestError) {
      const message = requestError instanceof AuthFlowError ? requestError.message : (requestError as { message?: string })?.message || '';
      setFormError(/different from the old|same as/i.test(message) ? m.errSamePassword : message || m.errSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (error || (!user && !loading && waited)) {
    return (
      <Card>
        <StatusBadge tone="warning" />
        <h1 className="text-[2.25rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]">{m.invalidLinkTitle}</h1>
        <p className="mt-4 text-[15px] leading-7 text-brand-blue/75">{error ? linkErrorText(error, m) : m.invalidResetLink}</p>
        <Link to="/login" className="btn btn-accent mt-8 min-h-12 px-7">
          {m.requestNewLink}
          <ArrowRightIcon className="size-4" />
        </Link>
      </Card>
    );
  }
  if (!user) return <Waiting text={m.verifyingLink} />;
  if (done) {
    return (
      <Card>
        <StatusBadge tone="success" />
        <h1 className="text-[2.25rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]">{m.passwordUpdatedTitle}</h1>
        <p className="mt-4 text-[15px] leading-7 text-brand-blue/75">{m.passwordUpdatedText}</p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="eyebrow">{m.eyebrow}</p>
      <h1 className="mt-5 text-[2.25rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]">{m.newPasswordTitle}</h1>
      <p className="mt-3 inline-flex items-center gap-2 text-sm text-brand-blue/70"><ShieldIcon className="size-4 text-brand-green" />{m.forEmail(user.email)}</p>
      <form onSubmit={(event) => void submit(event)} className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-brand-blue/80">
          {m.newPassword}
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="text-sm field" autoComplete="new-password" minLength={8} required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-brand-blue/80">
          {m.confirmPassword}
          <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="text-sm field" autoComplete="new-password" minLength={8} required />
        </label>
        {formError && <p role="alert" className="rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm font-medium text-clay-800">{formError}</p>}
        <button type="submit" disabled={saving} className="btn btn-accent mt-2 min-h-13 w-full">
          {saving ? m.saving : m.savePassword}
        </button>
      </form>
    </Card>
  );
};

/** /auth/confirm — destino del correo "Confirma tu cuenta". */
export const AuthConfirmPage = () => {
  const m = useMessages(authCallbackMessages);
  usePageTitle(m.confirmPageTitle);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error] = useState(linkError);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(() => navigate(homeForRole(user.rol), { replace: true }), 2500);
    return () => window.clearTimeout(timer);
  }, [user, navigate]);

  if (error) {
    return (
      <Card>
        <StatusBadge tone="warning" />
        <h1 className="text-[2.25rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]">{m.confirmFailedTitle}</h1>
        <p className="mt-4 text-[15px] leading-7 text-brand-blue/75">{linkErrorText(error, m)}{m.confirmFailedHint}</p>
        <Link to="/login" className="btn btn-accent mt-8 min-h-12 px-7">{m.goToLogin}</Link>
      </Card>
    );
  }
  if (user) {
    return (
      <Card>
        <StatusBadge tone="success" />
        <h1 className="text-[2.25rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]">{m.emailConfirmedGreeting(user.nombre?.split(' ')[0] || m.welcomeFallback)}</h1>
        <p className="mt-4 text-[15px] leading-7 text-brand-blue/75">{m.accountReady}</p>
      </Card>
    );
  }
  if (!loading && waited) {
    return (
      <Card>
        <StatusBadge tone="success" />
        <h1 className="text-[2.25rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]">{m.emailConfirmedTitle}</h1>
        <p className="mt-4 text-[15px] leading-7 text-brand-blue/75">{m.canSignInNow}</p>
        <Link to="/login" className="btn btn-accent mt-8 min-h-12 px-7">{m.signIn}</Link>
      </Card>
    );
  }
  return <Waiting text={m.confirmingAccount} />;
};
