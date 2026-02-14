import { AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const ScanResults = ({ results, onUpdate, onDismiss }) => {
  if (!results || results.length === 0) return null;

  const totalItems = results.length;
  const hasDiscrepancies = results.some((r) => r.discrepancy !== 0);

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {hasDiscrepancies ? (
            <AlertCircle className="text-yellow-500" size={24} />
          ) : (
            <CheckCircle className="text-green-500" size={24} />
          )}
          <div>
            <h3 className="font-semibold text-gray-800">Scan Results</h3>
            <p className="text-sm text-gray-600">
              {totalItems} items detected
              {hasDiscrepancies && ' • Discrepancies found'}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">AI Count</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Current Stock</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.map((result, idx) => (
              <tr key={idx} className={result.discrepancy !== 0 ? 'bg-yellow-50' : ''}>
                <td className="px-4 py-2 text-sm font-medium">{result.name}</td>
                <td className="px-4 py-2 text-sm text-right">{result.detectedCount}</td>
                <td className="px-4 py-2 text-sm text-right">{result.currentStock}</td>
                <td className="px-4 py-2 text-sm text-right">
                  <span
                    className={
                      result.discrepancy > 0
                        ? 'text-green-600 font-semibold'
                        : result.discrepancy < 0
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-600'
                    }
                  >
                    {result.discrepancy > 0 ? '+' : ''}
                    {result.discrepancy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasDiscrepancies && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Alerts:</strong> Stock discrepancies detected. Review and update inventory if needed.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onUpdate} variant="success" className="flex-1">
          Update Stock
        </Button>
        <Button onClick={onDismiss} variant="secondary">
          Dismiss
        </Button>
      </div>
    </Card>
  );
};

export default ScanResults;
