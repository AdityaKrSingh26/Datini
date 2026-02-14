// src/middleware/validate.js

/**
 * Express middleware factory for Zod schema validation.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: result.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        }
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
