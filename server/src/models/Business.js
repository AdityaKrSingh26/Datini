// models/Business.js
import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['kirana', 'textile', 'food', 'electronics', 'pharmacy', 'general'],
    default: 'kirana'
  },
  ownerName: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['hi', 'en', 'kn', 'ta', 'te'],
    default: 'hi'
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^\+91\d{10}$/
  },
  gstNumber: {
    type: String,
    match: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: { type: String, match: /^\d{6}$/ }
  },
  chatbot: {
    enabled: { type: Boolean, default: true },
    qrCodeUrl: String,
    welcomeMessage: String
  }
}, {
  timestamps: true
});

businessSchema.index({ phone: 1 });
businessSchema.index({ 'address.city': 1 });

export default mongoose.model('Business', businessSchema);
