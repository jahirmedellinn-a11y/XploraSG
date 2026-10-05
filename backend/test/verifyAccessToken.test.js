const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');
const { once } = require('node:events');
const { createServer } = require('node:http');
const { afterEach, test } = require('node:test');
const jwt = require('jsonwebtoken');
const {
  verifyAccessToken,
  validateAuthConfiguration,
} = require('../dist/auth/verifyAccessToken');

const managedEnvironmentVariables = [
  'AUTH_MODE',
  'DEV_JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_JWT_AUDIENCE',
];

const originalEnvironment = new Map(
  managedEnvironmentVariables.map((name) => [name, process.env[name]]),
);
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const name of managedEnvironmentVariables) {
    const value = originalEnvironment.get(name);
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
  globalThis.fetch = originalFetch;
});

test('acepta un JWT DEV válido y conserva el subject', async () => {
  process.env.AUTH_MODE = 'dev';
  process.env.DEV_JWT_SECRET = 'dev-test-secret';

  const token = jwt.sign(
    { sub: '11111111-1111-4111-8111-111111111111', email: 'test@example.com' },
    process.env.DEV_JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '5m' },
  );

  const payload = await verifyAccessToken(token);
  assert.equal(payload.sub, '11111111-1111-4111-8111-111111111111');
});

test('rechaza un JWT DEV firmado con otro secreto', async () => {
  process.env.AUTH_MODE = 'dev';
  process.env.DEV_JWT_SECRET = 'expected-secret';
  const token = jwt.sign({ sub: 'user-id' }, 'different-secret', {
    algorithm: 'HS256',
    expiresIn: '5m',
  });

  await assert.rejects(() => verifyAccessToken(token));
});

test('falla al iniciar modo DEV sin secreto', () => {
  process.env.AUTH_MODE = 'dev';
  delete process.env.DEV_JWT_SECRET;
  assert.throws(() => validateAuthConfiguration(), /DEV_JWT_SECRET/);
});

test('valida tokens Supabase HS256 heredados contra el servidor de Auth', async () => {
  const userId = '22222222-2222-4222-8222-222222222222';
  const supabaseUrl = 'https://example.supabase.co';
  process.env.AUTH_MODE = 'supabase';
  process.env.SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';

  const token = jwt.sign(
    {
      sub: userId,
      aud: 'authenticated',
      iss: `${supabaseUrl}/auth/v1`,
    },
    'legacy-test-secret',
    { algorithm: 'HS256', expiresIn: '5m' },
  );

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), `${supabaseUrl}/auth/v1/user`);
    assert.equal(new Headers(init?.headers).get('apikey'), 'sb_publishable_test');
    assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${token}`);
    return new Response(JSON.stringify({ id: userId }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const payload = await verifyAccessToken(token);
  assert.equal(payload.sub, userId);
});

test('valida tokens Supabase RS256 mediante JWKS', async () => {
  const userId = '33333333-3333-4333-8333-333333333333';
  const keyId = 'test-signing-key';
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicJwk = publicKey.export({ format: 'jwk' });

  const server = createServer((request, response) => {
    if (request.url === '/auth/v1/.well-known/jwks.json') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        keys: [{ ...publicJwk, kid: keyId, alg: 'RS256', use: 'sig' }],
      }));
      return;
    }
    response.writeHead(404).end();
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  const supabaseUrl = `http://127.0.0.1:${address.port}`;

  process.env.AUTH_MODE = 'supabase';
  process.env.SUPABASE_URL = supabaseUrl;

  const token = jwt.sign(
    {
      sub: userId,
      aud: 'authenticated',
      iss: `${supabaseUrl}/auth/v1`,
    },
    privateKey,
    { algorithm: 'RS256', keyid: keyId, expiresIn: '5m' },
  );

  try {
    const payload = await verifyAccessToken(token);
    assert.equal(payload.sub, userId);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('valida tokens Supabase ES256 mediante JWKS', async () => {
  const userId = '44444444-4444-4444-8444-444444444444';
  const keyId = 'test-ec-signing-key';
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const publicJwk = publicKey.export({ format: 'jwk' });

  const server = createServer((request, response) => {
    if (request.url === '/auth/v1/.well-known/jwks.json') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        keys: [{ ...publicJwk, kid: keyId, alg: 'ES256', use: 'sig' }],
      }));
      return;
    }
    response.writeHead(404).end();
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');
  const supabaseUrl = `http://127.0.0.1:${address.port}`;

  process.env.AUTH_MODE = 'supabase';
  process.env.SUPABASE_URL = supabaseUrl;

  const token = jwt.sign(
    {
      sub: userId,
      aud: 'authenticated',
      iss: `${supabaseUrl}/auth/v1`,
    },
    privateKey,
    { algorithm: 'ES256', keyid: keyId, expiresIn: '5m' },
  );

  try {
    const payload = await verifyAccessToken(token);
    assert.equal(payload.sub, userId);
  } finally {
    server.close();
    await once(server, 'close');
  }
});
