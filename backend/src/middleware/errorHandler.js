import { ApiError } from '../utils/apiError.js';

export const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, 'Route not found.'));
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error instanceof ApiError ? error.statusCode : 500;
  let message = error.message ?? 'Internal server error.';
  let details = error.details ?? null;

  if (error.name === 'ZodError') {
    statusCode = 400;
    if (Array.isArray(error.issues)) {
      message = error.issues
        .map((issue) => {
          const path = issue.path.join('.');
          return `${path}: ${issue.message}`;
        })
        .join(', ');
      details = error.issues;
    }
  }

  if (!(error instanceof ApiError) && error.name !== 'ZodError') {
    console.error(error);
  }

  res.status(statusCode).json({
    message,
    details,
  });
};

