import { io } from "socket.io-client";
import { User, Chat, Message } from "../types";

const API_URL = ""; // Relative to host

export const socket = io(window.location.origin);

export const api = {
  login: async (user: User) => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    return res.json();
  },
  getChats: async (userId: string): Promise<Chat[]> => {
    const res = await fetch(`${API_URL}/api/chats/${userId}`);
    return res.json();
  },
  getMessages: async (chatId: string): Promise<Message[]> => {
    const res = await fetch(`${API_URL}/api/messages/${chatId}`);
    return res.json();
  },
  createChat: async (participants: string[]): Promise<Chat> => {
    const res = await fetch(`${API_URL}/api/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participants })
    });
    return res.json();
  },
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/api/users`);
    return res.json();
  },
  // This is now handled by sockets in the real app, 
  // but we keep the signature if needed for compatibility
  saveMessage: async (_message: Message) => {
    // In full-stack mode, we use socket.emit('sendMessage')
    return { success: true };
  }
};
