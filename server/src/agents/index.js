// src/agents/index.js
import CommandCenter from './CommandCenter.js';
import BookkeeperAgent from './BookkeeperAgent.js';
import InventoryVisionAgent from './InventoryVisionAgent.js';
import SupplierAgent from './SupplierAgent.js';
import PricingAgent from './PricingAgent.js';
import GstAgent from './GstAgent.js';
import InsightsAgent from './InsightsAgent.js';
import ChatBotAgent from './ChatBotAgent.js';
import OrderManagerAgent from './OrderManagerAgent.js';

const agents = {};

export function registerAgent(id, agent) {
  agents[id] = agent;
}

export function getAgent(id) {
  return agents[id] || null;
}

export function getAllAgents() {
  return { ...agents };
}

// Register all 9 agents
// Owner-facing agents (0-6)
registerAgent(0, new CommandCenter());
registerAgent(1, new BookkeeperAgent());
registerAgent(2, new InventoryVisionAgent());
registerAgent(3, new SupplierAgent());
registerAgent(4, new PricingAgent());
registerAgent(5, new GstAgent());
registerAgent(6, new InsightsAgent());

// Customer-facing agents (7-8) — Phase 4
registerAgent(7, new ChatBotAgent());
registerAgent(8, new OrderManagerAgent());
