import { Request, Response, NextFunction } from 'express';
import { TENANT_PLATFORM } from '../constants/tenant';


export interface TenantRequest extends Request {
  tenantId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
}

export const TENANT_CONTEXT = 'tenantContext';

export interface TenantContext {
  tenantId: string;
  isPlatform: boolean;
  customerId?: string;
}

export const setTenantContext = (req: TenantRequest, context: TenantContext) => {
  (req as any)[TENANT_CONTEXT] = context;
};

export const getTenantContext = (req: TenantRequest): TenantContext | null => {
  return (req as any)[TENANT_CONTEXT] || null;
};

export const getTenantId = (req: TenantRequest): string | null => {
  const context = getTenantContext(req);
  return context?.tenantId || null;
};

export const isTenantPlatform = (req: TenantRequest): boolean => {
  const context = getTenantContext(req);
  return context?.isPlatform || false;
};

export const resolveTenantFromUser = async (user: { id: string; role: string; email: string; tenantId?: string }): Promise<TenantContext> => {
  // Use tenantId from JWT (set during login from Customer table)
  // Admin roles always get 'platform' tenantId for dashboard access
  if (user.tenantId) {
    const isPlatform = user.role === 'admin' || user.role === 'manager' || user.role === 'accountant';
    return {
      tenantId: isPlatform ? TENANT_PLATFORM : user.tenantId,
      isPlatform,
      customerId: isPlatform ? undefined : user.tenantId,
    };
  }
  
  // CRITICAL: No valid tenantId in JWT - reject request
  throw new Error('Invalid tenant context: no tenantId in token');
};

export const attachTenantContext = async (req: TenantRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next();
    }

    const context = await resolveTenantFromUser(req.user);
    setTenantContext(req, context);
    
    req.user.tenantId = context.tenantId;

    // Enforce PostgreSQL RLS context (Disabled for MySQL compatibility)
    // await (prisma as any).$executeRawUnsafe(`SET app.current_tenant_id = '${context.tenantId}'`);
    
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireTenant = (requiredRole?: 'platform' | 'customer') => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const context = getTenantContext(req);
    
    if (!context) {
      return res.status(401).json({
        success: false,
        message: 'Tenant context not established',
      });
    }

    if (requiredRole === 'platform' && !context.isPlatform) {
      return res.status(403).json({
        success: false,
        message: 'Platform access required',
      });
    }

    if (requiredRole === 'customer' && context.isPlatform) {
      return res.status(403).json({
        success: false,
        message: 'Customer access required',
      });
    }

    return next();
  };
};

export const createTenantFilter = (tenantId: string | null, isPlatform: boolean) => {
  if (isPlatform || !tenantId) {
    return {};
  }
  return { tenantId };
};

export const withTenantFilter = <T extends { tenantId?: string }>(
  isPlatform: boolean,
  baseFilter: T
): T => {
  if (isPlatform) {
    return baseFilter;
  }
  return { ...baseFilter };
};