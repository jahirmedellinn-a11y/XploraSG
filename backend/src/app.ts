import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { testConnection } from './config/db';
import authRoutes from './routes/authRoutes';
import testRoutes from './routes/testRoutes';
import catalogRoutes from './routes/catalogRoutes';
import travelRoutes from './routes/travelRoutes';
import assistantRoutes from './routes/assistantRoutes';
import favoritesRoutes from './routes/favoritesRoutes';
import agendaRoutes from './routes/agendaRoutes';
import providerRoutes from './routes/providerRoutes';
import adminRoutes from './routes/adminRoutes';
import publicFeedbackRoutes from './routes/publicFeedbackRoutes';
import { sanitizeInput } from './middlewares/sanitizeMiddleware';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Detrás de un proxy HTTPS (Render, Railway, Nginx…) para que las IP y el protocolo sean correctos.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por CORS.'));
  },
}));
app.use(helmet({
  // HSTS sólo tiene efecto en HTTPS; obliga al navegador a usar siempre TLS.
  strictTransportSecurity: isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
  crossOriginResourcePolicy: { policy: 'same-site' },
}));
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInput);

// Endpoints básicos
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running correctly.' });
});

if (!isProduction) app.get('/api/db-test', async (req, res) => {
  try {
    const time = await testConnection();
    res.status(200).json({ status: 'ok', message: 'Database connected successfully', time });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
if (!isProduction) app.use('/api/test', testRoutes);
app.use('/api/catalogo', catalogRoutes);
app.use('/api/viaje', travelRoutes);
app.use('/api/asistente', assistantRoutes);
app.use('/api/favoritos', favoritesRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/prestador', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicFeedbackRoutes);

// Errores no controlados: siempre JSON (antes CORS devolvía una página HTML con 500).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if ((err as Error & { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido.' });
    return;
  }
  if ((err as Error & { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'La solicitud es demasiado grande.' });
    return;
  }
  if (err.message === 'Origen no permitido por CORS.') {
    res.status(403).json({ error: err.message });
    return;
  }
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

export default app;
