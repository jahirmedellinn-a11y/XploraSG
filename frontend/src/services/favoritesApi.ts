import { supabase } from '../supabaseClient';
import type { Place } from '../types/catalog';

const getAuthHeaders = async () => {
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getFavorites = async (): Promise<Place[]> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return [];
  
  const response = await fetch(`${getApiUrl()}/api/favoritos`, { headers });
  if (!response.ok) throw new Error('Error al obtener favoritos');
  return response.json();
};

export const addFavorite = async (lugarId: number): Promise<void> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return;
  
  const response = await fetch(`${getApiUrl()}/api/favoritos/${lugarId}`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw new Error('Error al agregar favorito');
};

export const removeFavorite = async (lugarId: number): Promise<void> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return;
  
  const response = await fetch(`${getApiUrl()}/api/favoritos/${lugarId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('Error al eliminar favorito');
};

export const syncFavorites = async (lugarIds: number[]): Promise<Place[]> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return [];
  
  const response = await fetch(`${getApiUrl()}/api/favoritos/sync`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ lugarIds }),
  });
  if (!response.ok) throw new Error('Error al sincronizar favoritos');
  return response.json();
};
