// src/middleware/errorHandler.js
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Global error handler middleware
 * Must be the last middleware in the app
 */
export default function errorHandler(err, req, res, next) {
  // Log the error
  logger.error({
    err: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body
  }, 'Request error');

  // Default error status and message
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      message,
      ...(config.nodeEnv === 'development' && {
        stack: err.stack,
        details: err.details
      })
    }
  });
}
