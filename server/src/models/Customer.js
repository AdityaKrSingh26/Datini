// models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  phone: {
    type: String,
    required: true,
    match: /^\+91\d{10}$/
  },
  name: {
    type: String,
    default: 'Unknown'
  },
  languagePref: {
    type: String,
    enum: ['hi', 'en', 'kn', 'ta', 'te', 'hi-en'],
    default: 'hi'
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  favoriteItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  creditBalance: {
    type: Number,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 5000
  },
  lastOrderDate: Date,
  notes: String
}, {
  timestamps: true
});

customerSchema.index({ businessId: 1, phone: 1 }, { unique: true });
customerSchema.index({ businessId: 1, creditBalance: -1 });

// Static: top customers by spend
customerSchema.statics.topBySpend = function(businessId, limit = 10) {
  return this.find({ businessId })
    .sort({ totalSpent: -1 })
    .limit(limit);
};

// Static: customers with outstanding credit
customerSchema.statics.withCredit = function(businessId) {
  return this.find({ businessId, creditBalance: { $gt: 0 } })
    .sort({ creditBalance: -1 });
};

export default mongoose.model('Customer', customerSchema);
