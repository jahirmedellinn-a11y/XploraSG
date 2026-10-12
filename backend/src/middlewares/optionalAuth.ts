import { NextFunction, Request, Response } from 'express';
import { requireAuth } from './authMiddleware';

// Si llega un token válido se identifica al usuario; si no, la petición continúa como anónima.
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    next();
    return;
  }
  const fakeRes = {
    status: () => ({ json: () => next() }),
  } as unknown as Response;
  void requireAuth(req, fakeRes, next);
};
