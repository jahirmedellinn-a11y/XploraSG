import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { messagesNow, useMessages } from '../i18n';
import { authSession } from '../i18n/auth';
import { supabase } from '../supabaseClient';

export interface User {
  id: string;
  email: string;
  rol: string;
  nombre?: string;
}

interface RegisterResult {
  requiresEmailConfirmation: boolean;
}

export type SessionEndReason = 'manual' | 'inactividad' | 'expirada';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  /** true cuando la persona llegó desde el enlace de "restablecer contraseña". */
  passwordRecovery: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (email: string, nombre: string, password?: string) => Promise<RegisterResult>;
  logout: (reason?: SessionEndReason) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  /** Mensaje cuando la sesión se cerró automáticamente (inactividad o expiración). */
  sessionNotice: string;
  dismissSessionNotice: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

// ---- Seguridad de sesión ----
// Cierre automático tras N minutos sin actividad (configurable con VITE_IDLE_TIMEOUT_MIN).
const IDLE_TIMEOUT_MS = Math.max(1, Number(import.meta.env.VITE_IDLE_TIMEOUT_MIN) || 15) * 60_000;
const LAST_ACTIVITY_KEY = 'xplora:lastActivity';
const NOTICE_KEY = 'xplora:sessionNotice';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

type NoticeReason = Exclude<SessionEndReason, 'manual'>;
// Se guarda el motivo (no el texto) para mostrar el aviso en el idioma activo aunque se cambie después.
const readStoredNotice = (): NoticeReason | null => {
  const stored = sessionStorage.getItem(NOTICE_KEY);
  return stored === 'inactividad' || stored === 'expirada' ? stored : null;
};

/** Error con un mensaje listo para mostrar en pantalla. */
// eslint-disable-next-line react-refresh/only-export-components
export class AuthFlowError extends Error {}

/** Lee el campo exp (segundos) de un JWT sin verificar la firma; la verificación real ocurre en el backend. */
const tokenExpiresAt = (jwt: string | null): number | null => {
  if (!jwt) return null;
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const readLastActivity = () => Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
const markActivity = () => localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
const idleTooLong = () => readLastActivity() > 0 && Date.now() - readLastActivity() > IDLE_TIMEOUT_MS;
const appUrl = (path: string) => `${window.location.origin}${path}`;

/** Traduce los fallos al consultar el perfil en el backend. */
const profileError = (error: unknown): { message: string; authProblem: boolean } => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        message: messagesNow(authSession).backendDown,
        authProblem: false,
      };
    }
    const backendMessage = (error.response.data as { error?: string } | undefined)?.error;
    if (error.response.status === 401 || error.response.status === 403) {
      return { message: backendMessage || messagesNow(authSession).invalidSession, authProblem: true };
    }
    return { message: backendMessage || messagesNow(authSession).profileServerError, authProblem: false };
  }
  return { message: error instanceof Error ? error.message : messagesNow(authSession).profileLoadError, authProblem: false };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const sessionMessages = useMessages(authSession);
  const [noticeReason, setNoticeReason] = useState<NoticeReason | null>(readStoredNotice);
  const sessionNotice = noticeReason === 'inactividad' ? sessionMessages.idleNotice : noticeReason === 'expirada' ? sessionMessages.expiredNotice : '';
  const userRef = useRef<User | null>(null);
  const pendingProfile = useRef<{ token: string; promise: Promise<User> } | null>(null);

  const applyUser = useCallback((nextUser: User | null, accessToken: string | null) => {
    userRef.current = nextUser;
    setUser(nextUser);
    setToken(accessToken);
    if (accessToken) localStorage.setItem('token', accessToken);
    else localStorage.removeItem('token');
  }, []);

  const clearLocalSession = useCallback(() => applyUser(null, null), [applyUser]);

  /** Obtiene el perfil (rol) desde el backend. Si dos partes lo piden con el mismo token, se reutiliza la petición. */
  const loadProfile = useCallback((accessToken: string): Promise<User> => {
    if (pendingProfile.current?.token === accessToken) return pendingProfile.current.promise;
    const promise = axios
      .get<{ user: User }>(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => {
        applyUser(response.data.user, accessToken);
        return response.data.user;
      })
      .finally(() => {
        if (pendingProfile.current?.token === accessToken) pendingProfile.current = null;
      });
    pendingProfile.current = { token: accessToken, promise };
    return promise;
  }, [applyUser]);

  /** Vincula una sesión de Supabase con el perfil interno. Si el backend la rechaza, cierra la sesión de Supabase. */
  const loadSupabaseProfile = useCallback(async (accessToken: string): Promise<User> => {
    try {
      return await loadProfile(accessToken);
    } catch (error) {
      const { message, authProblem } = profileError(error);
      clearLocalSession();
      if (authProblem) await supabase?.auth.signOut();
      throw new AuthFlowError(message);
    }
  }, [clearLocalSession, loadProfile]);

  // ---- Restaurar la sesión al abrir la app y escuchar cambios de Supabase ----
  useEffect(() => {
    let active = true;
    const finishLoading = () => { if (active) setLoading(false); };

    const initializeSession = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data.session && idleTooLong()) {
            await supabase.auth.signOut();
            clearLocalSession();
            sessionStorage.setItem(NOTICE_KEY, 'inactividad');
            setNoticeReason('inactividad');
          } else if (data.session) {
            await loadSupabaseProfile(data.session.access_token);
          } else {
            clearLocalSession();
          }
        } else {
          const storedToken = localStorage.getItem('token');
          const expiresAt = tokenExpiresAt(storedToken);
          if (storedToken && ((expiresAt !== null && expiresAt <= Date.now()) || idleTooLong())) {
            clearLocalSession();
          } else if (storedToken) {
            await loadProfile(storedToken);
          } else {
            clearLocalSession();
          }
        }
      } catch (error) {
        console.error('No fue posible restaurar la sesión:', error);
        clearLocalSession();
      } finally {
        finishLoading();
      }
    };

    void initializeSession();

    if (!supabase) {
      return () => { active = false; };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (!session) {
        clearLocalSession();
        finishLoading();
        return;
      }
      // Misma persona (renovación del token, actualización de datos): sólo se actualiza el token, sin recargar la vista.
      if (userRef.current?.id === session.user.id) {
        applyUser(userRef.current, session.access_token);
        return;
      }
      if (event === 'INITIAL_SESSION') return; // ya lo atiende initializeSession
      void loadSupabaseProfile(session.access_token)
        .catch((error) => console.error('La sesión de Supabase no pudo vincularse con el perfil:', error))
        .finally(finishLoading);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [applyUser, clearLocalSession, loadProfile, loadSupabaseProfile]);

  const resetNotice = () => {
    sessionStorage.removeItem(NOTICE_KEY);
    setNoticeReason(null);
  };

  const login = async (email: string, password?: string): Promise<User> => {
    resetNotice();
    if (supabase) {
      if (!password) throw new AuthFlowError(messagesNow(authSession).enterYourPassword);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new AuthFlowError(messagesNow(authSession).noSession);
      markActivity();
      return loadSupabaseProfile(data.session.access_token);
    }

    try {
      const response = await axios.post<{ token: string; user: User }>(`${API_URL}/api/auth/login`, { email });
      markActivity();
      applyUser(response.data.user, response.data.token);
      return response.data.user;
    } catch (error) {
      throw new AuthFlowError(profileError(error).message);
    }
  };

  const register = async (email: string, nombre: string, password?: string): Promise<RegisterResult> => {
    resetNotice();
    if (supabase) {
      if (!password) throw new AuthFlowError(messagesNow(authSession).enterAPassword);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre }, emailRedirectTo: appUrl('/auth/confirm') },
      });
      if (error) throw error;
      // Supabase devuelve un usuario sin identidades cuando el correo ya estaba registrado.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new AuthFlowError(messagesNow(authSession).alreadyRegistered);
      }
      if (!data.session) {
        clearLocalSession();
        return { requiresEmailConfirmation: true };
      }
      markActivity();
      await loadSupabaseProfile(data.session.access_token);
      return { requiresEmailConfirmation: false };
    }

    try {
      const response = await axios.post<{ token: string; user: User }>(`${API_URL}/api/auth/register`, { email, nombre });
      markActivity();
      applyUser(response.data.user, response.data.token);
      return { requiresEmailConfirmation: false };
    } catch (error) {
      throw new AuthFlowError(profileError(error).message);
    }
  };

  const requestPasswordReset = async (email: string) => {
    if (!supabase) throw new AuthFlowError(messagesNow(authSession).resetUnavailable);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl('/restablecer-contrasena') });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    if (!supabase) throw new AuthFlowError(messagesNow(authSession).changeUnavailable);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setPasswordRecovery(false);
  };

  const resendConfirmation = async (email: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: appUrl('/auth/confirm') } });
    if (error) throw error;
  };

  const logout = useCallback(async (reason: SessionEndReason = 'manual') => {
    if (reason !== 'manual') {
      sessionStorage.setItem(NOTICE_KEY, reason);
      setNoticeReason(reason);
    }
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      clearLocalSession();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    }
  }, [clearLocalSession]);

  const dismissSessionNotice = useCallback(() => resetNotice(), []);

  // ---- Registro de actividad + verificación periódica de inactividad y expiración del token ----
  useEffect(() => {
    if (!user) return undefined;
    markActivity();
    let throttle = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - throttle > 5_000) {
        throttle = now;
        markActivity();
      }
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));

    const check = async () => {
      if (idleTooLong()) {
        await logout('inactividad');
        return;
      }
      const expiresAt = tokenExpiresAt(token);
      if (expiresAt !== null && expiresAt - Date.now() < 30_000) {
        // Supabase intenta renovar el token; si no puede, la sesión se cierra.
        if (supabase) {
          const { data, error } = await supabase.auth.refreshSession();
          if (error || !data.session) await logout('expirada');
        } else if (expiresAt <= Date.now()) {
          await logout('expirada');
        }
      }
    };
    const interval = window.setInterval(() => void check(), 30_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user, token, isAuthenticated: Boolean(user), loading, passwordRecovery,
        login, register, logout, requestPasswordReset, updatePassword, resendConfirmation,
        sessionNotice, dismissSessionNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/** Página de inicio según el rol de la cuenta. */
// eslint-disable-next-line react-refresh/only-export-components
export const homeForRole = (rol: string | undefined) =>
  rol === 'administrador' ? '/admin' : rol === 'prestador' ? '/mi-negocio' : '/dashboard';

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
