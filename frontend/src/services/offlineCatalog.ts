const DATABASE_NAME = 'xplorasg-offline';
const DATABASE_VERSION = 1;
const STORE_NAME = 'catalog-responses';

interface CatalogCacheEntry<T> {
  key: string;
  storedAt: string;
  value: T;
}

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!('indexedDB' in globalThis)) {
    reject(new Error('IndexedDB no está disponible en este navegador.'));
    return;
  }

  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'key' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('No fue posible abrir IndexedDB.'));
});

export const readCatalogCache = async <T>(key: string): Promise<CatalogCacheEntry<T> | null> => {
  try {
    const database = await openDatabase();
    return await new Promise<CatalogCacheEntry<T> | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        const entry = request.result as CatalogCacheEntry<T> | undefined;
        resolve(entry ?? null);
      };
      request.onerror = () => reject(request.error || new Error('No fue posible consultar el catálogo local.'));
      transaction.oncomplete = () => database.close();
    });
  } catch {
    return null;
  }
};

export const writeCatalogCache = async <T>(key: string, value: T): Promise<void> => {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({
        key,
        storedAt: new Date().toISOString(),
        value,
      } satisfies CatalogCacheEntry<T>);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error || new Error('No fue posible guardar el catálogo local.'));
      transaction.onabort = () => reject(transaction.error || new Error('Se canceló el guardado del catálogo local.'));
    });
  } catch {
    // IndexedDB puede estar bloqueado o deshabilitado. La consulta en línea
    // debe seguir funcionando aunque no se pueda conservar una copia local.
  }
};

