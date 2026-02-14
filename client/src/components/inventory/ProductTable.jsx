import StockIndicator from './StockIndicator';
import { formatCurrency, getCategoryLabel, getDaysLeft } from '../../utils/formatters';

const ProductTable = ({ products }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Left</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">GST %</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-800">{product.nameEn}</div>
                    <div className="text-sm text-gray-500">{product.nameHi}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {getCategoryLabel(product.category)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-gray-800">
                    {product.currentStock} {product.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-600">
                  {product.reorderLevel} {product.unit}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    {getDaysLeft(product.currentStock, product.reorderLevel)}d
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <StockIndicator
                      currentStock={product.currentStock}
                      reorderLevel={product.reorderLevel}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">
                  {formatCurrency(product.pricePerUnit)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-600">
                  {product.gstRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
