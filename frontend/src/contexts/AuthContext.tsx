import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

interface User {
  id: string;
  email: string;
  rol: string;
  nombre?: string;
}

interface RegisterResult {
  requiresEmailConfirmation: boolean;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, nombre: string, password?: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const clearLocalSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const loadProfile = useCallback(async (accessToken: string) => {
    const response = await axios.get<{ user: User }>(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    setToken(accessToken);
    setUser(response.data.user);
    localStorage.setItem('token', accessToken);
  }, []);

  const loadSupabaseProfile = useCallback(
    async (accessToken: string) => {
      try {
        await loadProfile(accessToken);
      } catch (error) {
        clearLocalSession();
        await supabase?.auth.signOut();
        throw error;
      }
    },
    [clearLocalSession, loadProfile],
  );

  useEffect(() => {
    let active = true;

    const finishLoading = () => {
      if (active) {
        setLoading(false);
      }
    };

    const initializeSession = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (data.session) {
            await loadSupabaseProfile(data.session.access_token);
          } else {
            clearLocalSession();
          }
        } else {
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
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
      return () => {
        active = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearLocalSession();
        finishLoading();
        return;
      }

      setLoading(true);
      void loadSupabaseProfile(session.access_token)
        .catch((error) => {
          console.error('La sesión de Supabase no pudo vincularse con el perfil:', error);
        })
        .finally(finishLoading);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearLocalSession, loadProfile, loadSupabaseProfile]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      if (supabase) {
        if (!password) throw new Error('La contraseña es obligatoria en modo Supabase');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error('Supabase no devolvió una sesión válida.');
        await loadSupabaseProfile(data.session.access_token);
        return;
      }

      const response = await axios.post<{ token: string; user: User }>(
        `${API_URL}/api/auth/login`,
        { email },
      );
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    nombre: string,
    password?: string,
  ): Promise<RegisterResult> => {
    setLoading(true);
    try {
      if (supabase) {
        if (!password) throw new Error('La contraseña es obligatoria en modo Supabase');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } },
        });
        if (error) throw error;

        if (!data.session) {
          clearLocalSession();
          return { requiresEmailConfirmation: true };
        }

        await loadSupabaseProfile(data.session.access_token);
        return { requiresEmailConfirmation: false };
      }

      const response = await axios.post<{ token: string; user: User }>(
        `${API_URL}/api/auth/register`,
        { email, nombre },
      );
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return { requiresEmailConfirmation: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearLocalSession();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: Boolean(user), login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
