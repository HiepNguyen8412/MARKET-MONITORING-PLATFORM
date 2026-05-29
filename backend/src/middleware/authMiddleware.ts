import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include the user payload
export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwt', (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = decoded as { id: number; role: string };
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header missing' });
  }
};

/**
 * Authorization middleware - checks if user has required roles
 * Must be used AFTER authenticateJWT middleware
 * 
 * @param allowedRoles - Roles that are permitted (e.g., 'admin', 'user')
 * @returns Express middleware function
 * 
 * Usage: router.get('/users', authenticateJWT, authorizeRoles('admin'), handler)
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }

    // Normalize role comparison (case-insensitive)
    const userRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());

    // Check if user's role is in allowed roles
    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // User is authorized, proceed to next middleware/handler
    next();
  };
};

/**
 * BONUS: Socket.io JWT Authentication Snippet
 * 
 * To authenticate Socket.io connections, you can use middleware on the io instance.
 * Add this to your index.ts where io is defined:
 * 
 * io.use((socket, next) => {
 *   const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
 *   if (!token) return next(new Error('Authentication error'));
 *   
 *   jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'supersecretjwt', (err: any, decoded: any) => {
 *     if (err) return next(new Error('Authentication error'));
 *     socket.data.user = decoded;
 *     next();
 *   });
 * });
 */
