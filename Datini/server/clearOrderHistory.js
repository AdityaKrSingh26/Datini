// Script to clear all order-related data while keeping inventory
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const clearOrderHistory = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Define models with loose schemas
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    const CreditEntry = mongoose.model('CreditEntry', new mongoose.Schema({}, { strict: false }));
    const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false }));
    const Counter = mongoose.model('Counter', new mongoose.Schema({}, { strict: false }));

    // Count documents before deletion
    const orderCount = await Order.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    const creditCount = await CreditEntry.countDocuments();
    const customerCount = await Customer.countDocuments();
    const counterCount = await Counter.countDocuments();

    console.log('📊 Current Data:');
    console.log(`  - Orders: ${orderCount}`);
    console.log(`  - Transactions: ${transactionCount}`);
    console.log(`  - Credit Entries: ${creditCount}`);
    console.log(`  - Customers: ${customerCount}`);
    console.log(`  - Counters: ${counterCount}`);
    console.log('');

    if (orderCount === 0 && transactionCount === 0 && creditCount === 0 && customerCount === 0) {
      console.log('✅ No order history to delete');
      await mongoose.connection.close();
      return;
    }

    console.log('🗑️  Deleting order history...');

    // Delete all order-related data
    const orderResult = await Order.deleteMany({});
    console.log(`  ✓ Deleted ${orderResult.deletedCount} orders`);

    const transactionResult = await Transaction.deleteMany({});
    console.log(`  ✓ Deleted ${transactionResult.deletedCount} transactions`);

    const creditResult = await CreditEntry.deleteMany({});
    console.log(`  ✓ Deleted ${creditResult.deletedCount} credit entries`);

    const customerResult = await Customer.deleteMany({});
    console.log(`  ✓ Deleted ${customerResult.deletedCount} customers`);

    const counterResult = await Counter.deleteMany({});
    console.log(`  ✓ Deleted ${counterResult.deletedCount} counters`);

    console.log('\n✅ Successfully cleared all order history!');
    console.log('📦 Inventory data (Products, Suppliers, Business) has been preserved.');

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error clearing order history:', error);
    process.exit(1);
  }
};

clearOrderHistory();
