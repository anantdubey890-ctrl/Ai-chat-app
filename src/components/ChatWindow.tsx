import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { generateChatSuggestions } from '../lib/gemini';
import { ArrowLeft, MoreVertical, Search, Smile, Paperclip, Mic, Send, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { AISuggestion } from '../types';

export default function ChatWindow({ onBack }: { onBack: () => void }) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, chat, sendMessage, toggleAutoReply } = useChat(chatId || null);
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAutoReplyRef = useRef<string | null>(null);

  const isAutoReplyOn = user && chat?.autoReplyEnabled?.[user.id];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-reply logic
  useEffect(() => {
    const handleAutoReply = async () => {
      if (!user || !chatId || !isAutoReplyOn || messages.length === 0) return;
      
      const lastMsg = messages[messages.length - 1];
      // Only reply if the last message is from the other user and we haven't replied to it yet
      if (lastMsg.senderId !== user.id && lastAutoReplyRef.current !== lastMsg.id) {
        lastAutoReplyRef.current = lastMsg.id;
        
        setIsGenerating(true);
        try {
          const otherUser = { id: lastMsg.senderId, name: 'Friend' };
          const result = await generateChatSuggestions(messages, user, otherUser as any, user.personalityMode);
          if (result && result.length > 0) {
            // Send the best suggestion automatically
            await sendMessage(user.id, lastMsg.senderId, result[0].text);
          }
        } catch (error) {
          console.error("Auto-reply error:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    handleAutoReply();
  }, [messages, isAutoReplyOn, user, chatId]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || !user || !chatId) return;
    
    const lastMsg = messages[messages.length - 1];
    const receiverId = lastMsg?.senderId !== user.id ? lastMsg?.senderId : lastMsg?.receiverId || 'other-user-id';
    
    await sendMessage(user.id, receiverId, text);
    setInputText('');
    setSuggestions([]);
  };

  const handleGenerateSuggestions = async () => {
    if (!user || messages.length === 0) return;
    setIsGenerating(true);
    try {
      const lastMsg = messages[messages.length - 1];
      const otherUser = { id: lastMsg?.senderId || 'other', name: 'Friend' };
      const result = await generateChatSuggestions(messages, user, otherUser as any, user.personalityMode);
      setSuggestions(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b141a] relative">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-[#202c33] z-10">
        <div className="flex items-center gap-3">
          <ArrowLeft className="w-6 h-6 text-[#aebac1] cursor-pointer md:hidden" onClick={onBack} />
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId}`} 
            alt="Chat" 
            className="w-10 h-10 rounded-full"
          />
          <div className="flex flex-col">
            <h3 className="text-[#e9edef] font-medium leading-tight">Chat with {chatId?.slice(0, 5)}</h3>
            <span className="text-xs text-[#8696a0]">online</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[#aebac1]">
          <div 
            onClick={() => user && toggleAutoReply(user.id, !isAutoReplyOn)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all border ${isAutoReplyOn ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]' : 'bg-[#2a3942] border-transparent text-[#8696a0]'}`}
          >
            <Sparkles className={`w-4 h-4 ${isAutoReplyOn ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-wider">Auto</span>
          </div>
          <Search className="w-5 h-5 cursor-pointer" />
          <MoreVertical className="w-5 h-5 cursor-pointer" />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isMe={msg.senderId === user?.id} 
            />
          ))
        )}
      </div>

      {/* AI Suggestions Bar */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 bg-[#111b21] border-t border-[#222d34] flex gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s.text)}
              className="whitespace-nowrap px-4 py-1.5 bg-[#202c33] text-[#00a884] rounded-full text-sm border border-[#00a884]/30 hover:bg-[#00a884]/10 transition-colors"
            >
              {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 bg-[#202c33] flex items-center gap-3">
        <div className="flex items-center gap-4 text-[#8696a0]">
          <Smile className="w-6 h-6 cursor-pointer" />
          <Paperclip className="w-6 h-6 cursor-pointer" />
        </div>
        
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message" 
            className="w-full bg-[#2a3942] text-[#e9edef] rounded-lg px-4 py-2.5 outline-none text-sm placeholder:text-[#8696a0]"
          />
          <button 
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isGenerating ? 'text-[#00a884] animate-pulse' : 'text-[#8696a0] hover:text-[#00a884]'}`}
            title="AI Reply Suggestion"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={() => handleSend()}
          className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center text-white hover:bg-[#008f6f] transition-colors"
        >
          {inputText.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
