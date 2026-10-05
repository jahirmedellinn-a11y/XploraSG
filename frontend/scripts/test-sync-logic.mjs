import assert from 'node:assert/strict';

// Simulación de estado local
let localFavoritesDetails = [{id: 1, addedAt: 100}, {id: 2, addedAt: 110}];
let remoteFavorites = [];
let db = [];
let isAuth = false;

// Mocks
const getLocalFavoritesDetails = () => [...localFavoritesDetails];
const getLocalFavorites = () => localFavoritesDetails.map(f => f.id);
const addLocalFavorite = (id) => {
  if (!localFavoritesDetails.some(f => f.id === id)) {
    localFavoritesDetails.push({id, addedAt: Date.now()});
  }
};
const removeLocalFavorite = (id) => {
  localFavoritesDetails = localFavoritesDetails.filter(f => f.id !== id);
};
const removeSyncedLocalFavorites = (syncedFavs) => {
  localFavoritesDetails = localFavoritesDetails.filter(curr => 
    !syncedFavs.some(synced => synced.id === curr.id && synced.addedAt === curr.addedAt)
  );
};
const syncFavorites = async (ids) => {
  await new Promise(r => setTimeout(r, 50)); // Simular latencia de red
  if (ids.includes(999)) throw new Error('Network error');
  db = [...new Set([...db, ...ids])];
};
const getFavorites = async () => {
  await new Promise(r => setTimeout(r, 20));
  return db.map(id => ({ id }));
};

// Simulación del Hook
const simulateLoadFavorites = () => {
  const state = { ignore: false };
  const promise = (async () => {
    try {
      const localFavsToSync = getLocalFavoritesDetails();
      const localIdsToSync = localFavsToSync.map(f => f.id);
      if (localIdsToSync.length > 0) {
        await syncFavorites(localIdsToSync);
        if (!state.ignore) {
          removeSyncedLocalFavorites(localFavsToSync);
        }
      }
      const data = await getFavorites();
      if (!state.ignore) {
        remoteFavorites = data;
      }
    } catch (error) {}
  })();
  return { promise, cleanup: () => { state.ignore = true; } };
};

async function runTests() {
  console.log('--- Test 1: Sincronización exitosa sin duplicados ---');
  db = [2, 3];
  localFavoritesDetails = [{id: 1, addedAt: 100}, {id: 2, addedAt: 110}];
  isAuth = true;
  const { promise: p0 } = simulateLoadFavorites();
  await p0;
  assert.deepEqual(db.sort(), [1, 2, 3]);
  assert.deepEqual(localFavoritesDetails, []);
  console.log('✓ OK');

  console.log('\n--- Test 2: Fallo de red conserva favoritos locales ---');
  db = [];
  localFavoritesDetails = [{id: 999, addedAt: 120}];
  const { promise: p0_2 } = simulateLoadFavorites();
  await p0_2;
  assert.deepEqual(db, []);
  assert.deepEqual(localFavoritesDetails, [{id: 999, addedAt: 120}]);
  console.log('✓ OK');

  console.log('\n--- Test 3: Modificaciones (añadir un ID diferente) durante sincronización ---');
  db = [];
  localFavoritesDetails = [{id: 10, addedAt: 100}];
  const { promise: p1 } = simulateLoadFavorites();
  setTimeout(() => addLocalFavorite(12), 10);
  await p1;
  assert.deepEqual(db, [10]);
  assert.equal(localFavoritesDetails.length, 1);
  assert.equal(localFavoritesDetails[0].id, 12);
  console.log('✓ OK');

  console.log('\n--- Test 4: Modificaciones (eliminar y volver a añadir el MISMO ID) durante sincronización ---');
  db = [];
  localFavoritesDetails = [{id: 40, addedAt: 100}];
  const { promise: p2 } = simulateLoadFavorites();
  setTimeout(() => {
    removeLocalFavorite(40); 
    addLocalFavorite(40); // Esto le dará un nuevo timestamp!
  }, 10);
  await p2;
  assert.deepEqual(db, [40], 'Se sincronizó a la BD');
  assert.equal(localFavoritesDetails.length, 1, 'No debió borrarse de local porque se re-añadió con nuevo timestamp');
  assert.equal(localFavoritesDetails[0].id, 40);
  console.log('✓ OK');

  console.log('\n--- Test 5: Cerrar sesión durante sincronización ---');
  db = [];
  localFavoritesDetails = [{id: 50, addedAt: 100}];
  const { promise: p3, cleanup } = simulateLoadFavorites();
  
  // Usuario cierra sesión a los 10ms, ignore = true
  setTimeout(() => { cleanup(); addLocalFavorite(60); }, 10);
  
  await p3;
  assert.deepEqual(db, [50], 'Se subió a la BD a pesar del logout');
  assert.equal(localFavoritesDetails.length, 2, 'No debió borrarse nada localmente por el ignore=true');
  console.log('✓ OK');
}
runTests().catch(console.error);
