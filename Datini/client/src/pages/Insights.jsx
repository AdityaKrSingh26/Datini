import { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import SummaryCards from '../components/insights/SummaryCards';
import WeeklySalesChart from '../components/insights/WeeklySalesChart';
import TopProductsChart from '../components/insights/TopProductsChart';
import TrendsPanel from '../components/insights/TrendsPanel';
import Spinner from '../components/common/Spinner';
import dataService from '../services/dataService';
import { useToast } from '../context/ToastContext';
import { TOAST_TYPES } from '../utils/constants';

const normalizeInsights = (raw) => {
  if (!raw) return null;
  const dailySales = raw.dailySales ?? raw.weeklyData ?? [];
  const weeklyData = dailySales.map((d) => ({ ...d, day: d.day ?? d.date ?? '' }));
  const topProducts = (raw.topProducts ?? []).map((p) => ({ ...p, unitsSold: p.unitsSold ?? p.quantity ?? 0 }));
  return { ...raw, weeklyData, topProducts };
};

const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { showToast } = useToast();

  const loadInsights = async () => {
    setLoading(true);
    setError(false);
    try {
      const raw = await dataService.getInsights();
      setInsights(normalizeInsights(raw));
    } catch (err) {
      console.error('Error loading insights:', err);
      showToast('Failed to load insights', TOAST_TYPES.ERROR);
      setInsights(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <PageLayout title="Insights">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (error || !insights) {
    return (
      <PageLayout title="Insights">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <p className="text-dark-500 font-medium">Could not load insights. Make sure the server is running.</p>
          <button
            type="button"
            onClick={loadInsights}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Insights">
      <div className="space-y-6">
        <SummaryCards insights={insights} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklySalesChart data={insights.weeklyData ?? []} />
          <TopProductsChart data={insights.topProducts ?? []} />
        </div>

        <TrendsPanel insights={insights} />
      </div>
    </PageLayout>
  );
};

export default Insights;
