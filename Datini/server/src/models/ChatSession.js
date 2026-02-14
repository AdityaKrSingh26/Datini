// models/ChatSession.js
import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerName: String,
  language: {
    type: String,
    enum: ['hi', 'en', 'kn', 'ta', 'te', 'hi-en'],
    default: 'hi'
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      intent: String,
      entities: mongoose.Schema.Types.Mixed,
      confidence: Number
    }
  }],
  context: {
    cart: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      quantity: Number,
      unit: String,
      price: Number
    }],
    lastIntent: String,
    awaitingConfirmation: Boolean,
    collectingDetails: Boolean,
    detailsStep: { type: String, enum: ['name', 'address', 'payment', null] },
    customerName: String,
    deliveryAddress: String,
    paymentMethod: { type: String, enum: ['cod', 'credit', null] },
    pendingOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  completedAt: Date,
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

chatSessionSchema.index({ businessId: 1, customerPhone: 1, status: 1 });
chatSessionSchema.index({ businessId: 1, lastMessageAt: -1 });
chatSessionSchema.index({ 'context.pendingOrderId': 1 });

// Method: add message
chatSessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({ role, content, metadata, timestamp: new Date() });
  this.lastMessageAt = new Date();
  return this.save();
};

// Static: find active session
chatSessionSchema.statics.findActiveSession = function(businessId, customerPhone) {
  return this.findOne({
    businessId,
    customerPhone,
    status: 'active',
    lastMessageAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // 30 min timeout
  });
};

export default mongoose.model('ChatSession', chatSessionSchema);
