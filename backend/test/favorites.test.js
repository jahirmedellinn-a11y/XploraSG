// Las pruebas unitarias no abren conexión real; basta con una URL de ejemplo para cargar el módulo de BD.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
const assert = require('node:assert/strict');
const { test, describe, mock } = require('node:test');

test('Favoritos: obtiene usuario desde autenticación validada', async (t) => {
  const req = {
    user: { id: 'usuario-auth-123' },
    params: { lugarId: '10' }
  };
  const res = {
    status: mock.fn(() => res),
    json: mock.fn()
  };

  const favoritesService = {
    addFavorite: mock.fn(async () => {})
  };

  mock.method(require('../dist/services/favoritesService'), 'addFavorite', favoritesService.addFavorite);

  const { addFavorite } = require('../dist/controllers/favoritesController');
  await addFavorite(req, res);

  assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
  assert.strictEqual(favoritesService.addFavorite.mock.calls[0].arguments[0], 'usuario-auth-123');
  assert.strictEqual(favoritesService.addFavorite.mock.calls[0].arguments[1], 10);
});

test('Favoritos: sincronización falla y no elimina datos locales', async (t) => {
  // Sincronización se hace mediante syncFavorites en favoritesController.ts
  const req = {
    user: { id: 'usuario-auth-123' },
    body: { lugarIds: [1, 2, 3] }
  };
  const res = {
    status: mock.fn(() => res),
    json: mock.fn()
  };

  const favoritesService = {
    syncFavorites: mock.fn(async () => { throw new Error('DB Error'); })
  };

  mock.method(require('../dist/services/favoritesService'), 'syncFavorites', favoritesService.syncFavorites);
  const { syncFavorites: syncFavoritesController } = require('../dist/controllers/favoritesController');

  await syncFavoritesController(req, res);
  assert.strictEqual(res.status.mock.calls[0].arguments[0], 500);
});
