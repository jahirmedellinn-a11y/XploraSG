import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFavorites } from '../src/hooks/useFavorites';
import * as AuthContext from '../src/contexts/AuthContext';
import * as favoritesApi from '../src/services/favoritesApi';
import * as localFavorites from '../src/services/localFavorites';

// Mocks
vi.mock('../src/contexts/AuthContext');
vi.mock('../src/services/favoritesApi');

describe('useFavorites (Lógica de concurrencia y sincronización)', () => {
  let db: number[] = [];

  beforeEach(() => {
    db = [];
    localFavorites.clearLocalFavorites();
    vi.clearAllMocks();
    
    // Default auth state
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user', rol: 'turista' },
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    // Mock favorites API with simulated latency
    vi.mocked(favoritesApi.getFavorites).mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 20));
      return db.map(id => ({ id, nombre: 'Lugar' } as any));
    });

    vi.mocked(favoritesApi.syncFavorites).mockImplementation(async (ids: number[]) => {
      await new Promise(r => setTimeout(r, 50)); // 50ms latency
      if (ids.includes(999)) throw new Error('Network error');
      db = [...new Set([...db, ...ids])];
    });

    vi.mocked(favoritesApi.addFavorite).mockImplementation(async (id: number) => {
      await new Promise(r => setTimeout(r, 10));
      db.push(id);
    });

    vi.mocked(favoritesApi.removeFavorite).mockImplementation(async (id: number) => {
      await new Promise(r => setTimeout(r, 10));
      db = db.filter(x => x !== id);
    });
  });

  it('Sincronización exitosa sin duplicados', async () => {
    db = [2, 3];
    localFavorites.addLocalFavorite(1);
    localFavorites.addLocalFavorite(2);
    
    const { result } = renderHook(() => useFavorites());
    
    // Wait for the sync to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(db.sort()).toEqual([1, 2, 3]);
    expect(localFavorites.getLocalFavorites()).toEqual([]);
  });

  it('Fallo de red conserva favoritos locales', async () => {
    localFavorites.addLocalFavorite(999);
    
    const { result } = renderHook(() => useFavorites());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(db).toEqual([]);
    expect(localFavorites.getLocalFavorites()).toEqual([999]);
  });

  it('Modificaciones durante sincronización (añadir distinto)', async () => {
    localFavorites.addLocalFavorite(10);
    
    const { result } = renderHook(() => useFavorites());
    
    // En vuelo, a los 10ms, el usuario añade otro favorito
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
      localFavorites.addLocalFavorite(12);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 10 se fue a DB. 12 se quedó local.
    expect(db).toEqual([10]);
    expect(localFavorites.getLocalFavorites()).toEqual([12]);
  });

  it('Modificaciones durante sincronización (eliminar y re-añadir mismo ID)', async () => {
    localFavorites.addLocalFavorite(40);
    
    const { result } = renderHook(() => useFavorites());
    
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
      localFavorites.removeLocalFavorite(40);
      localFavorites.addLocalFavorite(40); // Nuevo operationId!
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(db).toEqual([40]);
    expect(localFavorites.getLocalFavorites()).toEqual([40]); // No se borró localmente!
  });

  it('Cierre de sesión rápido (unmount)', async () => {
    localFavorites.addLocalFavorite(50);
    
    const { unmount } = renderHook(() => useFavorites());
    
    // Desmontar inmediatamente, forzando ignore = true
    unmount();
    
    // Esperamos suficiente para que el backend hubiera terminado
    await new Promise(r => setTimeout(r, 100));
    
    // Se subió porque la promesa no se cancela
    expect(db).toEqual([50]);
    
    // PERO no debió borrarse localmente, protegiendo al siguiente usuario
    expect(localFavorites.getLocalFavorites()).toEqual([50]);
  });
});
