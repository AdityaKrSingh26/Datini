import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';

const CameraScan = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
  };

  const handleCapture = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const mockResults = [
        { productId: 'prod_001', name: 'Basmati Rice', detectedCount: 47, currentStock: 45, discrepancy: 2 },
        { productId: 'prod_002', name: 'Toor Dal', detectedCount: 14, currentStock: 15, discrepancy: -1 },
        { productId: 'prod_007', name: 'Tomato', detectedCount: 8, currentStock: 8, discrepancy: 0 },
      ];

      onScanComplete(mockResults);
      setIsAnalyzing(false);
      setIsScanning(false);
    }, 2000);
  };

  const handleClose = () => {
    setIsScanning(false);
    setIsAnalyzing(false);
  };

  return (
    <>
      <Button onClick={handleStartScan} className="w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Camera size={20} />
          Scan Shelf
        </div>
      </Button>

      <Modal isOpen={isScanning} onClose={handleClose} title="Camera Scan" size="lg">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Analyzing shelf items...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Camera size={64} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera feed would appear here</p>
                <p className="text-xs mt-1 opacity-75">Position camera towards shelf</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCapture} variant="success" className="flex-1">
                Capture & Analyze
              </Button>
              <Button onClick={handleClose} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CameraScan;
