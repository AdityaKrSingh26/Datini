// src/agents/CommandCenter.js
import BaseAgent from './BaseAgent.js';
import { getCommandCenterPrompt } from '../prompts/commandCenter.prompt.js';
import logger from '../utils/logger.js';

class CommandCenter extends BaseAgent {
  constructor() {
    super({ name: 'CommandCenter', model: 'flash', thinkingLevel: 'LOW' });
  }

  /**
   * Classify intent from owner input text.
   * @param {Object} input
   * @param {string} input.text - Raw text from voice or typed input
   * @param {string} input.language - Detected language
   * @returns {Promise<{intent: string, confidence: number, agentId: number, extractedParams: Object}>}
   */
  async process({ text, language = 'hi' }) {
    const systemPrompt = getCommandCenterPrompt();

    const result = await this.callLLM(
      `${systemPrompt}\n\nUSER INPUT (language: ${language}):\n"${text}"`,
      { responseFormat: 'json' }
    );

    logger.info({
      intent: result.intent,
      agentId: result.agentId,
      confidence: result.confidence
    }, 'Intent classified');

    return {
      intent: result.intent || 'dashboard_query',
      confidence: result.confidence || 0.5,
      agentId: result.agentId || 6,
      extractedParams: result.extractedParams || {}
    };
  }
}

export default CommandCenter;
