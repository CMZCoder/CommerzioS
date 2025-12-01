import { Response } from 'express';

/**
 * Standard success response helper
 * Provides consistent response format across the API
 */
export const successResponse = <T>(
  res: Response, 
  data: T, 
  message?: string,
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({ 
    success: true, 
    data, 
    message 
  });
};

/**
 * Standard error response helper
 * Provides consistent error format across the API
 */
export const errorResponse = (
  res: Response, 
  code: number, 
  message: string,
  errors?: Record<string, string>
): Response => {
  return res.status(code).json({ 
    success: false, 
    error: message,
    errors
  });
};

/**
 * Paginated response helper
 * Wraps data with pagination metadata
 */
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  perPage: number,
  total: number
): Response => {
  return res.json({
    success: true,
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      hasMore: page * perPage < total,
    },
  });
};
