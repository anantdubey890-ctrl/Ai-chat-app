import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MessageBubble: React.FC<{ 
  message: Message; 
  isMe: boolean 
}> = ({ 
  message, 
  isMe 
}) => {
  return (
    <div className={cn(
      "flex w-full mb-1",
      isMe ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] md:max-w-[65%] px-2 py-1.5 rounded-lg relative shadow-sm",
        isMe ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
      )}>
        <p className="text-[14.2px] leading-tight pr-12">
          {message.text}
        </p>
        <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
          <span className="text-[10px] text-[#8696a0] opacity-70">
            {format(message.timestamp, 'HH:mm')}
          </span>
          {isMe && (
            <div className="text-[#53bdeb]">
              {message.status === 'seen' ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
