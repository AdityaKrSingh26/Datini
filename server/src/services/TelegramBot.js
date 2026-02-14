// src/services/TelegramBot.js
import TelegramBot from 'node-telegram-bot-api';
import { getAgent } from '../agents/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.businessId = config.defaultBusinessId;
  }

  async start() {
    if (!config.telegramBotToken) {
      logger.warn('TELEGRAM_BOT_TOKEN not set, skipping Telegram bot');
      return;
    }

    try {
      // Create bot instance
      this.bot = new TelegramBot(config.telegramBotToken, { polling: true });

      logger.info('🤖 Telegram bot started');

      // Handle text messages
      this.bot.on('message', async (msg) => {
        await this.handleMessage(msg);
      });

      // Handle errors
      this.bot.on('polling_error', (error) => {
        logger.error({ err: error.message }, 'Telegram polling error');
      });

      // Get bot info
      const botInfo = await this.bot.getMe();
      console.log('\n' + '🤖'.repeat(40));
      console.log('TELEGRAM BOT CONNECTED');
      console.log('🤖'.repeat(40));
      console.log('Bot Username:', '@' + botInfo.username);
      console.log('Bot Name:', botInfo.first_name);
      console.log('Bot ID:', botInfo.id);
      console.log('Ready to receive messages!');
      console.log('🤖'.repeat(40) + '\n');

    } catch (err) {
      logger.error({ err: err.message }, 'Failed to start Telegram bot');
      throw err;
    }
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    // Skip non-text messages
    if (!text) {
      return;
    }

    // Skip commands (except /start)
    if (text.startsWith('/')) {
      if (text === '/start') {
        await this.bot.sendMessage(chatId,
          '🙏 Namaste! Welcome to Datini Merchant Bot.\n\n' +
          'Main kirana orders leti hoon. Aap apni shopping list bhejo!\n\n' +
          'Example: "2 kg chawal, 1 litre doodh, 500g atta"'
        );
      }
      return;
    }

    console.log('\n' + '📱'.repeat(80));
    console.log('TELEGRAM MESSAGE RECEIVED');
    console.log('📱'.repeat(80));
    console.log('From:', username, '| User ID:', userId);
    console.log('Chat ID:', chatId);
    console.log('Message:', text);
    console.log('📱'.repeat(80) + '\n');

    try {
      // Show typing indicator
      await this.bot.sendChatAction(chatId, 'typing');

      // Process through ChatBot agent
      const chatBot = getAgent(7);

      // Use userId as phone number for now (in production, you'd collect this)
      const phone = `+91${userId}`;

      const result = await chatBot.process({
        phone,
        text,
        businessId: this.businessId
      });

      // Send response
      await this.bot.sendMessage(chatId, result.botMessage, {
        parse_mode: 'Markdown'
      });

      console.log('\n' + '📱'.repeat(80));
      console.log('TELEGRAM RESPONSE SENT');
      console.log('📱'.repeat(80));
      console.log('To:', username);
      console.log('Message:', result.botMessage.substring(0, 100) + '...');
      console.log('📱'.repeat(80) + '\n');

    } catch (err) {
      logger.error({ err: err.message, chatId }, 'Error handling Telegram message');
      await this.bot.sendMessage(chatId,
        'Sorry, kuch technical problem ho gayi. Please try again. 🙏'
      );
    }
  }

  async stop() {
    if (this.bot) {
      await this.bot.stopPolling();
      logger.info('Telegram bot stopped');
    }
  }
}

export default new TelegramBotService();
