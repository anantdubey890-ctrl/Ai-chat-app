import { useState, useEffect } from 'react';
import { Message, Chat } from '../types';
import { api, socket } from '../services/api';

export function useChat(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [msgs, chats] = await Promise.all([
          api.getMessages(chatId),
          api.getChats('all') // Simplified for now, or fetch specific chat
        ]);
        setMessages(msgs);
        const currentChat = chats.find(c => c.id === chatId);
        if (currentChat) setChat(currentChat);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    socket.emit('join', chatId);

    const handleNewMessage = (msg: Message) => {
      if (msg.chatId === chatId) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleAutoReplyStatus = (data: { chatId: string, userId: string, enabled: boolean }) => {
      if (data.chatId === chatId) {
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            autoReplyEnabled: {
              ...prev.autoReplyEnabled,
              [data.userId]: data.enabled
            }
          };
        });
      }
    };

    socket.on('message', handleNewMessage);
    socket.on('autoReplyStatus', handleAutoReplyStatus);

    return () => {
      socket.off('message', handleNewMessage);
      socket.off('autoReplyStatus', handleAutoReplyStatus);
    };
  }, [chatId]);

  const toggleAutoReply = async (userId: string, enabled: boolean) => {
    if (!chatId) return;
    socket.emit('toggleAutoReply', { chatId, userId, enabled });
  };

  const sendMessage = async (senderId: string, receiverId: string, text: string, type: Message['type'] = 'text') => {
    if (!chatId) return;
    socket.emit('sendMessage', { chatId, senderId, receiverId, text, type });
  };

  return { messages, loading, chat, sendMessage, toggleAutoReply };
}

export function useChatList(userId: string | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadChats = async () => {
      setLoading(true);
      try {
        const data = await api.getChats(userId);
        setChats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();

    const handleGlobalMessage = (msg: Message) => {
      // Update chat list when a message arrives
      setChats(prev => {
        return prev.map(c => {
          if (c.id === msg.chatId) {
            return { ...c, lastMessage: msg, updatedAt: msg.timestamp };
          }
          return c;
        }).sort((a, b) => b.updatedAt - a.updatedAt);
      });
    };

    socket.on('message', handleGlobalMessage);
    return () => {
      socket.off('message', handleGlobalMessage);
    };
  }, [userId]);

  return { chats, loading };
}
