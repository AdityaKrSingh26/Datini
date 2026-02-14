// src/config/index.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  geminiApiKey: process.env.GEMINI_API_KEY,
  defaultBusinessId: process.env.DEFAULT_BUSINESS_ID,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
};
