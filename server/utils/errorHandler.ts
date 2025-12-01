import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error class
 * Provides structured error handling with status codes and operational flags
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates need for try/catch blocks in every async route
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate responses
 */
export const globalErrorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  return res.status(500).json({
    success: false,
    error: message,
  });
};
