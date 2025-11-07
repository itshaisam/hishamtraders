/**
 * Error Handler Middleware for Hisham Traders ERP
 *
 * Global error handler that catches all unhandled errors and formats them consistently
 * Handles AppError, Prisma errors, Zod validation errors, JWT errors, and unexpected errors
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import logger from '../lib/logger.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as { user?: { userId: string } }).user?.userId,
  });

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err instanceof ValidationError && { errors: err.errors }),
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return handleZodError(err, res);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response) {
  switch (err.code) {
    case 'P2002': // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        field: (err.meta?.target as string[])?.[0],
      });

    case 'P2025': // Record not found
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
      });

    case 'P2003': // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to related record',
        code: 'INVALID_REFERENCE',
      });

    default:
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        code: 'DATABASE_ERROR',
      });
  }
}

function handleZodError(err: ZodError, res: Response) {
  const errors: Record<string, string> = {};

  err.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    errors,
  });
}

// 404 handler (no route matched)
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
}
