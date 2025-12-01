import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { fromZodError } from 'zod-validation-error';

/**
 * Validation middleware factory
 * Creates a middleware that validates request body against a Zod schema
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
          error: fromZodError(error).message 
        });
      }
      next(error);
    }
  };

/**
 * Query parameter validation middleware
 * Validates query parameters against a Zod schema
 */
export const validateQuery = (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: fromZodError(error).message
        });
      }
      next(error);
    }
  };

/**
 * Route params validation middleware
 * Validates route parameters against a Zod schema
 */
export const validateParams = (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: fromZodError(error).message
        });
      }
      next(error);
    }
  };
