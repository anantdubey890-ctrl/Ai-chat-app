export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  photoURL?: string;
  status?: string;
  lastSeen?: number;
  isOnline?: boolean;
  personalityMode?: 'friendly' | 'professional' | 'funny' | 'romantic' | 'custom';
  autoReplyEnabled?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  type: 'text' | 'image' | 'voice' | 'emoji';
  mediaUrl?: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'seen';
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  updatedAt: number;
  autoReplyEnabled?: { [userId: string]: boolean };
}

export interface AISuggestion {
  text: string;
  confidence: number;
}
