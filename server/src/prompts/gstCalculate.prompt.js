// src/prompts/gstCalculate.prompt.js

export function getGstCalculatePrompt({ transactions, period }) {
  return `SYSTEM: GST calculation engine for Indian MSMEs.

GST RATE TABLE:
0%  — fresh produce, milk, eggs, atta, salt
5%  — rice, dal, oil, sugar, tea, bread
12% — butter, ghee, fruit juices
18% — Maggi, biscuits, soap, toothpaste, detergent

TRANSACTIONS FOR ${period || 'this month'}:
${JSON.stringify(transactions || [])}

OUTPUT (JSON only):
{
  "period": "${period || 'current month'}",
  "totalSales": 0,
  "gstCollected": 0,
  "totalPurchases": 0,
  "itcAvailable": 0,
  "netPayable": 0,
  "nextDueDate": "YYYY-MM-DD",
  "breakdown": [
    {"hsnCode": "1006", "description": "Rice", "taxableValue": 0, "gstRate": 5, "gstAmount": 0}
  ],
  "explanation": "Simple language summary"
}`;
}
