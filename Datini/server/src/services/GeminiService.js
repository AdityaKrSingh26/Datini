// src/services/GeminiService.js
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger.js';

let ai = null;

// Lazy initialization of GoogleGenAI
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const MODELS = {
  flash: 'gemini-2.0-flash',
  pro: 'gemini-2.5-pro-preview-06-05'
};

const THINKING_BUDGETS = {
  LOW: 1024,
  MEDIUM: 4096,
  HIGH: 8192
};

/**
 * Call Gemini API with configurable model, thinking, and response format.
 *
 * @param {Object} opts
 * @param {string} opts.prompt - Text prompt
 * @param {'flash'|'pro'} opts.model - Model tier (default: 'flash')
 * @param {'LOW'|'MEDIUM'|'HIGH'} opts.thinkingLevel - Thinking budget (default: 'LOW')
 * @param {string|null} opts.media - Base64 image data (default: null)
 * @param {'HIGH'|'ULTRA_HIGH'} opts.mediaResolution - Media resolution (default: 'HIGH')
 * @param {'json'|'text'} opts.responseFormat - Response format (default: 'json')
 * @param {number} opts.temperature - Temperature (default: 0.1)
 * @returns {Promise<Object|string>} Parsed JSON object or raw text
 */
export async function callGemini({
  prompt,
  model = 'flash',
  thinkingLevel = 'LOW',
  media = null,
  mediaResolution = 'HIGH',
  responseFormat = 'json',
  temperature = 0.1
}) {
  const startTime = Date.now();

  const config = {
    temperature
  };

  // Note: thinkingConfig is not supported in free tier models
  // Uncomment this when using paid tier models that support thinking
  // if (model === 'pro') {
  //   config.thinkingConfig = { thinkingBudget: THINKING_BUDGETS[thinkingLevel] || 1024 };
  // }

  if (responseFormat === 'json') {
    config.responseMimeType = 'application/json';
  }

  const contents = media
    ? [{ inlineData: { mimeType: 'image/jpeg', data: media } }, prompt]
    : prompt;

  if (media) {
    config.mediaResolution = mediaResolution;
  }

  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: MODELS[model] || MODELS.flash,
      contents,
      config
    });

    const latencyMs = Date.now() - startTime;
    logger.info({ model: MODELS[model], latencyMs, thinkingLevel }, 'Gemini call complete');

    const text = response.text;

    if (responseFormat === 'json') {
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1].trim());
        }
        logger.error({ text }, 'Failed to parse Gemini JSON response');
        throw parseErr;
      }
    }

    return text;
  } catch (err) {
    logger.error({ model, err: err.message }, 'Gemini API call failed');
    throw err;
  }
}

export { MODELS, THINKING_BUDGETS };
