import { useState, useEffect } from 'react';
import { Search, Users, CreditCard } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import CustomerCard from '../components/customers/CustomerCard';
import Spinner from '../components/common/Spinner';
import dataService from '../services/dataService';
import { CUSTOMER_SORT_OPTIONS, TOAST_TYPES } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showCreditOnly, setShowCreditOnly] = useState(false);
  const [remindersSent, setRemindersSent] = useState({});
  const { showToast } = useToast();

  const loadCustomers = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await dataService.getCustomers({
        search: searchTerm,
        sortBy,
        creditOnly: showCreditOnly,
      });
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error loading customers:', err);
      showToast('Failed to load customers', TOAST_TYPES.ERROR);
      setCustomers([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, sortBy, showCreditOnly]);

  const handleSendReminder = async (customer) => {
    try {
      await dataService.sendCustomerReminder(customer._id);
      showToast(
        `Payment reminder sent to ${customer.name}`,
        TOAST_TYPES.SUCCESS
      );
      setRemindersSent((prev) => ({ ...prev, [customer._id]: true }));
      setTimeout(() => {
        setRemindersSent((prev) => ({ ...prev, [customer._id]: false }));
      }, 5000);
    } catch (err) {
      showToast(err?.message || 'Failed to send reminder', TOAST_TYPES.ERROR);
    }
  };

  return (
    <PageLayout title="Customers">
      <div className="space-y-6">
        <div className="flex gap-2 border-b pb-4">
          <button
            onClick={() => setShowCreditOnly(false)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              !showCreditOnly
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <Users size={20} />
            All Customers
          </button>
          <button
            onClick={() => setShowCreditOnly(true)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              showCreditOnly
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <CreditCard size={20} />
            Credit Book
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {CUSTOMER_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <p className="text-gray-500">Could not load customers. Make sure the server is running.</p>
            <button
              type="button"
              onClick={loadCustomers}
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {showCreditOnly
                ? 'No customers with outstanding credit'
                : 'No customers found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
              <CustomerCard
                key={customer._id}
                customer={customer}
                onSendReminder={handleSendReminder}
                reminderSent={remindersSent[customer._id]}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Customers;
