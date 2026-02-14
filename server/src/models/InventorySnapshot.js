// models/InventorySnapshot.js
import mongoose from 'mongoose';

const inventorySnapshotSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  snapshotDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    category: String,
    currentStock: Number,
    unit: String,
    pricePerUnit: Number,
    totalValue: Number,
    reorderLevel: Number,
    needsReorder: Boolean,
    daysOfStock: Number
  }],
  summary: {
    totalItems: Number,
    totalValue: Number,
    lowStockCount: Number,
    outOfStockCount: Number,
    categories: [{
      name: String,
      itemCount: Number,
      totalValue: Number
    }]
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'manual'],
    default: 'daily'
  },
  notes: String
}, {
  timestamps: true
});

inventorySnapshotSchema.index({ businessId: 1, snapshotDate: -1 });
inventorySnapshotSchema.index({ businessId: 1, type: 1, snapshotDate: -1 });

// Static: get latest snapshot
inventorySnapshotSchema.statics.getLatest = function(businessId) {
  return this.findOne({ businessId })
    .sort({ snapshotDate: -1 })
    .populate('items.productId');
};

// Static: compare snapshots
inventorySnapshotSchema.statics.compareSnapshots = function(businessId, startDate, endDate) {
  return this.find({
    businessId,
    snapshotDate: { $gte: startDate, $lte: endDate }
  }).sort({ snapshotDate: 1 });
};

export default mongoose.model('InventorySnapshot', inventorySnapshotSchema);
