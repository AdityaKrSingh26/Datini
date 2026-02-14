// Script to clear all chat session history from the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const clearChatHistory = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the ChatSession model
    const ChatSession = mongoose.model('ChatSession', new mongoose.Schema({}, { strict: false }));

    // Count documents before deletion
    const countBefore = await ChatSession.countDocuments();
    console.log(`Found ${countBefore} chat sessions`);

    if (countBefore === 0) {
      console.log('No chat sessions to delete');
      await mongoose.connection.close();
      return;
    }

    console.log('Deleting all chat sessions...');
    const result = await ChatSession.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} chat sessions`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error clearing chat history:', error);
    process.exit(1);
  }
};

clearChatHistory();
