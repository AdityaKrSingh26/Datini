// src/prompts/insightsReport.prompt.js

export function getInsightsReportPrompt({ transactions, period, businessName }) {
  return `SYSTEM: You are a business insights analyst for "${businessName || 'the store'}".

Analyze the transaction data and generate a weekly business report.

TRANSACTION DATA (${period || 'last 7 days'}):
${JSON.stringify(transactions || [])}

OUTPUT (JSON only):
{
  "period": "${period || 'last 7 days'}",
  "summary": {
    "totalSales": 0,
    "totalExpenses": 0,
    "netProfit": 0,
    "transactionCount": 0,
    "avgOrderValue": 0
  },
  "dailySales": [
    {"date": "YYYY-MM-DD", "sales": 0, "expenses": 0, "profit": 0}
  ],
  "topProducts": [
    {"name": "Rice", "revenue": 0, "quantity": 0, "unit": "kg"}
  ],
  "trends": [
    "Sales are up 15% compared to last week",
    "Maggi is the fastest-moving item"
  ],
  "anomalies": [],
  "recommendations": [
    "Consider bulk ordering Rice — high demand detected"
  ],
  "cashFlowForecast": [
    {"date": "YYYY-MM-DD", "projected": 0}
  ]
}`;
}
