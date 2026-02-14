// models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  type: {
    type: String,
    enum: ['sale', 'expense', 'purchase'],
    required: true
  },
  source: {
    type: String,
    enum: ['voice', 'manual', 'chatbot'],
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    totalPrice: Number,
    gstAmount: Number
  }],
  customerName: String,
  customerPhone: String,
  totalAmount: {
    type: Number,
    required: true
  },
  gstTotal: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'credit'],
    default: 'cash'
  },
  rawInput: String
}, {
  timestamps: true
});

transactionSchema.index({ businessId: 1, createdAt: -1 });
transactionSchema.index({ businessId: 1, type: 1, createdAt: -1 });
transactionSchema.index({ businessId: 1, customerPhone: 1 });
transactionSchema.index({ orderId: 1 });

// Static: today's summary
transactionSchema.statics.todaySummary = function(businessId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return this.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId), createdAt: { $gte: startOfDay } } },
    { $group: {
      _id: '$type',
      total: { $sum: '$totalAmount' },
      gst: { $sum: '$gstTotal' },
      count: { $sum: 1 }
    }}
  ]);
};

// Static: monthly summary for GST
transactionSchema.statics.monthlySummary = function(businessId, month, year) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return this.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId), createdAt: { $gte: start, $lt: end } } },
    { $unwind: '$items' },
    { $group: {
      _id: { type: '$type', hsnCode: '$items.hsnCode' },
      totalAmount: { $sum: '$items.totalPrice' },
      totalGst: { $sum: '$items.gstAmount' },
      count: { $sum: 1 }
    }}
  ]);
};

export default mongoose.model('Transaction', transactionSchema);
