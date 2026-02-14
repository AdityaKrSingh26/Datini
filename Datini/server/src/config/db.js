// src/config/db.js
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export async function connectDB() {
  try {
    // Validate MongoDB URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    logger.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    logger.info('='.repeat(30));
    logger.info('MongoDB connected successfully');
    logger.info(`Database: ${mongoose.connection.db.databaseName}`);
    logger.info('='.repeat(30));
  } catch (err) {
    logger.error('='.repeat(30));
    logger.error(err, 'MongoDB connection failed');
    logger.error('Server cannot start without database connection');
    logger.error('='.repeat(30));
    process.exit(1);
  }
}
