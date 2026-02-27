import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, MessageCircle, Bell, Shield, HelpCircle, LogOut, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../services/api';

export default function Settings({ onBack }: { onBack: () => void }) {
  const { user, logout } = useAuth();
  const [personality, setPersonality] = useState(user?.personalityMode || 'friendly');
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePersonality = async (mode: UserType['personalityMode']) => {
    if (!user || !mode) return;
    setIsUpdating(true);
    try {
      const updatedUser = { ...user, personalityMode: mode };
      await api.login(updatedUser); // Reuse login to update
      localStorage.setItem('mimic_user', JSON.stringify(updatedUser));
      setPersonality(mode);
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const personalityOptions = [
    { id: 'friendly', label: 'Friendly', desc: 'Warm and casual tone' },
    { id: 'professional', label: 'Professional', desc: 'Formal and concise' },
    { id: 'funny', label: 'Funny', desc: 'Witty and humorous' },
    { id: 'romantic', label: 'Romantic', desc: 'Affectionate and sweet' },
    { id: 'custom', label: 'Custom', desc: 'Mimics your exact style' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#111b21]">
      {/* Header */}
      <div className="px-4 py-5 flex items-center gap-6 bg-[#202c33] text-[#e9edef]">
        <ArrowLeft className="w-6 h-6 cursor-pointer" onClick={onBack} />
        <h2 className="text-xl font-medium">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="p-6 flex items-center gap-4 hover:bg-[#202c33] cursor-pointer transition-colors">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
            alt="Profile" 
            className="w-20 h-20 rounded-full"
          />
          <div className="flex-1">
            <h3 className="text-[#e9edef] text-lg">{user?.name}</h3>
            <p className="text-[#8696a0] text-sm truncate">{user?.status}</p>
          </div>
        </div>

        <div className="h-[1px] bg-[#222d34] mx-6 my-2" />

        {/* AI Personality Section */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#00a884]/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#00a884]" />
            </div>
            <div>
              <h4 className="text-[#e9edef] font-medium">AI Personality Mode</h4>
              <p className="text-[#8696a0] text-xs">How the AI should suggest replies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {personalityOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => updatePersonality(opt.id as any)}
                disabled={isUpdating}
                className={`
                  flex flex-col items-start p-4 rounded-xl border transition-all
                  ${personality === opt.id 
                    ? 'bg-[#00a884]/10 border-[#00a884] text-[#00a884]' 
                    : 'bg-[#202c33] border-transparent text-[#e9edef] hover:border-[#8696a0]/30'}
                `}
              >
                <span className="font-semibold">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-[#222d34] mx-6 my-2" />

        {/* Other Settings */}
        <div className="space-y-1">
          <SettingItem icon={<User />} title="Account" subtitle="Privacy, security, change number" />
          <SettingItem icon={<MessageCircle />} title="Chats" subtitle="Theme, wallpapers, chat history" />
          <SettingItem icon={<Bell />} title="Notifications" subtitle="Message, group & call tones" />
          <SettingItem icon={<Shield />} title="Privacy" subtitle="Block contacts, disappearing messages" />
          <SettingItem icon={<HelpCircle />} title="Help" subtitle="Help center, contact us, privacy policy" />
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-6 px-6 py-4 text-[#ea4335] hover:bg-[#202c33] transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <div className="text-left">
              <h4 className="font-medium">Logout</h4>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="flex items-center gap-6 px-6 py-4 hover:bg-[#202c33] cursor-pointer transition-colors">
      <div className="text-[#8696a0]">{icon}</div>
      <div className="flex-1">
        <h4 className="text-[#e9edef] font-medium">{title}</h4>
        <p className="text-[#8696a0] text-sm">{subtitle}</p>
      </div>
    </div>
  );
}
