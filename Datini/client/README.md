# Datini Frontend

AI-powered Indian kirana (grocery) store management platform - React 18 + Vite frontend.

## Features

### Pages
1. **Dashboard** (`/`) - P&L overview, inventory alerts, pending orders, GST status, credit outstanding
2. **Orders** (`/orders`) - Tab-based order management (Incoming/Active/Completed)
3. **Inventory** (`/inventory`) - Product table with search, filters, and camera scanning
4. **Customers** (`/customers`) - Customer list and credit book management
5. **Insights** (`/insights`) - Charts and business analytics
6. **ChatBot** (`/chatbot`) - WhatsApp-style customer ordering interface
7. **Demo** (`/demo`) - Split-screen real-time sync demonstration

### Key Features
- Real-time order updates (simulated Socket.IO)
- Camera-based shelf scanning (simulated)
- Voice command button (Web Speech API)
- Indian currency formatting (₹1,23,456)
- Mobile-responsive with bottom navigation
- Toast notifications
- Mock data with localStorage persistence

## Tech Stack

- **React 18** (JavaScript)
- **Vite** - Build tool
- **Tailwind CSS 3** - Styling
- **React Router v6** - Routing
- **Recharts** - Charts/graphs
- **Socket.IO Client** - Real-time simulation
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Getting Started

### Installation

```bash
cd client
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── layout/          # Layout components
│   │   ├── voice/           # Voice command button
│   │   ├── dashboard/       # Dashboard-specific
│   │   ├── orders/          # Order management
│   │   ├── inventory/       # Inventory & scanning
│   │   ├── customers/       # Customer management
│   │   ├── insights/        # Charts and analytics
│   │   └── chatbot/         # Chat interface
│   ├── pages/               # Route pages
│   ├── context/             # React context providers
│   ├── services/            # Data and socket services
│   ├── utils/               # Utilities and helpers
│   ├── data/                # Mock data (JSON)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── package.json
└── README.md
```

## Key Concepts

### Data Management
- All data stored in `mockData.json`
- `dataService.js` provides CRUD operations
- localStorage used for persistence
- Reset data: `dataService.resetData()`

### Real-time Simulation
- `socketService.js` simulates Socket.IO events
- Events: new_order, order_status_changed, stock_alert
- Connected via SocketContext

### Responsive Design
- Mobile: < 640px (single column, bottom nav)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3 columns, split-screen)

## Demo Flow

### ChatBot Demo
1. Navigate to `/chatbot`
2. Type: "2 kilo chawal aur do maggi"
3. Bot shows bill card with itemized pricing
4. Click "Haan" to confirm
5. Order created and shown as confirmed
6. Check `/orders` to see new pending order

### Real-time Sync Demo
1. Navigate to `/demo`
2. Dashboard on left, ChatBot on right
3. Place order in ChatBot
4. Watch dashboard update instantly:
   - Pending orders count increases
   - New order appears in pending list
   - P&L sales amount updates
   - Toast notification appears

### Camera Scan Demo
1. Navigate to `/inventory`
2. Click "Scan Shelf"
3. Camera modal opens (simulated feed)
4. Click "Capture & Analyze"
5. AI analyzes shelf (2 sec delay)
6. Results show detected items and discrepancies
7. Click "Update Stock" to sync

## Browser Support

- Chrome (recommended for voice & camera)
- Safari
- Firefox
- Edge

Voice commands require Web Speech API support (Chrome/Safari).

## Color Scheme

- Primary: Orange (#FF6B35) - Trust, warmth
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)

## Order Status Colors

- Pending: Blue
- Accepted: Green
- Preparing: Yellow
- Out for Delivery: Purple
- Delivered: Dark Green
- Cancelled: Red

## Future Enhancements

- Connect to real backend API
- Actual Socket.IO server integration
- Real camera/getUserMedia implementation
- Web Speech API for voice commands
- Authentication
- PWA with offline support
- Push notifications

## Development Notes

- Mock data includes 30 products, 15 orders, 10 customers
- Indian locale formatting throughout
- Hindi text support (Devanagari)
- Touch-friendly UI (44px minimum targets)

## License

MIT
