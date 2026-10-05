import { Request, Response } from 'express';
import * as favoritesService from '../services/favoritesService';

export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const favorites = await favoritesService.getFavorites(req.user.id);
    res.json(favorites);
  } catch (error) {
    console.error('Error in getFavorites:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const addFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const lugarIdStr = typeof req.params.lugarId === 'string' ? req.params.lugarId : req.params.lugarId[0];
    const lugarId = parseInt(lugarIdStr, 10);
    if (isNaN(lugarId)) {
      res.status(400).json({ message: 'ID de lugar inválido' });
      return;
    }
    
    await favoritesService.addFavorite(req.user.id, lugarId);
    res.status(201).json({ message: 'Favorito agregado' });
  } catch (error) {
    console.error('Error in addFavorite:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const lugarIdStr = typeof req.params.lugarId === 'string' ? req.params.lugarId : req.params.lugarId[0];
    const lugarId = parseInt(lugarIdStr, 10);
    if (isNaN(lugarId)) {
      res.status(400).json({ message: 'ID de lugar inválido' });
      return;
    }
    
    await favoritesService.removeFavorite(req.user.id, lugarId);
    res.status(200).json({ message: 'Favorito eliminado' });
  } catch (error) {
    console.error('Error in removeFavorite:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const syncFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const { lugarIds } = req.body;
    if (!Array.isArray(lugarIds)) {
      res.status(400).json({ message: 'Formato inválido. Se espera un arreglo de IDs.' });
      return;
    }
    
    const validIds = lugarIds.filter(id => typeof id === 'number' && !isNaN(id));
    const allFavorites = await favoritesService.syncFavorites(req.user.id, validIds);
    res.status(200).json(allFavorites);
  } catch (error) {
    console.error('Error in syncFavorites:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
