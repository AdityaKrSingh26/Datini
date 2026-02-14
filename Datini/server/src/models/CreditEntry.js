// models/CreditEntry.js
import mongoose from 'mongoose';

const creditEntrySchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['debit', 'payment'],
    required: true
  },
  productSummary: String,
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'written_off'],
    default: 'pending'
  },
  reminderSentAt: Date,
  paidAt: Date
}, {
  timestamps: true
});

creditEntrySchema.index({ businessId: 1, customerPhone: 1, status: 1 });
creditEntrySchema.index({ businessId: 1, createdAt: -1 });

export default mongoose.model('CreditEntry', creditEntrySchema);
