import { Request, Response } from 'express';
import {
  getRoute,
  getWeather,
  parseCoordinate,
  parsePoint,
  parseRouteProfile,
  TravelServiceError,
} from '../services/travelService';

const respondWithError = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof TravelServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(fallback, error);
  res.status(500).json({ error: fallback });
};

export const currentWeather = async (req: Request, res: Response): Promise<void> => {
  const latitud = parseCoordinate(req.query.latitud, -90, 90);
  const longitud = parseCoordinate(req.query.longitud, -180, 180);
  if (latitud === null || longitud === null) {
    res.status(400).json({ error: 'Las coordenadas del clima son inválidas.' });
    return;
  }

  try {
    res.status(200).json({ data: await getWeather({ latitud, longitud }) });
  } catch (error) {
    respondWithError(res, error, 'No fue posible consultar el clima.');
  }
};

export const calculateRoute = async (req: Request, res: Response): Promise<void> => {
  const origin = parsePoint(req.body?.origen);
  const destination = parsePoint(req.body?.destino);
  const profile = parseRouteProfile(req.body?.perfil ?? 'driving-car');
  if (!origin || !destination || !profile) {
    res.status(400).json({ error: 'El origen, destino o perfil de ruta es inválido.' });
    return;
  }

  try {
    res.status(200).json({ data: await getRoute(origin, destination, profile) });
  } catch (error) {
    respondWithError(res, error, 'No fue posible calcular la ruta.');
  }
};

