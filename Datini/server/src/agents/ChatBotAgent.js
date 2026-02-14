// src/agents/ChatBotAgent.js
import BaseAgent from './BaseAgent.js';
import { getChatOrderParsePrompt } from '../prompts/chatOrderParse.prompt.js';
import { getChatRespondPrompt } from '../prompts/chatRespond.prompt.js';
import { ChatSession, Product, Customer } from '../models/index.js';
import catalogService from '../services/CatalogService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import logger from '../utils/logger.js';

// Greeting patterns (Hindi/English/Hinglish/Kannada)
const GREETING_PATTERNS = /^(hi|hello|hey|namaste|namaskar|namasthe|hola|vannakkam|namaskara|kaise ho|haan ji|bhaiya|didi|are|arre|oye)\b/i;
const CONFIRM_PATTERNS = /^(haan|haa|ha|yes|yep|yeah|ok|okay|confirm|done|theek|thik|sahi|bolo|haanji|hogaya|place order|order karo|kardo)\b/i;
const CANCEL_PATTERNS = /^(nahi|naa|no|cancel|ruko|band karo|mat|chhodo|hatao|nako)\b/i;
const MODIFY_PATTERNS = /^(aur|and|ek aur|one more|add|bhi|plus|saath mein)\b/i;

class ChatBotAgent extends BaseAgent {
  constructor() {
    super({ name: 'ChatBot', model: 'flash', thinkingLevel: 'LOW' });
  }

  /**
   * Process a customer message.
   * @param {Object} input
   * @param {string} input.phone - Customer phone number
   * @param {string} input.text - Message text
   * @param {string} input.businessId - Business ID
   * @returns {Promise<{botMessage: string, session: Object}>}
   */
  async process({ phone, text, businessId }) {
    console.log('\n' + '█'.repeat(80));
    console.log('💬 CHATBOT RECEIVED MESSAGE');
    console.log('█'.repeat(80));
    console.log('📱 Phone:', phone);
    console.log('💭 Text:', text);
    console.log('🏪 Business:', businessId);
    console.log('█'.repeat(80) + '\n');

    // Get or create active session
    let session = await ChatSession.findActiveSession(businessId, phone);

    if (!session) {
      console.log('🆕 Creating new chat session for', phone);
      session = new ChatSession({
        businessId,
        customerPhone: phone,
        status: 'active',
        messages: [],
        context: {
          cart: [],
          awaitingConfirmation: false,
          collectingDetails: false,
          detailsStep: null, // 'name', 'address', 'payment'
          customerName: null,
          deliveryAddress: null,
          paymentMethod: null
        }
      });
      await session.save();
    } else {
      console.log('📋 Existing session found. Cart items:', session.context.cart.length);
      console.log('⏳ Awaiting confirmation:', session.context.awaitingConfirmation);
    }

    // Add customer message
    await session.addMessage('user', text);

    // Get customer profile
    const customer = await Customer.findOne({ businessId, phone }).lean();
    if (customer) {
      console.log('👤 Customer found:', customer.name, '| Total orders:', customer.totalOrders);
    }

    // Route based on message content and context
    let response;
    let routeType = '';

    try {
      // Simple greeting detection (keep fast with patterns)
      if (GREETING_PATTERNS.test(text.trim())) {
        routeType = 'GREETING';
        console.log('🎯 Route: GREETING (pattern match)');
        response = await this.handleGreeting({ session, customer });
      } else if (session.context.collectingDetails) {
        routeType = 'COLLECTING_DETAILS';
        console.log('🎯 Route: COLLECTING DETAILS -', session.context.detailsStep);
        response = await this.handleDetailsCollection({ session, text, customer });
      } else if (session.context.awaitingConfirmation) {
        // Use AI to interpret intent when awaiting confirmation
        console.log('🤖 Using AI to interpret customer intent...');
        const intent = await this.interpretIntent({ text, cart: session.context.cart });
        console.log('🎯 AI detected intent:', intent.action, '| Confidence:', intent.confidence);

        if (intent.action === 'CONFIRM') {
          routeType = 'CONFIRM';
          console.log('✅ Route: CONFIRM ORDER');
          response = await this.handleConfirm({ session, businessId, customer });
        } else if (intent.action === 'CANCEL') {
          routeType = 'CANCEL';
          console.log('❌ Route: CANCEL ORDER');
          response = await this.handleCancel(session);
        } else if (intent.action === 'MODIFY') {
          routeType = 'MODIFY';
          console.log('✏️ Route: MODIFY ORDER');
          response = await this.handleOrderInput({ session, text, businessId, customer, isModifying: true });
        } else {
          // Default to modification attempt
          routeType = 'MODIFY_FALLBACK';
          console.log('🎯 Route: MODIFY (fallback)');
          response = await this.handleOrderInput({ session, text, businessId, customer, isModifying: true });
        }
      } else {
        routeType = 'ORDER_INPUT';
        console.log('🎯 Route: NEW ORDER INPUT');
        response = await this.handleOrderInput({ session, text, businessId, customer, isModifying: false });
      }
    } catch (err) {
      console.log('❌ ChatBot Error:', err.message);
      logger.error({ err: err.message, phone }, 'ChatBot processing error');
      response = { botMessage: 'Sorry, kuch problem ho gayi. Please try again. 🙏' };
    }

    // Add bot response to session
    await session.addMessage('assistant', response.botMessage);

    console.log('\n' + '█'.repeat(80));
    console.log('🤖 CHATBOT RESPONSE');
    console.log('█'.repeat(80));
    console.log('📝 Route:', routeType);
    console.log('💬 Message:', response.botMessage);
    if (response.session) {
      console.log('🛒 Cart:', response.session.cart.length, 'items');
      console.log('⏳ Awaiting confirmation:', response.session.awaitingConfirmation);
    }
    console.log('█'.repeat(80) + '\n');

    return {
      botMessage: response.botMessage,
      session: session.toObject()
    };
  }

  /**
   * Use AI to interpret customer intent when cart is awaiting confirmation.
   */
  async interpretIntent({ text, cart }) {
    const cartSummary = cart.map(item => `${item.name} ${item.quantity}${item.unit}`).join(', ');

    const prompt = `You are interpreting customer intent in a kirana store chatbot.

CONTEXT:
The customer has items in their cart: ${cartSummary}
They were asked: "Confirm? (Haan/Na)"

CUSTOMER MESSAGE: "${text}"

Determine what the customer wants to do:
- CONFIRM: They want to place the order (words like: yes, haan, ha, haa, ok, okay, confirm, sure, go ahead, perfect, done, proceed, theek hai, bolo, kardo, etc.)
- CANCEL: They want to cancel the order (words like: no, nahi, naa, cancel, not now, later, ruko, mat karo, etc.)
- MODIFY: They want to add/remove items (mentioning products or quantities)

IMPORTANT: Be liberal with confirmation - if there's ANY positive affirmation, classify as CONFIRM.

Return JSON:
{
  "action": "CONFIRM" | "CANCEL" | "MODIFY",
  "confidence": 0.0 to 1.0
}`;

    try {
      const result = await this.callLLM(prompt, { responseFormat: 'json', model: 'flash', thinkingLevel: 'LOW' });
      return result;
    } catch (err) {
      logger.error({ err: err.message }, 'Intent interpretation failed');
      // Default to modify on error
      return { action: 'MODIFY', confidence: 0.5 };
    }
  }

  /**
   * Handle greeting — welcome message.
   */
  async handleGreeting({ session, customer }) {
    const name = customer?.name && customer.name !== 'Unknown' ? customer.name.split(' ')[0] : '';
    const greeting = name
      ? `Namaste ${name} ji! 🙏 Sharma General Store mein aapka swagat hai. Aaj kya mangwana hai?`
      : `Namaste! 🙏 Sharma General Store mein aapka swagat hai. Aaj kya mangwana hai?`;

    return { botMessage: greeting };
  }

  /**
   * Parse order items from customer message using Gemini.
   */
  async handleOrderInput({ session, text, businessId, customer, isModifying }) {
    const catalog = await catalogService.getCatalogPromptString(businessId);
    const parsePrompt = getChatOrderParsePrompt({ catalog });

    const recentMessages = session.messages.slice(-6).map(m => ({
      role: m.role,
      text: m.content
    }));

    const parsed = await this.callLLM(
      `${parsePrompt}\n\nCUSTOMER MESSAGE: "${text}"\nCONVERSATION HISTORY: ${JSON.stringify(recentMessages)}`,
      { responseFormat: 'json', thinkingLevel: 'MEDIUM' }
    );

    // Handle clarification needed
    if (parsed.needsClarification) {
      return { botMessage: parsed.clarificationMessage || 'Thoda clear karein — kitna chahiye? 🤔' };
    }

    // Resolve items to products
    const catalogData = await catalogService.getCatalog(businessId);
    const aliasMap = await catalogService.getAliasMap(businessId);
    const resolvedItems = [];

    for (const item of (parsed.items || [])) {
      // Find product by alias
      const aliasKey = (item.productAlias || '').toLowerCase();
      const aliasEntry = aliasMap[aliasKey];

      if (aliasEntry) {
        const product = catalogData.find(p => p.id === aliasEntry.productId);
        if (product) {
          resolvedItems.push({
            productId: product.id,
            name: item.nameDisplay || product.nameHi || product.nameEn,
            quantity: item.quantity,
            unit: item.unit || product.unit,
            price: product.price
          });
        }
      }
    }

    if (resolvedItems.length === 0) {
      return { botMessage: 'Maaf kijiye, yeh item humari dukaan mein nahi mila. Kya aur kuch chahiye? 😔' };
    }

    // Check availability via Inventory Agent (A2A call)
    const { getAgent } = await import('./index.js');
    const inventoryAgent = getAgent(2);
    const availabilityCheck = await inventoryAgent.checkAvailability({
      businessId,
      items: resolvedItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
    });

    // Handle out-of-stock items
    const unavailableItems = availabilityCheck.items.filter(i => !i.available);
    if (unavailableItems.length > 0) {
      const unavailableNames = unavailableItems.map(i => i.name).join(', ');
      // Filter to only available items
      const availableResolved = resolvedItems.filter(item => {
        const check = availabilityCheck.items.find(a => a.productId === item.productId);
        return check && check.available;
      });

      if (availableResolved.length === 0) {
        return {
          botMessage: `${unavailableNames} abhi available nahi hai 😔. Kuch aur order karenge?`
        };
      }

      session.context.cart = availableResolved;
      session.context.awaitingConfirmation = true;
      await session.save();

      return {
        botMessage: `${unavailableNames} abhi available nahi hai 😔.\n\nBaaki items ka bill:\n${this.generateBillText(availableResolved)}\n\nConfirm? (Haan/Na)`
      };
    }

    // Merge with existing cart if modifying
    if (isModifying && session.context.cart.length > 0) {
      // Append new items to existing cart
      for (const newItem of resolvedItems) {
        const existing = session.context.cart.find(i => i.productId.toString() === newItem.productId);
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          session.context.cart.push(newItem);
        }
      }
    } else {
      session.context.cart = resolvedItems;
    }

    session.context.awaitingConfirmation = true;
    await session.save();

    // Generate bill message
    const billMessage = this.generateBillText(session.context.cart);

    return { botMessage: `📝 Aapka Order:\n${billMessage}\n\nConfirm? (Haan/Na)` };
  }

  /**
   * Generate bill text from cart items.
   */
  generateBillText(cart) {
    const billLines = cart.map(item =>
      `• ${item.name} ${item.quantity}${item.unit} — ${formatCurrency(item.price * item.quantity)}`
    );
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    return `${billLines.join('\n')}\n\n💰 Total: ${formatCurrency(total)}`;
  }

  /**
   * Handle order confirmation — start collecting customer details.
   */
  async handleConfirm({ session, businessId, customer }) {
    if (session.context.cart.length === 0) {
      session.context.awaitingConfirmation = false;
      await session.save();
      return { botMessage: 'Koi item nahi hai abhi. Kya mangwana hai?' };
    }

    // Start collecting details
    session.context.awaitingConfirmation = false;
    session.context.collectingDetails = true;
    session.context.detailsStep = 'name';

    // Pre-fill name if customer exists
    if (customer && customer.name && customer.name !== 'Unknown') {
      session.context.customerName = customer.name;
    }

    await session.save();

    // Ask for name
    if (session.context.customerName) {
      return { botMessage: `Perfect! Aapka naam ${session.context.customerName} hai na? (Haan ya naya naam type karein)` };
    } else {
      return { botMessage: `Perfect! Kripya apna naam bataiye? 📝` };
    }
  }

  /**
   * Handle details collection flow (name -> address -> payment).
   */
  async handleDetailsCollection({ session, text, customer }) {
    const step = session.context.detailsStep;

    if (step === 'name') {
      // Check if confirming existing name
      if (session.context.customerName && CONFIRM_PATTERNS.test(text.trim())) {
        // Name confirmed, move to address
        session.context.detailsStep = 'address';
        await session.save();
        return { botMessage: `Dhanyavaad ${session.context.customerName} ji! 🙏\n\nAb delivery address bataiye? 📍\n(Example: "Shop 5, Main Market, Karol Bagh, Delhi")` };
      } else {
        // Save new name
        session.context.customerName = text.trim();
        session.context.detailsStep = 'address';
        await session.save();
        return { botMessage: `Dhanyavaad ${session.context.customerName} ji! 🙏\n\nAb delivery address bataiye? 📍\n(Example: "Shop 5, Main Market, Karol Bagh, Delhi")` };
      }
    }

    if (step === 'address') {
      // Save address
      session.context.deliveryAddress = text.trim();
      session.context.detailsStep = 'payment';
      await session.save();
      return { botMessage: `Address save ho gaya! 📍\n\nPayment method select karein:\n\n1️⃣ COD (Cash on Delivery)\n2️⃣ Credit (Udhar)\n\n"1" ya "2" type karein ya "COD" / "Credit" likhein` };
    }

    if (step === 'payment') {
      // Parse payment method
      const textLower = text.trim().toLowerCase();
      let paymentMethod = 'cod'; // default

      if (textLower.includes('2') || textLower.includes('credit') || textLower.includes('udhar')) {
        paymentMethod = 'credit';
      }

      session.context.paymentMethod = paymentMethod;
      session.context.collectingDetails = false;
      session.context.detailsStep = null;
      await session.save();

      // Now create the order
      return await this.createFinalOrder({ session, customer });
    }

    return { botMessage: 'Maaf kijiye, samajh nahi aaya. Kripya phir se try karein.' };
  }

  /**
   * Create final order with all collected details.
   */
  async createFinalOrder({ session, customer }) {
    const businessId = session.businessId;
    const { getAgent } = await import('./index.js');
    const orderManager = getAgent(8);

    const cartTotal = session.context.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Transform cart items to order format
    const orderItems = session.context.cart.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity
    }));

    const orderResult = await orderManager.process({
      action: 'create',
      businessId,
      customerPhone: session.customerPhone,
      customerName: session.context.customerName || customer?.name || 'Unknown',
      deliveryAddress: session.context.deliveryAddress,
      items: orderItems,
      subtotal: cartTotal,
      grandTotal: cartTotal,
      paymentMethod: session.context.paymentMethod || 'cod',
      source: 'chatbot'
    });

    // Clear cart and reset all flags
    session.context.cart = [];
    session.context.awaitingConfirmation = false;
    session.context.collectingDetails = false;
    session.context.detailsStep = null;
    session.context.customerName = null;
    session.context.deliveryAddress = null;
    session.context.paymentMethod = null;
    session.context.pendingOrderId = orderResult.data?.order?._id || null;
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    if (orderResult.success) {
      const paymentText = orderResult.data.order.paymentMethod === 'credit' ? '💳 Payment: Udhar (Credit)' : '💵 Payment: COD';
      return {
        botMessage: `✅ Order ${orderResult.data.order.orderId} confirmed!\n\n👤 ${orderResult.data.order.customerName}\n📍 ${orderResult.data.order.deliveryAddress || 'N/A'}\n💰 Total: ${formatCurrency(orderResult.data.order.grandTotal)}\n${paymentText}\n🚚 Delivery: ~30 min\n\nDhanyavaad! 🙏`
      };
    }

    return { botMessage: 'Order create karne mein problem ho gayi. Please try again.' };
  }

  /**
   * Handle order cancellation.
   */
  async handleCancel(session) {
    session.context.cart = [];
    session.context.awaitingConfirmation = false;
    session.status = 'abandoned';
    await session.save();
    return { botMessage: 'Order cancel kar diya. Koi baat nahi! Phir aana. 🙏' };
  }
}

export default ChatBotAgent;
