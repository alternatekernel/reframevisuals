import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      const errorMsg = 'FATAL: JWT_SECRET is not defined. Authentication cannot proceed.';
      console.error(errorMsg);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMsg);
      }
      // In non-production, we still fail but with a clearer log
      return res.status(500).json({ success: false, message: 'Server configuration error: Missing Secret' });
    }
    
    const decoded = jwt.verify(token, secret) as { 
      id: string; 
      email: string; 
      role: string;
      tenantId?: string;
      iat: number;
      exp: number;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authenticated' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  return next();
};

export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authenticated' 
    });
  }

  const staffRoles = ['admin', 'manager', 'accountant', 'editor'];
  if (!staffRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Staff access required' 
    });
  }

  return next();
};

export const requireFinanceStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  const financeRoles = ['admin', 'manager', 'accountant'];
  if (!financeRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Finance access required'
    });
  }

  return next();
};
