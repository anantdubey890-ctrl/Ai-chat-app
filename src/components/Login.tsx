import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setLoading(true);

    try {
      await login(name, phone);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#111b21] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#202c33] p-8 rounded-2xl shadow-2xl border border-[#222d34]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#00a884] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#00a884]/20">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#e9edef]">Welcome to MimicChat</h1>
          <p className="text-[#8696a0] text-sm mt-1">AI-Powered Personality Messaging</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#00a884] uppercase tracking-wider mb-2">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-[#2a3942] border-none rounded-lg px-4 py-3 text-[#e9edef] outline-none focus:ring-2 focus:ring-[#00a884] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#00a884] uppercase tracking-wider mb-2">Phone Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-[#2a3942] border-none rounded-lg px-4 py-3 text-[#e9edef] outline-none focus:ring-2 focus:ring-[#00a884] transition-all"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#00a884] text-white font-bold py-3 rounded-lg hover:bg-[#008f6f] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Agree & Continue
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-[#8696a0] text-center mt-8 leading-relaxed">
          Read our <span className="text-[#53bdeb] cursor-pointer">Privacy Policy</span>. Tap "Agree & Continue" to accept the <span className="text-[#53bdeb] cursor-pointer">Terms of Service</span>.
        </p>
      </div>
    </div>
  );
}
