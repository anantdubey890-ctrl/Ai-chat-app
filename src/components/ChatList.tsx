import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatList } from '../hooks/useChat';
import { Search, MoreVertical, MessageSquare, Settings as SettingsIcon, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../services/api';
import { useState, useEffect } from 'react';
import { User } from '../types';

export default function ChatList({ onSelectChat }: { onSelectChat: () => void }) {
  const { user } = useAuth();
  const { chats, loading } = useChatList(user?.id || null);
  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (showUserList) {
      api.getUsers().then(setAllUsers);
    }
  }, [showUserList]);

  const startChat = async (otherUser: User) => {
    if (!user) return;
    try {
      const newChat = await api.createChat([user.id, otherUser.id]);
      navigate(`/chat/${newChat.id}`);
      setShowUserList(false);
      onSelectChat();
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#111b21]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-[#202c33]">
        <img 
          src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
          alt="Profile" 
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => navigate('/settings')}
        />
        <div className="flex items-center gap-5 text-[#aebac1]">
          <UserPlus className="w-6 h-6 cursor-pointer" onClick={() => setShowUserList(!showUserList)} />
          <MessageSquare className="w-6 h-6 cursor-pointer" />
          <SettingsIcon className="w-6 h-6 cursor-pointer" onClick={() => { navigate('/settings'); onSelectChat(); }} />
          <MoreVertical className="w-6 h-6 cursor-pointer" />
        </div>
      </div>

      {/* User List Overlay */}
      {showUserList && (
        <div className="absolute inset-0 z-50 bg-[#111b21] flex flex-col">
          <div className="px-4 py-5 flex items-center gap-6 bg-[#202c33] text-[#e9edef]">
            <Search className="w-6 h-6 cursor-pointer" onClick={() => setShowUserList(false)} />
            <h2 className="text-xl font-medium">New Chat</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {allUsers.filter(u => u.id !== user?.id).map(u => (
              <div 
                key={u.id}
                onClick={() => startChat(u)}
                className="flex items-center px-4 py-3 hover:bg-[#202c33] cursor-pointer border-b border-[#222d34]"
              >
                <img src={u.photoURL} className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <h3 className="text-[#e9edef] font-medium">{u.name}</h3>
                  <p className="text-sm text-[#8696a0]">{u.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-2">
        <div className="flex items-center gap-4 bg-[#202c33] px-4 py-1.5 rounded-lg">
          <Search className="w-5 h-5 text-[#8696a0]" />
          <input 
            type="text" 
            placeholder="Search or start new chat" 
            className="bg-transparent border-none outline-none text-[#e9edef] text-sm w-full placeholder:text-[#8696a0]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          chats.map((chat) => {
            const otherParticipantId = chat.participants.find(p => p !== user?.id);
            return (
              <div 
                key={chat.id}
                onClick={() => {
                  navigate(`/chat/${chat.id}`);
                  onSelectChat();
                }}
                className="flex items-center px-4 py-3 hover:bg-[#202c33] cursor-pointer border-b border-[#222d34] transition-colors"
              >
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipantId || chat.id}`} 
                  alt="Chat" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[#e9edef] font-medium truncate">
                      {otherParticipantId ? `User ${otherParticipantId.slice(-4)}` : 'Unknown'}
                    </h3>
                    <span className="text-[11px] text-[#8696a0]">
                      {chat.updatedAt ? format(chat.updatedAt, 'HH:mm') : ''}
                    </span>
                  </div>
                  <p className="text-sm text-[#8696a0] truncate">
                    {chat.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
