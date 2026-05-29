import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // Bypass authentication for public access
  // We assign a default user (ID: 1) so that existing logic dependent on req.user still works
  req.user = { id: 1, role: 'USER' };
  next();
}
