import assert from 'node:assert/strict';

// Simulación de estado local
let localFavorites = [1, 2];
let remoteFavorites = [];
let db = [];
let isAuth = false;

// Mocks
const getLocalFavorites = () => [...localFavorites];
const removeLocalFavorite = (id) => { localFavorites = localFavorites.filter(x => x !== id); };
const syncFavorites = async (ids) => {
  await new Promise(r => setTimeout(r, 50)); // Simular latencia de red
  if (ids.includes(999)) throw new Error('Network error');
  db = [...new Set([...db, ...ids])];
};
const getFavorites = async () => {
  await new Promise(r => setTimeout(r, 20));
  return db.map(id => ({ id }));
};
const addLocalFavorite = (id) => localFavorites.push(id);

// Simulación del Hook (versión simplificada de la lógica de carga)
const simulateLoadFavorites = async () => {
  let ignore = false;
  try {
    const localIdsToSync = getLocalFavorites();
    if (localIdsToSync.length > 0) {
      await syncFavorites(localIdsToSync);
      localIdsToSync.forEach(id => removeLocalFavorite(id));
    }
    const data = await getFavorites();
    if (!ignore) {
      remoteFavorites = data;
    }
  } catch (error) {
    // Si falla, no limpiamos localIdsToSync, se mantienen en localFavorites
  }
  return () => { ignore = true; }; // Función de cleanup
};

async function runTests() {
  console.log('--- Test 1: Sincronización exitosa sin duplicados ---');
  db = [2, 3]; // Usuario ya tenía el 2 y el 3 en el servidor
  localFavorites = [1, 2]; // Añadió el 1 y el 2 offline
  isAuth = true;
  await simulateLoadFavorites();
  assert.deepEqual(db.sort(), [1, 2, 3], 'DB debe tener 1, 2, 3 sin duplicados');
  assert.deepEqual(localFavorites, [], 'Los favoritos locales sincronizados deben limpiarse');
  console.log('✓ OK');

  console.log('\n--- Test 2: Fallo de red conserva favoritos locales ---');
  db = [];
  localFavorites = [999]; // 999 fuerza un error de red en el mock
  await simulateLoadFavorites();
  assert.deepEqual(db, [], 'DB no debe tener cambios');
  assert.deepEqual(localFavorites, [999], 'Los favoritos locales deben conservarse tras fallo de red');
  console.log('✓ OK');

  console.log('\n--- Test 3: Modificaciones durante sincronización ---');
  db = [];
  localFavorites = [10, 11]; // Para sincronizar
  
  // Iniciamos la sincronización (tarda 50ms)
  const syncPromise = simulateLoadFavorites();
  
  // A los 10ms (durante la sincronización), el usuario añade otro favorito local
  setTimeout(() => { addLocalFavorite(12); }, 10);
  
  await syncPromise; // Esperamos que termine
  assert.deepEqual(db.sort(), [10, 11], 'El servidor recibió los iniciales');
  // El 10 y 11 debieron borrarse, pero el 12 que se añadió "en vuelo" debe conservarse
  assert.deepEqual(localFavorites, [12], 'Solo se borran los que efectivamente se enviaron');
  console.log('✓ OK');
}

runTests().catch(console.error);
