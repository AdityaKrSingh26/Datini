// src/agents/BaseAgent.js
import { callGemini } from '../services/GeminiService.js';
import logger from '../utils/logger.js';

class BaseAgent {
  /**
   * @param {Object} opts
   * @param {string} opts.name - Agent name for logging
   * @param {'flash'|'pro'} opts.model - Default model
   * @param {'LOW'|'MEDIUM'|'HIGH'} opts.thinkingLevel - Default thinking level
   */
  constructor({ name, model = 'flash', thinkingLevel = 'LOW' }) {
    this.name = name;
    this.model = model;
    this.thinkingLevel = thinkingLevel;
  }

  /**
   * Call Gemini API with agent defaults + optional overrides.
   */
  async callLLM(prompt, overrides = {}) {
    const startTime = Date.now();

    // Log input prompt
    console.log('\n' + '='.repeat(80));
    console.log(`[${this.name}] LLM INPUT`);
    console.log('='.repeat(80));
    console.log('Prompt:', prompt.substring(0, 500) + (prompt.length > 500 ? '...' : ''));
    console.log('Model:', overrides.model || this.model);
    console.log('='.repeat(80) + '\n');

    try {
      const result = await callGemini({
        prompt,
        model: overrides.model || this.model,
        thinkingLevel: overrides.thinkingLevel || this.thinkingLevel,
        ...overrides
      });

      // Log output response
      console.log('\n' + '='.repeat(80));
      console.log(`[${this.name}] LLM OUTPUT`);
      console.log('='.repeat(80));
      const responseStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      console.log('Response:', responseStr.substring(0, 500) + (responseStr.length > 500 ? '...' : ''));
      console.log('Latency:', Date.now() - startTime, 'ms');
      console.log('='.repeat(80) + '\n');

      logger.info({
        agent: this.name,
        model: overrides.model || this.model,
        latencyMs: Date.now() - startTime
      }, 'Agent LLM call complete');
      return result;
    } catch (err) {
      console.log('\n' + '='.repeat(80));
      console.log(`[${this.name}] LLM ERROR`);
      console.log('='.repeat(80));
      console.log('Error:', err.message);
      console.log('='.repeat(80) + '\n');

      logger.error({ agent: this.name, err: err.message }, 'Agent LLM call failed');
      throw err;
    }
  }

  /**
   * Override in subclasses — main entry point for agent processing.
   */
  async process(input) {
    throw new Error(`${this.name}.process() not implemented`);
  }
}

export default BaseAgent;
