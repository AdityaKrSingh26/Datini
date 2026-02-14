import { format } from 'date-fns';
import clsx from 'clsx';

const MessageBubble = ({ message, isUser }) => {
  return (
    <div className={clsx('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[75%] rounded-lg px-4 py-2 shadow',
          isUser
            ? 'bg-primary-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={clsx('text-xs mt-1', isUser ? 'text-primary-100' : 'text-gray-500')}>
          {format(new Date(message.timestamp), 'h:mm a')}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
