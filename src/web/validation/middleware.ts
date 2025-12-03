import { Context, Next, MiddlewareHandler } from 'hono';
import { ZodError, ZodSchema, ZodIssue } from 'zod';
import logger from '../../utils/logger.js';

/**
 * Validation error response format
 */
interface ValidationErrorResponse {
  error: string;
  code: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Formats Zod errors into a consistent response format
 */
function formatZodError(error: ZodError): ValidationErrorResponse {
  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: error.issues.map((issue: ZodIssue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

/**
 * Validates request body against a Zod schema
 * Stores validated data in context under 'validatedBody'
 */
export function validateBody<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedBody', validated);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.issues }, 'Body validation failed');
        return c.json(formatZodError(error), 400);
      }
      if (error instanceof SyntaxError) {
        return c.json(
          {
            error: 'Invalid JSON body',
            code: 'INVALID_JSON',
          },
          400,
        );
      }
      throw error;
    }
  };
}

/**
 * Validates query parameters against a Zod schema
 * Stores validated data in context under 'validatedQuery'
 */
export function validateQuery<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validated = schema.parse(query);
      c.set('validatedQuery', validated);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.issues }, 'Query validation failed');
        return c.json(formatZodError(error), 400);
      }
      throw error;
    }
  };
}

/**
 * Validates URL parameters against a Zod schema
 * Stores validated data in context under 'validatedParams'
 */
export function validateParams<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validated = schema.parse(params);
      c.set('validatedParams', validated);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.issues }, 'Params validation failed');
        return c.json(formatZodError(error), 400);
      }
      throw error;
    }
  };
}

// Extend Hono context type for validated data
declare module 'hono' {
  interface ContextVariableMap {
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
  }
}
