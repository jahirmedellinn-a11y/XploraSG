import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autorizado. Se requiere autenticación previa.' });
      return;
    }

    if (!allowedRoles.includes(req.user.rol)) {
      res.status(403).json({ 
        error: 'Prohibido. No tienes los permisos necesarios para realizar esta acción.',
        requiredRoles: allowedRoles,
        yourRole: req.user.rol
      });
      return;
    }

    next();
  };
};
