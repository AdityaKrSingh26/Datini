// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  nameEn: {
    type: String,
    required: true,
    trim: true
  },
  nameHi: String,
  nameKn: String,
  nameTa: String,
  nameTe: String,
  aliases: {
    type: [String],
    default: [],
    index: true
  },
  category: {
    type: String,
    enum: ['grains', 'pulses', 'oils', 'dairy', 'vegetables', 'fruits',
           'snacks', 'instant', 'beverages', 'cleaning', 'personal_care', 'other'],
    required: true
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'L', 'ml', 'pkt', 'bar', 'tube', 'dozen', 'piece', '100g', '250g', '400g', '500g', '500ml'],
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Boolean,
    default: true
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  hsnCode: {
    type: String,
    match: /^\d{4}$/
  },
  gstRate: {
    type: Number,
    enum: [0, 5, 12, 18, 28],
    default: 0
  },
  avgDailySales: {
    type: Number,
    default: 0
  },
  alternatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

productSchema.index({ businessId: 1, nameEn: 1 });
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ aliases: 1 });
productSchema.index({ businessId: 1, available: 1 });

// Virtual: days of stock remaining
productSchema.virtual('daysOfStock').get(function() {
  if (this.avgDailySales === 0) return Infinity;
  return Math.round(this.currentStock / this.avgDailySales * 10) / 10;
});

// Method: check if below reorder
productSchema.methods.needsReorder = function() {
  return this.currentStock <= this.reorderLevel;
};

// Static: find by alias (for ChatBot NLU matching)
productSchema.statics.findByAlias = function(businessId, alias) {
  return this.findOne({
    businessId,
    aliases: { $regex: new RegExp(`^${alias}$`, 'i') }
  });
};

export default mongoose.model('Product', productSchema);
