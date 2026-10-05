import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

const getDevJwtSecret = (): string | undefined => process.env.DEV_JWT_SECRET;

/**
 * Endpoint TEMPORAL de desarrollo (MOCK de Supabase Auth).
 * Simula el registro en auth.users y el trigger en public.usuarios.
 * En producción, esto no existirá porque el frontend llamará directamente a Supabase SDK.
 */
export const devRegister = async (req: Request, res: Response): Promise<void> => {
  const { email, nombre } = req.body;
  const rol = 'turista'; // Asignación segura y obligatoria.

  const jwtSecret = getDevJwtSecret();
  if (!jwtSecret) {
    res.status(500).json({ error: 'DEV_JWT_SECRET no configurado en entorno de desarrollo.' });
    return;
  }

  if (!email || !nombre) {
    res.status(400).json({ error: 'Email y nombre son requeridos' });
    return;
  }

  if (req.body.rol) {
    res.status(403).json({ error: 'No se permite asignar el rol desde la solicitud.' });
    return;
  }

  try {
    // Buscar si el rol existe
    const roleResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', [rol]);
    if (roleResult.rows.length === 0) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }
    const rol_id = roleResult.rows[0].id;

    // Verificar si el correo ya existe
    const userExist = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      res.status(400).json({ error: 'El usuario ya existe' });
      return;
    }

    const newId = uuidv4();

    // Insertar en nuestra tabla pública (simulando lo que haría el trigger de Supabase)
    await pool.query(
      'INSERT INTO usuarios (id, email, rol_id, nombre) VALUES ($1, $2, $3, $4)',
      [newId, email, rol_id, nombre]
    );

    // Generar un JWT simulando la estructura de Supabase
    const token = jwt.sign(
      { sub: newId, email, role: 'authenticated' },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Usuario registrado localmente (Mock Supabase)',
      user: { id: newId, email, nombre, rol },
      token
    });
  } catch (error) {
    console.error('Error en devRegister:', error);
    res.status(500).json({ error: 'Error registrando usuario en base de datos local' });
  }
};

/**
 * Endpoint TEMPORAL de desarrollo para login.
 * Solo requiere email en desarrollo, para no inventar un sistema de contraseñas plano
 * que contradiga el uso futuro de Supabase.
 */
export const devLogin = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const jwtSecret = getDevJwtSecret();
  if (!jwtSecret) {
    res.status(500).json({ error: 'DEV_JWT_SECRET no configurado en entorno de desarrollo.' });
    return;
  }

  if (!email) {
    res.status(400).json({ error: 'Email requerido' });
    return;
  }

  try {
    const userResult = await pool.query(
      'SELECT u.id, u.email, u.nombre, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = $1 AND u.deleted_at IS NULL',
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas o usuario no existe' });
      return;
    }

    const user = userResult.rows[0];

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: 'authenticated' },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login exitoso (Mock Supabase)',
      user,
      token
    });
  } catch (error) {
    console.error('Error en devLogin:', error);
    res.status(500).json({ error: 'Error interno del servidor en login local' });
  }
};

/**
 * Endpoint definitivo para obtener el perfil actual.
 * Funciona igual con mock local o con JWT real de Supabase, porque
 * extrae el UUID del token y lee public.usuarios.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  // req.user ya fue validado por requireAuth e inyectado con los datos de BD
  res.status(200).json({
    user: req.user
  });
};
