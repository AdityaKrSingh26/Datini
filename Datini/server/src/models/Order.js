// models/Order.js
import mongoose from 'mongoose';

// Auto-generate order IDs: KRN-2026-XXXX
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customerName: String,
  customerPhone: {
    type: String,
    required: true
  },
  deliveryAddress: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  gstTotal: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'credit'],
    default: 'cod'
  },
  creditAmount: {
    type: Number,
    default: 0
  },
  deliveryEstimate: {
    type: String,
    default: '30 min'
  },
  source: {
    type: String,
    enum: ['chatbot', 'manual', 'phone'],
    default: 'chatbot'
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String
  }],
  acceptedAt: Date,
  deliveredAt: Date
}, {
  timestamps: true
});

// Pre-save: auto-generate orderId
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    const year = new Date().getFullYear();
    const counter = await Counter.findByIdAndUpdate(
      `order-${year}`,
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    this.orderId = `KRN-${year}-${String(counter.seq).padStart(4, '0')}`;
    this.statusHistory = [{ status: 'pending', changedBy: 'chatbot' }];
  }
  next();
});

orderSchema.index({ businessId: 1, status: 1, createdAt: -1 });
orderSchema.index({ customerPhone: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 }, { unique: true });

export default mongoose.model('Order', orderSchema);
