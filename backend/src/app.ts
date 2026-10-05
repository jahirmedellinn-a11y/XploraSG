import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { testConnection } from './config/db';
import authRoutes from './routes/authRoutes';
import testRoutes from './routes/testRoutes';
import catalogRoutes from './routes/catalogRoutes';
import travelRoutes from './routes/travelRoutes';
import assistantRoutes from './routes/assistantRoutes';

const app = express();
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
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Endpoints básicos
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running correctly.' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const time = await testConnection();
    res.status(200).json({ status: 'ok', message: 'Database connected successfully', time });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/catalogo', catalogRoutes);
app.use('/api/viaje', travelRoutes);
app.use('/api/asistente', assistantRoutes);

export default app;
