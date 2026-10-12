import { NextFunction, Request, Response } from 'express';

// Limitador de solicitudes en memoria por IP/usuario (suficiente para una instancia).
export const rateLimit = ({ windowMs, max, message }: { windowMs: number; max: number; message: string }) => {
  const hits = new Map<string, { count: number; start: number }>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers['x-forwarded-for'];
    const key = req.user?.id
      || (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim())
      || req.ip
      || 'anon';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      if (hits.size > 10_000) hits.clear();
      hits.set(key, { count: 1, start: now });
      next();
      return;
    }
    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
};
