const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const {
  parseLimit,
  parsePage,
  resolvePublicMediaUrl,
  serializeMedia,
} = require('../dist/services/catalogService');

const originalSupabaseUrl = process.env.SUPABASE_URL;

afterEach(() => {
  if (originalSupabaseUrl === undefined) {
    delete process.env.SUPABASE_URL;
  } else {
    process.env.SUPABASE_URL = originalSupabaseUrl;
  }
});

test('normaliza paginación y limita solicitudes grandes', () => {
  assert.equal(parsePage('3'), 3);
  assert.equal(parsePage('-2'), 1);
  assert.equal(parsePage('texto'), 1);
  assert.equal(parseLimit('40'), 40);
  assert.equal(parseLimit('500'), 100);
  assert.equal(parseLimit('0'), 20);
});

test('construye URL pública de Storage escapando cada segmento', () => {
  process.env.SUPABASE_URL = 'https://project.supabase.co/';
  const url = resolvePublicMediaUrl({
    id: 1,
    tipo: 'image',
    url: null,
    bucket_id: 'xplorasg-public',
    object_path: 'lugares/misión jalpan/portada.jpg',
    alt_text: null,
    titulo: null,
  });

  assert.equal(
    url,
    'https://project.supabase.co/storage/v1/object/public/xplorasg-public/lugares/misi%C3%B3n%20jalpan/portada.jpg',
  );
});

test('no expone rutas privadas como URL pública', () => {
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  const media = serializeMedia({
    id: 2,
    tipo: 'image',
    url: null,
    bucket_id: 'xplorasg-review',
    object_path: 'user-id/revision.jpg',
    alt_text: 'En revisión',
    titulo: null,
  });

  assert.equal(media.url, null);
});
