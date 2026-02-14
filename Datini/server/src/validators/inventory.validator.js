// src/validators/inventory.validator.js
import { z } from 'zod';

export const inventoryScanSchema = z.object({
  image: z.string().min(100, 'Base64 image data required')
});
