import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = (err as any).status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  // FIX: Sanitize logging for production - avoid full object dump
  if (isDev) {
    console.error('[Error]:', err);
  } else {
    console.error(`[Error] ${status}: ${err.message || 'Internal Server Error'}`);
  }

  const message = err.message || 'Internal Server Error';
  
  return res.status(status).json({
    success: false,
    message: (isDev || status < 500) ? message : 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  (error as any).status = 404;
  return next(error);
};
