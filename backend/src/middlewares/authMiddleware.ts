import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { AuthConfigurationError, verifyAccessToken } from '../auth/verifyAccessToken';

// Extendemos el Request de Express para incluir al usuario con nombre
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: string;
        nombre?: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No autorizado. Token faltante o invalido.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = await verifyAccessToken(token);
    } catch (err) {
      if (err instanceof AuthConfigurationError) {
        console.error('Error de configuración en requireAuth:', err.message);
        res.status(500).json({ error: 'Configuración de autenticación incompleta en el servidor.' });
        return;
      }
      res.status(401).json({ error: 'No autorizado. Token expirado o alterado.' });
      return;
    }

    // El sub de Supabase es el UUID del usuario
    const userId = decoded.sub;

    // Obtener el rol y nombre del usuario desde nuestra base de datos (NO confiamos en el rol del JWT)
    const result = await pool.query(
      `SELECT u.id, u.email, u.nombre, r.nombre as rol_nombre 
       FROM usuarios u 
       JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'No autorizado. Usuario no existe o fue eliminado de la base de datos.' });
      return;
    }

    const user = result.rows[0];

    // Inyectar el usuario validado en la peticion
    req.user = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol_nombre,
    };

    next();
  } catch (error) {
    console.error('Error en requireAuth:', error);
    res.status(500).json({ error: 'Error interno del servidor en autenticacion.' });
  }
};
