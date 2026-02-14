// src/models/TelegramUser.js
import mongoose from 'mongoose';

const telegramUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  chatId: {
    type: Number,
    required: true
  },
  username: String,
  firstName: String,
  lastName: String,
  language: {
    type: String,
    enum: ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'gu', 'bn', 'ml', 'pa'],
    default: null // null means not selected yet
  },
  languageName: String, // e.g., "हिंदी", "English"
  phone: String,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActive on any interaction
telegramUserSchema.methods.updateActivity = function() {
  this.lastActive = new Date();
  return this.save();
};

export default mongoose.model('TelegramUser', telegramUserSchema);
