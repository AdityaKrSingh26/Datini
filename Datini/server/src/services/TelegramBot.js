// src/services/TelegramBot.js
import TelegramBot from 'node-telegram-bot-api';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getAgent } from '../agents/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import TelegramUser from '../models/TelegramUser.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' }
];

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.businessId = config.defaultBusinessId;
    this.genAI = null;
  }

  async start() {
    if (!config.telegramBotToken) {
      logger.warn('TELEGRAM_BOT_TOKEN not set, skipping Telegram bot');
      return;
    }

    try {
      // Initialize Gemini for voice transcription
      if (config.geminiApiKey) {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      }

      // Create bot instance
      this.bot = new TelegramBot(config.telegramBotToken, { polling: true });

      logger.info('🤖 Telegram bot started');

      // Handle all messages (text, voice, etc.)
      this.bot.on('message', async (msg) => {
        await this.handleMessage(msg);
      });

      // Handle callback queries (button clicks)
      this.bot.on('callback_query', async (query) => {
        await this.handleCallbackQuery(query);
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

  async getUserOrCreate(msg) {
    const userId = String(msg.from.id);

    let user = await TelegramUser.findOne({ userId });

    if (!user) {
      user = await TelegramUser.create({
        userId,
        chatId: msg.chat.id,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        businessId: this.businessId
      });
    }

    return user;
  }

  async showLanguageSelection(chatId) {
    let message = '🌍 *Select Your Language / अपनी भाषा चुनें*\n\n';
    message += 'Please select your preferred language for communication:\n\n';

    const keyboard = [];
    for (let i = 0; i < LANGUAGES.length; i += 2) {
      const row = [];
      row.push({
        text: `${LANGUAGES[i].flag} ${LANGUAGES[i].name}`,
        callback_data: `lang_${LANGUAGES[i].code}`
      });
      if (i + 1 < LANGUAGES.length) {
        row.push({
          text: `${LANGUAGES[i + 1].flag} ${LANGUAGES[i + 1].name}`,
          callback_data: `lang_${LANGUAGES[i + 1].code}`
        });
      }
      keyboard.push(row);
    }

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }

  async handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = String(query.from.id);

    if (data.startsWith('lang_')) {
      const langCode = data.replace('lang_', '');
      const language = LANGUAGES.find(l => l.code === langCode);

      if (language) {
        // Update user language
        await TelegramUser.findOneAndUpdate(
          { userId },
          {
            language: language.code,
            languageName: language.name
          }
        );

        // Answer callback query
        await this.bot.answerCallbackQuery(query.id);

        // Send confirmation
        const welcomeMessages = {
          en: `✅ Language set to English!\n\nI can help you place orders. Send me your shopping list or a voice message!\n\nExample: "2 kg rice, 1 liter milk, 500g flour"`,
          hi: `✅ भाषा हिंदी में सेट कर दी गई!\n\nमैं आपके ऑर्डर लेने में मदद कर सकती हूं। मुझे अपनी शॉपिंग लिस्ट भेजें या वॉइस मैसेज भेजें!\n\nउदाहरण: "2 किलो चावल, 1 लीटर दूध, 500 ग्राम आटा"`,
          mr: `✅ भाषा मराठीमध्ये सेट केली!\n\nमी तुम्हाला ऑर्डर देण्यात मदत करू शकते. मला तुमची खरेदी यादी पाठवा किंवा व्हॉइस मेसेज पाठवा!`,
          ta: `✅ மொழி தமிழில் அமைக்கப்பட்டது!\n\nஉங்கள் ஆர்டர் செய்ய நான் உதவ முடியும். எனக்கு உங்கள் ஷாப்பிங் பட்டியலை அனுப்பவும்!`,
          te: `✅ భాష తెలుగులో సెట్ చేయబడింది!\n\nమీ ఆర్డర్లు ఇవ్వడానికి నేను సహాయం చేయగలను. మీ షాపింగ్ జాబితా పంపండి!`,
          kn: `✅ ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಹೊಂದಿಸಲಾಗಿದೆ!\n\nನಿಮ್ಮ ಆರ್ಡರ್ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡಬಹುದು. ನಿಮ್ಮ ಶಾಪಿಂಗ್ ಪಟ್ಟಿ ಕಳುಹಿಸಿ!`,
          gu: `✅ ભાષા ગુજરાતીમાં સેટ કરી!\n\nહું તમને ઓર્ડર આપવામાં મદદ કરી શકું છું. મને તમારી શોપિંગ લિસ્ટ મોકલો!`,
          bn: `✅ ভাষা বাংলায় সেট করা হয়েছে!\n\nআমি আপনাকে অর্ডার দিতে সাহায্য করতে পারি। আমাকে আপনার কেনাকাটার তালিকা পাঠান!`,
          ml: `✅ ഭാഷ മലയാളത്തിലേക്ക് സജ്ജമാക്കി!\n\nനിങ്ങളുടെ ഓർഡർ നൽകാൻ ഞാൻ സഹായിക്കാം. നിങ്ങളുടെ ഷോപ്പിംഗ് ലിസ്റ്റ് അയയ്ക്കുക!`,
          pa: `✅ ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਸੈੱਟ ਕੀਤੀ!\n\nਮੈਂ ਤੁਹਾਡੇ ਆਰਡਰ ਦੇਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਮੈਨੂੰ ਆਪਣੀ ਖਰੀਦਦਾਰੀ ਸੂਚੀ ਭੇਜੋ!`
        };

        await this.bot.editMessageText(
          welcomeMessages[langCode] || welcomeMessages.en,
          {
            chat_id: chatId,
            message_id: query.message.message_id
          }
        );
      }
    }
  }

  async transcribeVoice(fileId) {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      // Download voice file
      const fileLink = await this.bot.getFileLink(fileId);
      const response = await fetch(fileLink);
      const audioBuffer = await response.arrayBuffer();

      // Save temporarily
      const tempPath = join(tmpdir(), `voice_${Date.now()}.ogg`);
      writeFileSync(tempPath, Buffer.from(audioBuffer));

      // Transcribe using Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent([
        {
          text: 'Transcribe this audio to text. Only return the transcribed text, nothing else.'
        },
        {
          inlineData: {
            data: Buffer.from(audioBuffer).toString('base64'),
            mimeType: 'audio/ogg'
          }
        }
      ]);

      // Clean up temp file
      unlinkSync(tempPath);

      const transcription = result.response.text();
      return transcription;

    } catch (err) {
      logger.error({ err: err.message }, 'Voice transcription failed');
      throw err;
    }
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    try {
      // Get or create user
      const user = await this.getUserOrCreate(msg);
      await user.updateActivity();

      // Handle /start command
      if (msg.text === '/start') {
        if (!user.language) {
          await this.showLanguageSelection(chatId);
          return;
        } else {
          const welcomeMessages = {
            en: '🙏 Welcome back! Send your shopping list or voice message.',
            hi: '🙏 स्वागत है! अपनी शॉपिंग लिस्ट या वॉइस मैसेज भेजें।',
            mr: '🙏 परत स्वागत आहे! तुमची खरेदी यादी पाठवा.',
            ta: '🙏 மீண்டும் வரவேற்கிறோம்! உங்கள் ஷாப்பிங் பட்டியலை அனுப்பவும்.',
            te: '🙏 మళ్లీ స్వాగతం! మీ షాపింగ్ జాబితా పంపండి.',
            kn: '🙏 ಮತ್ತೆ ಸ್ವಾಗತ! ನಿಮ್ಮ ಶಾಪಿಂಗ್ ಪಟ್ಟಿ ಕಳುಹಿಸಿ.',
            gu: '🙏 ફરી સ્વાગત છે! તમારી શોપિંગ લિસ્ટ મોકલો.',
            bn: '🙏 আবার স্বাগতম! আপনার কেনাকাটার তালিকা পাঠান.',
            ml: '🙏 വീണ്ടും സ്വാഗതം! നിങ്ങളുടെ ഷോപ്പിംഗ് ലിസ്റ്റ് അയയ്ക്കുക.',
            pa: '🙏 ਮੁੜ ਸੁਆਗਤ ਹੈ! ਆਪਣੀ ਖਰੀਦਦਾਰੀ ਸੂਚੀ ਭੇਜੋ.'
          };
          await this.bot.sendMessage(chatId, welcomeMessages[user.language] || welcomeMessages.en);
          return;
        }
      }

      // Handle /language command to change language
      if (msg.text === '/language') {
        await this.showLanguageSelection(chatId);
        return;
      }

      // Check if user has selected language
      if (!user.language) {
        await this.bot.sendMessage(chatId,
          'Please select your language first using the menu above. / कृपया पहले अपनी भाषा चुनें।'
        );
        return;
      }

      let messageText = msg.text;

      // Handle voice messages
      if (msg.voice) {
        console.log('\n' + '🎤'.repeat(80));
        console.log('VOICE MESSAGE RECEIVED');
        console.log('🎤'.repeat(80));
        console.log('From:', username, '| User ID:', userId);
        console.log('Duration:', msg.voice.duration, 'seconds');
        console.log('🎤'.repeat(80) + '\n');

        await this.bot.sendChatAction(chatId, 'typing');

        const processingMessages = {
          en: '🎤 Processing your voice message...',
          hi: '🎤 आपका वॉइस मैसेज प्रोसेस हो रहा है...',
          mr: '🎤 तुमचा व्हॉइस मेसेज प्रक्रिया करत आहे...',
          ta: '🎤 உங்கள் குரல் செய்தியை செயலாக்குகிறது...',
          te: '🎤 మీ వాయిస్ మెసేజ్ ప్రాసెస్ చేస్తోంది...',
          kn: '🎤 ನಿಮ್ಮ ಧ್ವನಿ ಸಂದೇಶವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
          gu: '🎤 તમારો વૉઇસ મેસેજ પ્રોસેસ કરી રહ્યા છીએ...',
          bn: '🎤 আপনার ভয়েস মেসেজ প্রক্রিয়া করা হচ্ছে...',
          ml: '🎤 നിങ്ങളുടെ വോയ്സ് സന്ദേശം പ്രോസസ്സ് ചെയ്യുന്നു...',
          pa: '🎤 ਤੁਹਾਡਾ ਵੌਇਸ ਸੁਨੇਹਾ ਪ੍ਰੋਸੈਸ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...'
        };

        const statusMsg = await this.bot.sendMessage(
          chatId,
          processingMessages[user.language] || processingMessages.en
        );

        try {
          // Transcribe voice
          messageText = await this.transcribeVoice(msg.voice.file_id);

          console.log('Transcribed Text:', messageText);

          // Delete processing message
          await this.bot.deleteMessage(chatId, statusMsg.message_id);

        } catch (err) {
          logger.error({ err: err.message }, 'Voice transcription failed');

          const errorMessages = {
            en: 'Sorry, I couldn\'t understand the voice message. Please try again or send a text message.',
            hi: 'क्षमा करें, मैं वॉइस मैसेज नहीं समझ सकी। कृपया फिर से कोशिश करें या टेक्स्ट भेजें।',
            mr: 'माफ करा, मला व्हॉइस मेसेज समजला नाही. कृपया पुन्हा प्रयत्न करा.',
            ta: 'மன்னிக்கவும், குரல் செய்தியை புரிந்து கொள்ள முடியவில்லை.',
            te: 'క్షమించండి, వాయిస్ మెసేజ్ అర్థం కాలేదు.',
            kn: 'ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ಸಂದೇಶ ಅರ್ಥವಾಗಲಿಲ್ಲ.',
            gu: 'માફ કરશો, વૉઇસ મેસેજ સમજાયો નહીં.',
            bn: 'দুঃখিত, ভয়েস মেসেজ বুঝতে পারিনি.',
            ml: 'ക്ഷമിക്കണം, വോയ്സ് സന്ദേശം മനസ്സിലായില്ല.',
            pa: 'ਮਾਫ਼ ਕਰਨਾ, ਵੌਇਸ ਸੁਨੇਹਾ ਸਮਝ ਨਹੀਂ ਆਇਆ.'
          };

          await this.bot.editMessageText(
            errorMessages[user.language] || errorMessages.en,
            {
              chat_id: chatId,
              message_id: statusMsg.message_id
            }
          );
          return;
        }
      }

      // Skip if no text (other media types)
      if (!messageText) {
        return;
      }

      console.log('\n' + '📱'.repeat(80));
      console.log('TELEGRAM MESSAGE RECEIVED');
      console.log('📱'.repeat(80));
      console.log('From:', username, '| User ID:', userId);
      console.log('Language:', user.language);
      console.log('Message:', messageText);
      console.log('📱'.repeat(80) + '\n');

      // Show typing indicator
      await this.bot.sendChatAction(chatId, 'typing');

      // Process through ChatBot agent
      const chatBot = getAgent(7);

      const phone = user.phone || `+91${userId}`;

      const result = await chatBot.process({
        phone,
        text: messageText,
        businessId: this.businessId,
        language: user.language
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

      const errorMessages = {
        en: 'Sorry, technical problem occurred. Please try again. 🙏',
        hi: 'क्षमा करें, तकनीकी समस्या हुई। कृपया फिर से कोशिश करें। 🙏',
        mr: 'माफ करा, तांत्रिक समस्या आली. कृपया पुन्हा प्रयत्न करा. 🙏',
        ta: 'மன்னிக்கவும், தொழில்நுட்ப சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும். 🙏',
        te: 'క్షమించండి, సాంకేతిక సమస్య సంభవించింది. దయచేసి మళ్లీ ప్రయత్నించండి. 🙏',
        kn: 'ಕ್ಷಮಿಸಿ, ತಾಂತ್ರಿಕ ಸಮಸ್ಯೆ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. 🙏',
        gu: 'માફ કરશો, ટેકનિકલ સમસ્યા આવી. કૃપા કરીને ફરી પ્રયાસ કરો. 🙏',
        bn: 'দুঃখিত, প্রযুক্তিগত সমস্যা হয়েছে। আবার চেষ্টা করুন। 🙏',
        ml: 'ക്ഷമിക്കണം, സാങ്കേതിക പ്രശ്നം സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക. 🙏',
        pa: 'ਮਾਫ਼ ਕਰਨਾ, ਤਕਨੀਕੀ ਸਮੱਸਿਆ ਆਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ। 🙏'
      };

      const user = await this.getUserOrCreate(msg);
      await this.bot.sendMessage(
        chatId,
        errorMessages[user.language] || errorMessages.en
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
