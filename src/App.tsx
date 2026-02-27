import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import Settings from './components/Settings';
import { useState } from 'react';

function AppContent() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#111b21] text-[#e9edef]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#00a884] rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
              <path d="M12.072 1.761a10.05 10.05 0 00-9.303 5.64 10.13 10.13 0 00.517 10.54L1.93 22.399l4.606-1.491a10.13 10.13 0 004.727 1.176l.003.001.006.001a10.09 10.09 0 006.586-2.422 10.12 10.12 0 003.446-7.574 10.12 10.12 0 00-9.232-9.929z" />
            </svg>
          </div>
          <p className="text-sm font-medium opacity-60">MimicChat AI</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-screen w-screen flex bg-[#111b21] overflow-hidden">
      <div className={`
        ${isSidebarOpen ? 'w-full md:w-[400px]' : 'hidden md:block md:w-[400px]'}
        border-r border-[#222d34] flex-shrink-0
      `}>
        <ChatList onSelectChat={() => setIsSidebarOpen(false)} />
      </div>
      <div className={`
        flex-1 relative
        ${!isSidebarOpen ? 'w-full' : 'hidden md:block'}
      `}>
        <Routes>
          <Route path="/chat/:chatId" element={<ChatWindow onBack={() => setIsSidebarOpen(true)} />} />
          <Route path="/settings" element={<Settings onBack={() => setIsSidebarOpen(true)} />} />
          <Route path="/" element={
            <div className="h-full flex flex-col items-center justify-center text-[#8696a0] bg-[#222d34]/30">
              <div className="w-64 h-64 opacity-20 mb-8">
                 <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.072 1.761a10.05 10.05 0 00-9.303 5.64 10.13 10.13 0 00.517 10.54L1.93 22.399l4.606-1.491a10.13 10.13 0 004.727 1.176l.003.001.006.001a10.09 10.09 0 006.586-2.422 10.12 10.12 0 003.446-7.574 10.12 10.12 0 00-9.232-9.929z" />
                </svg>
              </div>
              <h1 className="text-3xl font-light text-[#e9edef] mb-2">MimicChat AI</h1>
              <p className="text-sm max-w-xs text-center">
                Send and receive messages with AI-powered personality mimicking suggestions.
              </p>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
