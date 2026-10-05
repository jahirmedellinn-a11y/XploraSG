import jwt, { JwtPayload } from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';

export type AuthMode = 'dev' | 'supabase';

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

const jwksClients = new Map<string, JwksClient>();

const getSupabaseUrl = (): string => {
  const value = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!value) {
    throw new AuthConfigurationError('SUPABASE_URL no está configurado.');
  }
  return value;
};

export const getAuthMode = (): AuthMode => {
  const configuredMode = process.env.AUTH_MODE?.trim().toLowerCase();

  if (configuredMode === 'dev' || configuredMode === 'supabase') {
    return configuredMode;
  }

  if (configuredMode) {
    throw new AuthConfigurationError('AUTH_MODE debe ser "dev" o "supabase".');
  }

  return process.env.SUPABASE_URL?.trim() ? 'supabase' : 'dev';
};

const assertPayload = (decoded: string | JwtPayload): JwtPayload => {
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('El token no contiene un identificador de usuario válido.');
  }
  return decoded;
};

const verifyDevToken = (token: string): JwtPayload => {
  const secret = process.env.DEV_JWT_SECRET;
  if (!secret) {
    throw new AuthConfigurationError('DEV_JWT_SECRET no está configurado.');
  }

  return assertPayload(jwt.verify(token, secret, { algorithms: ['HS256'] }));
};

const getJwksClient = (supabaseUrl: string): JwksClient => {
  const existing = jwksClients.get(supabaseUrl);
  if (existing) {
    return existing;
  }

  const client = jwksClient({
    jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
    cache: true,
    cacheMaxAge: 10 * 60 * 1000,
    cacheMaxEntries: 5,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    timeout: 5000,
  });
  jwksClients.set(supabaseUrl, client);
  return client;
};

const verifyAsymmetricSupabaseToken = async (
  token: string,
  supabaseUrl: string,
  algorithm: 'RS256' | 'ES256',
  keyId: string,
): Promise<JwtPayload> => {
  const signingKey = await getJwksClient(supabaseUrl).getSigningKey(keyId);
  const decoded = jwt.verify(token, signingKey.getPublicKey(), {
    algorithms: [algorithm],
    audience: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated',
    issuer: `${supabaseUrl}/auth/v1`,
    clockTolerance: 5,
  });

  return assertPayload(decoded);
};

const verifyLegacySupabaseToken = async (
  token: string,
  supabaseUrl: string,
): Promise<JwtPayload> => {
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (publishableKey) {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error('Supabase rechazó el token de acceso.');
    }

    const authUser = (await response.json()) as { id?: string };
    const decoded = jwt.decode(token);
    const payload = decoded ? assertPayload(decoded) : null;

    if (!payload || authUser.id !== payload.sub) {
      throw new Error('El usuario del token no coincide con Supabase Auth.');
    }
    return payload;
  }

  const legacySecret = process.env.SUPABASE_JWT_SECRET;
  if (!legacySecret) {
    throw new AuthConfigurationError(
      'Para tokens HS256 configura SUPABASE_PUBLISHABLE_KEY o, temporalmente, SUPABASE_JWT_SECRET.',
    );
  }

  return assertPayload(
    jwt.verify(token, legacySecret, {
      algorithms: ['HS256'],
      audience: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
      clockTolerance: 5,
    }),
  );
};

const verifySupabaseToken = async (token: string): Promise<JwtPayload> => {
  const supabaseUrl = getSupabaseUrl();
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded || typeof decoded === 'string') {
    throw new Error('Token JWT inválido.');
  }

  const { alg, kid } = decoded.header;

  if (alg === 'HS256') {
    return verifyLegacySupabaseToken(token, supabaseUrl);
  }

  if ((alg === 'RS256' || alg === 'ES256') && kid) {
    return verifyAsymmetricSupabaseToken(token, supabaseUrl, alg, kid);
  }

  throw new Error('Algoritmo o identificador de firma JWT no permitido.');
};

export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  return getAuthMode() === 'supabase'
    ? verifySupabaseToken(token)
    : verifyDevToken(token);
};

export const validateAuthConfiguration = (): AuthMode => {
  const mode = getAuthMode();
  if (mode === 'dev' && !process.env.DEV_JWT_SECRET) {
    throw new AuthConfigurationError('DEV_JWT_SECRET no está configurado.');
  }
  if (mode === 'supabase') {
    getSupabaseUrl();
  }
  return mode;
};

