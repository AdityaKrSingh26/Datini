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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('stock');
  const [scanResults, setScanResults] = useState(null);
  const { showToast } = useToast();

  const loadProducts = () => {
    setLoading(true);
    setTimeout(() => {
      const productData = dataService.getProducts({
        search: searchTerm,
        category: selectedCategory,
        sortBy: sortBy,
      });
      setProducts(productData);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory, sortBy]);

  const handleScanComplete = (results) => {
    setScanResults(results);
    showToast('Scan completed successfully!', TOAST_TYPES.SUCCESS);
  };

  const handleUpdateStock = () => {
    scanResults.forEach((result) => {
      if (result.discrepancy !== 0) {
        dataService.updateProductStock(result.productId, result.detectedCount);
      }
    });

    showToast('Stock updated successfully!', TOAST_TYPES.SUCCESS);
    setScanResults(null);
    loadProducts();
  };

  const handleDismissScan = () => {
    setScanResults(null);
  };

  const stockAlerts = dataService.getStockAlerts();

  return (
    <PageLayout title="Inventory" stockAlertCount={stockAlerts.length}>
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
