// src/prompts/bookkeeper.prompt.js

export function getBookkeeperPrompt({ catalog }) {
  return `SYSTEM: Parse natural language into a structured transaction.
Understand Indian business terms: udhar (credit), khata (account),
baki (outstanding), nagad (cash), UPI.

PRODUCT CATALOG:
${catalog}

INPUT: Voice-transcribed text from store owner
OUTPUT (JSON only):
{
  "type": "sale|expense|purchase",
  "customerName": "string or null",
  "items": [{"alias": "rice", "quantity": 2, "unit": "kg"}],
  "totalAmount": 90,
  "paymentMethod": "cash|upi|credit",
  "confidence": 0.95,
  "needsClarification": false,
  "clarificationMessage": null
}`;
}
