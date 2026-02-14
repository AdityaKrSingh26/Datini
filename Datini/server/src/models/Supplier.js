// models/Supplier.js
import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: String,
  phone: {
    type: String,
    required: true,
    match: /^\+91\d{10}$/
  },
  email: {
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  gstNumber: {
    type: String,
    match: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: { type: String, match: /^\d{6}$/ }
  },
  categories: [{
    type: String,
    enum: ['grains', 'pulses', 'oils', 'dairy', 'vegetables', 'fruits',
           'snacks', 'instant', 'beverages', 'cleaning', 'personal_care', 'other']
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net7', 'net15', 'net30', 'net60'],
    default: 'immediate'
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: String,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

supplierSchema.index({ businessId: 1, name: 1 });
supplierSchema.index({ businessId: 1, categories: 1 });
supplierSchema.index({ businessId: 1, active: 1 });

// Static: find by category
supplierSchema.statics.findByCategory = function(businessId, category) {
  return this.find({
    businessId,
    categories: category,
    active: true
  }).sort({ rating: -1 });
};

export default mongoose.model('Supplier', supplierSchema);
