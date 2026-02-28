import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  login: (name: string, phone: string) => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('mimic_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (name: string, phone: string) => {
    // Check if user already exists in local storage to keep same ID
    const stored = localStorage.getItem('mimic_user');
    let id = stored ? JSON.parse(stored).id : `user-${Date.now()}`;
    
    const newUser: User = {
      id,
      name,
      phoneNumber: phone,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      status: 'Hey there! I am using MimicChat AI',
      personalityMode: 'friendly',
      autoReplyEnabled: false,
    };
    await api.login(newUser);
    localStorage.setItem('mimic_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = async () => {
    localStorage.removeItem('mimic_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, login, isDemoMode: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
