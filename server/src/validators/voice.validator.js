// src/validators/voice.validator.js
import { z } from 'zod';

export const voiceCommandSchema = z.object({
  audioText: z.string().min(1, 'Audio text is required'),
  language: z.enum(['hi', 'en', 'kn', 'ta', 'te', 'hi-en']).optional().default('hi')
});
