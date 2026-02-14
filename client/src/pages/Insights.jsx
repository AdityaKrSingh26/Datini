import { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import SummaryCards from '../components/insights/SummaryCards';
import WeeklySalesChart from '../components/insights/WeeklySalesChart';
import TopProductsChart from '../components/insights/TopProductsChart';
import TrendsPanel from '../components/insights/TrendsPanel';
import Spinner from '../components/common/Spinner';
import dataService from '../services/dataService';

const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const insightData = dataService.getInsights();
      setInsights(insightData);
      setLoading(false);
    }, 500);
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

  return (
    <PageLayout title="Insights">
      <div className="space-y-6">
        <SummaryCards insights={insights} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklySalesChart data={insights.weeklyData} />
          <TopProductsChart data={insights.topProducts} />
        </div>

        <TrendsPanel insights={insights} />
      </div>
    </PageLayout>
  );
};

export default Insights;
