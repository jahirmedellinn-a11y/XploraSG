import pool from '../config/db';

export const getFavorites = async (userId: string) => {
  const query = `
    SELECT l.id, l.nombre, l.slug, l.descripcion, l.latitud, l.longitud, m.url as imagen_principal
    FROM favoritos f
    JOIN lugares_turisticos l ON f.lugar_id = l.id
    LEFT JOIN lugar_multimedia lm ON l.id = lm.lugar_id AND lm.es_principal = true
    LEFT JOIN multimedia m ON lm.multimedia_id = m.id
    WHERE f.usuario_id = $1
    ORDER BY f.created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

export const addFavorite = async (userId: string, lugarId: number) => {
  const query = `
    INSERT INTO favoritos (usuario_id, lugar_id)
    VALUES ($1, $2)
    ON CONFLICT (usuario_id, lugar_id) DO NOTHING
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, lugarId]);
  return rows[0];
};

export const removeFavorite = async (userId: string, lugarId: number) => {
  const query = `
    DELETE FROM favoritos
    WHERE usuario_id = $1 AND lugar_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, lugarId]);
  return rows[0];
};

export const syncFavorites = async (userId: string, lugarIds: number[]) => {
  if (!lugarIds || lugarIds.length === 0) return [];
  
  // Create an array of (userId, lugarId) pairs
  const values = lugarIds.map((_, index) => `($1, $${index + 2})`).join(', ');
  const query = `
    INSERT INTO favoritos (usuario_id, lugar_id)
    VALUES ${values}
    ON CONFLICT (usuario_id, lugar_id) DO NOTHING
  `;
  
  await pool.query(query, [userId, ...lugarIds]);
  return await getFavorites(userId);
};
