import { Bell, Menu, Zap } from 'lucide-react';

const TopBar = ({ title = 'Datini', notificationCount = 0 }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b-4 border-dark-500">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 hover:bg-accent-500 transition-colors border-2 border-dark-500">
            <Menu size={22} className="text-dark-500" strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-500 border-3 border-dark-500 flex items-center justify-center shadow-brutal-sm relative overflow-hidden">
              <Zap size={24} className="text-dark-500 relative z-10" strokeWidth={3} fill="currentColor" />
              <div className="absolute inset-0 bg-gradient-to-br from-accent-400 to-accent-600 opacity-50"></div>
            </div>
            <div>
              <h1 className="text-2xl font-display text-dark-500 leading-none tracking-tight">
                {title}
              </h1>
              <p className="text-xs text-dark-300 font-mono font-semibold mt-0.5 tracking-wider">AI-POWERED</p>
            </div>
          </div>
        </div>
        <button className="relative p-2.5 hover:bg-accent-500 transition-all border-2 border-dark-500 hover:shadow-brutal-sm active:shadow-none active:translate-x-1 active:translate-y-1">
          <Bell size={20} className="text-dark-500" strokeWidth={2.5} />
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-danger-500 text-white text-xs font-mono font-bold border-2 border-dark-500 w-6 h-6 flex items-center justify-center shadow-brutal-sm">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
