/**
 * Validation Middleware
 * 
 * Provides Zod schema validation middleware for Express
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Validate request body against a Zod schema
 */
export const validate = (schema: z.ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: error.errors.map(e => e.message).join(', ')
        });
      }
      next(error);
    }
  };

/**
 * Validate request query parameters against a Zod schema
 */
export const validateQuery = (schema: z.ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: error.errors.map(e => e.message).join(', ')
        });
      }
      next(error);
    }
  };
