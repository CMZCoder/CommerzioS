/**
 * API Response Utilities
 * 
 * Provides standardized API response formats
 */

import { Response } from 'express';

/**
 * Send a success response with data
 */
export const successResponse = <T>(res: Response, data: T, message?: string, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

/**
 * Send an error response
 */
export const errorResponse = (res: Response, statusCode: number, message: string) => {
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

/**
 * Send a paginated response
 */
export const paginatedResponse = <T>(
  res: Response, 
  data: T[], 
  total: number, 
  page: number, 
  limit: number
) => {
  res.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};
