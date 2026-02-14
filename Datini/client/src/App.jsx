import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { ROUTES } from './utils/constants';
import VoiceButton from './components/voice/VoiceButton';

import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Insights from './pages/Insights';
import ChatBot from './pages/ChatBot';
import Demo from './pages/Demo';

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <ToastProvider>
          <Routes>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.ORDERS} element={<Orders />} />
            <Route path={ROUTES.INVENTORY} element={<Inventory />} />
            <Route path={ROUTES.CUSTOMERS} element={<Customers />} />
            <Route path={ROUTES.INSIGHTS} element={<Insights />} />
            <Route path={ROUTES.CHATBOT} element={<ChatBot />} />
            <Route path={ROUTES.DEMO} element={<Demo />} />
          </Routes>
          <VoiceButton />
        </ToastProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
