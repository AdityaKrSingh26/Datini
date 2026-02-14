// src/validators/chat.validator.js
import { z } from 'zod';

export const chatMessageSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number'),
  text: z.string().min(1, 'Message text is required'),
  businessId: z.string().optional()
});
