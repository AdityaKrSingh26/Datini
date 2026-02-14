import { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageBubble from '../components/chatbot/MessageBubble';
import BillCard from '../components/chatbot/BillCard';
import OrderConfirmationCard from '../components/chatbot/OrderConfirmationCard';
import TypingIndicator from '../components/chatbot/TypingIndicator';
import ChatInput from '../components/chatbot/ChatInput';
import dataService from '../services/dataService';
import { useSocket } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../utils/constants';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingBill, setPendingBill] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const messagesEndRef = useRef(null);
  const socket = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, pendingBill, confirmedOrder]);

  useEffect(() => {
    const welcomeMessage = {
      text: 'Namaste! 🙏 Sharma General Store mein aapka swagat hai. Aaj kya mangwana hai?',
      timestamp: new Date().toISOString(),
      isUser: false,
    };
    setMessages([welcomeMessage]);
  }, []);

  const parseOrder = (text) => {
    const products = dataService.getProducts();
    const lowerText = text.toLowerCase();

    const foundItems = [];
    products.forEach((product) => {
      product.aliases.forEach((alias) => {
        if (lowerText.includes(alias.toLowerCase())) {
          const quantityMatch = lowerText.match(new RegExp(`(\\d+\\.?\\d*)\\s*(?:kilo|kg|liter|litre|packet|piece|dozen)?\\s*${alias}`, 'i'));
          const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1;

          const existingItem = foundItems.find((item) => item.productId === product._id);
          if (!existingItem) {
            foundItems.push({
              productId: product._id,
              name: product.nameEn,
              quantity,
              unit: product.unit,
              price: product.pricePerUnit * quantity,
              gstRate: product.gstRate,
            });
          }
        }
      });
    });

    return foundItems;
  };

  const handleSendMessage = (text) => {
    const userMessage = {
      text,
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);
    setTimeout(() => {
      const items = parseOrder(text);

      if (items.length > 0) {
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        const gstTotal = items.reduce((sum, item) => sum + (item.price * item.gstRate) / 100, 0);
        const grandTotal = subtotal + gstTotal;

        setPendingBill({
          items,
          subtotal,
          gstTotal,
          grandTotal,
          timestamp: new Date().toISOString(),
        });
      } else {
        const botMessage = {
          text: 'Maaf kijiye, main samjha nahi. Kripya item ka naam bataiye jaise "2 kilo chawal" ya "maggi".',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages((prev) => [...prev, botMessage]);
      }

      setIsTyping(false);
    }, 1500);
  };

  const handleConfirmOrder = () => {
    if (pendingBill) {
      const newOrder = dataService.createOrder({
        customerPhone: '+919123456789',
        customerName: 'Demo Customer',
        items: pendingBill.items,
        subtotal: pendingBill.subtotal,
        gstTotal: pendingBill.gstTotal,
        grandTotal: pendingBill.grandTotal,
        paymentMethod: 'upi',
        source: 'chatbot',
      });

      setConfirmedOrder(newOrder);
      setPendingBill(null);

      socket.simulateNewOrder(newOrder);

      setTimeout(() => {
        const botMessage = {
          text: 'Kuch aur chahiye?',
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 2000);
    }
  };

  const handleRejectOrder = () => {
    setPendingBill(null);

    const botMessage = {
      text: 'Koi baat nahi. Aap kya mangwana chahte hain?',
      timestamp: new Date().toISOString(),
      isUser: false,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const quickActions = confirmedOrder
    ? []
    : pendingBill
    ? []
    : ['Namaste', '2 kilo chawal', 'Maggi', 'Parle-G'];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-primary-500 text-white px-4 py-3 shadow-md flex items-center gap-3">
        <MessageSquare size={24} />
        <div>
          <h1 className="font-semibold">Sharma Kirana Store</h1>
          <p className="text-xs text-primary-100">WhatsApp Ordering</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} isUser={msg.isUser} />
        ))}

        {isTyping && <TypingIndicator />}

        {pendingBill && (
          <BillCard
            items={pendingBill.items}
            subtotal={pendingBill.subtotal}
            gstTotal={pendingBill.gstTotal}
            grandTotal={pendingBill.grandTotal}
            timestamp={pendingBill.timestamp}
            onConfirm={handleConfirmOrder}
            onReject={handleRejectOrder}
          />
        )}

        {confirmedOrder && (
          <OrderConfirmationCard
            orderId={confirmedOrder.orderId}
            items={confirmedOrder.items}
            grandTotal={confirmedOrder.grandTotal}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSendMessage} quickActions={quickActions} />
    </div>
  );
};

export default ChatBot;
