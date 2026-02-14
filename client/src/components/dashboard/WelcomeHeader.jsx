import { format } from 'date-fns';
import { Sun, Moon } from 'lucide-react';

const WelcomeHeader = ({ ownerName, storeName }) => {
  const currentTime = format(new Date(), 'h:mm a, EEEE');
  const hour = new Date().getHours();
  const isEvening = hour >= 18 || hour < 6;

  return (
    <div className="mb-10 relative">
      <div className="flex items-start gap-4 mb-2">
        <div className={`p-3 border-3 border-dark-500 shadow-brutal-sm ${isEvening ? 'bg-primary-500' : 'bg-accent-500'}`}>
          {isEvening ? (
            <Moon size={28} className="text-white" strokeWidth={2.5} fill="currentColor" />
          ) : (
            <Sun size={28} className="text-dark-500" strokeWidth={2.5} fill="currentColor" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-3xl md:text-5xl font-display text-dark-500 leading-none mb-2 animate-slide-up-bold">
            NAMASTE,<br />{ownerName.toUpperCase()}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="px-3 py-1 bg-white border-2 border-dark-500 font-mono text-xs font-bold text-dark-500 shadow-brutal-sm">
              {storeName}
            </span>
            <span className="font-mono text-xs text-dark-400 font-semibold tracking-wider">
              {currentTime.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3 left-0 right-0 h-1 bg-accent-500 border-y-2 border-dark-500"></div>
    </div>
  );
};

export default WelcomeHeader;
