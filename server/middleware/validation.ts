/**
 * Zod-based Request Validation Middleware
 * 
 * Provides standardized request validation helpers for Express routes.
 */

import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";

/**
 * Error response for validation failures
 */
interface ValidationErrorResponse {
    success: false;
    error: string;
    details?: Array<{
        field: string;
        message: string;
    }>;
}

/**
 * Formats Zod errors into a user-friendly structure
 */
function formatZodError(error: ZodError): ValidationErrorResponse {
    const details = error.errors.map((err) => ({
        field: err.path.join(".") || "unknown",
        message: err.message,
    }));

    return {
        success: false,
        error: "Validation failed",
        details,
    };
}

/**
 * Generic validation middleware factory
 */
function createValidationMiddleware<T extends ZodSchema>(
    schema: T,
    source: "body" | "params" | "query"
) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = schema.parse(req[source]);
            req[source] = data;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json(formatZodError(error));
            }
            return res.status(500).json({
                success: false,
                error: "Internal validation error",
            });
        }
    };
}

/**
 * Validates request body against a Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
    return createValidationMiddleware(schema, "body");
}

/**
 * Validates URL params against a Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
    return createValidationMiddleware(schema, "params");
}

/**
 * Validates query string against a Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
    return createValidationMiddleware(schema, "query");
}

/**
 * Combined validation for body, params, and query
 */
export function validateAll<
    TBody extends ZodSchema,
    TParams extends ZodSchema,
    TQuery extends ZodSchema
>(schemas: { body?: TBody; params?: TParams; query?: TQuery }) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json(formatZodError(error));
            }
            return res.status(500).json({
                success: false,
                error: "Internal validation error",
            });
        }
    };
}
