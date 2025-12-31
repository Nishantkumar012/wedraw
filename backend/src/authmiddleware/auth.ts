import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request object to add a user property
declare global {
  namespace Express {
    export interface Request {
      userId?: string; // Add your custom properties here
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {

    // console.log("Raw header", req.headers);
    
  const token = req.header('Authorization')?.replace('Bearer ', '');

    // console.log("Auth header", req.header('Authorization'));
  if (!token) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.userId = decoded.userId; // Attach user information to the request object
    next(); // Pass control to the next handler
  } catch (error) {
    res.status(401).send('Unauthorized: Invalid token');
  }
};
