import { Mic, MicOff } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const VoiceButton = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (isListening) {
      setIsListening(false);
      setTranscript('');
    } else {
      setIsListening(true);
      setTranscript('Listening...');

      setTimeout(() => {
        setTranscript('');
        setIsListening(false);
      }, 3000);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={clsx(
          'fixed bottom-24 right-4 md:bottom-6 p-4 rounded-2xl shadow-strong',
          'transition-all duration-300 z-40 group',
          isListening
            ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse scale-110'
            : 'gradient-primary hover:scale-110'
        )}
      >
        {isListening ? (
          <MicOff size={24} className="text-white" />
        ) : (
          <Mic size={24} className="text-white" />
        )}

        {/* Pulse ring effect */}
        {isListening && (
          <span className="absolute inset-0 rounded-2xl bg-red-400 animate-ping opacity-75" />
        )}
      </button>

      {transcript && (
        <div className="fixed bottom-40 right-4 md:bottom-20 bg-white rounded-2xl shadow-strong p-4 max-w-xs z-40 animate-scale-in border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-xs font-semibold text-gray-600 uppercase">Recording</p>
          </div>
          <p className="text-sm text-gray-800 font-medium">{transcript}</p>
        </div>
      )}
    </>
  );
};

export default VoiceButton;
