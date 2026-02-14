/**
 * Normalize dashboard API response to the shape expected by Dashboard and Demo pages.
 * @param {Object} raw - Response from getDashboardData (may be { success, data } or unwrapped)
 * @returns {Object|null} Normalized dashboard object or null
 */
export function normalizeDashboardData(raw) {
  if (!raw) return null;
  const pnl = raw.pnl || raw.todayPL || {};
  const gst = raw.gstStatus || {};
  const credit = raw.creditSummary || raw.creditOutstanding || {};
  const pendingList = Array.isArray(raw.pendingOrders) ? raw.pendingOrders : [];
  const pendingCount = typeof raw.pendingOrderCount === 'number' ? raw.pendingOrderCount : (typeof raw.pendingOrders === 'number' ? raw.pendingOrders : pendingList.length);
  const alerts = Array.isArray(raw.stockAlerts) ? raw.stockAlerts : [];
  return {
    business: raw.business || { ownerName: 'Owner', name: 'My Store' },
    todayPL: { sales: pnl.sales ?? 0, expenses: pnl.expenses ?? 0, profit: pnl.profit ?? (pnl.sales - pnl.expenses) ?? 0 },
    pendingOrderCount: pendingCount,
    pendingOrders: pendingList,
    stockAlertCount: raw.stockAlertCount ?? alerts.length,
    stockAlerts: alerts,
    gstStatus: {
      netPayable: gst.netPayable ?? 0,
      itcAvailable: gst.itcAvailable ?? 0,
      dueDate: gst.dueDate ?? gst.nextDueDate ?? new Date().toISOString().slice(0, 10),
    },
    creditOutstanding: {
      total: credit.totalOutstanding ?? credit.total ?? 0,
      topDebtor: credit.topDebtor ?? '—',
      topDebtorAmount: credit.topDebtorAmount ?? 0,
      customerCount: credit.customersWithCredit ?? credit.customerCount ?? 0,
    },
  };
}
