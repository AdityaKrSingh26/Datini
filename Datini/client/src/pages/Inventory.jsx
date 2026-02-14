import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import CameraScan from '../components/inventory/CameraScan';
import ScanResults from '../components/inventory/ScanResults';
import ProductTable from '../components/inventory/ProductTable';
import Spinner from '../components/common/Spinner';
import dataService from '../services/dataService';
import { PRODUCT_CATEGORIES, INVENTORY_SORT_OPTIONS, TOAST_TYPES } from '../utils/constants';
import { useToast } from '../context/ToastContext';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [stockAlertCount, setStockAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('stock');
  const [scanResults, setScanResults] = useState(null);
  const { showToast } = useToast();

  const loadProducts = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await dataService.getProducts({
        search: searchTerm,
        category: selectedCategory,
        sortBy,
      });
      const list = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
      setProducts(list);
      const low = data?.lowStock ?? [];
      const out = data?.outOfStock ?? [];
      setStockAlertCount((Array.isArray(low) ? low.length : 0) + (Array.isArray(out) ? out.length : 0));
    } catch (err) {
      console.error('Error loading inventory:', err);
      showToast('Failed to load inventory', TOAST_TYPES.ERROR);
      setProducts([]);
      setStockAlertCount(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory, sortBy]);

  const handleScanComplete = (results) => {
    setScanResults(results);
    showToast('Scan completed successfully!', TOAST_TYPES.SUCCESS);
  };

  const handleUpdateStock = async () => {
    if (!scanResults?.length) return;
    try {
      for (const result of scanResults) {
        if (result.discrepancy !== 0) {
          await dataService.updateProductStock(result.productId, result.detectedCount);
        }
      }
      showToast('Stock updated successfully!', TOAST_TYPES.SUCCESS);
      setScanResults(null);
      loadProducts();
    } catch (err) {
      showToast('Failed to update stock', TOAST_TYPES.ERROR);
    }
  };

  const handleDismissScan = () => {
    setScanResults(null);
  };

  return (
    <PageLayout title="Inventory" stockAlertCount={stockAlertCount}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {INVENTORY_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <CameraScan onScanComplete={handleScanComplete} />
        </div>

        <ScanResults
          results={scanResults}
          onUpdate={handleUpdateStock}
          onDismiss={handleDismissScan}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <p className="text-gray-500">Could not load inventory. Make sure the server is running.</p>
            <button
              type="button"
              onClick={loadProducts}
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <ProductTable products={products} />
        )}
      </div>
    </PageLayout>
  );
};

export default Inventory;
