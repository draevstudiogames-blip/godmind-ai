'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';

export default function GodmindApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSendMessageFromInput = (payload: { content: string; image?: string }) => {
    window.dispatchEvent(new CustomEvent('send-message-event', { detail: payload }));
  };

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#e0f2fe] via-[#fdf2f8] to-[#fae8ff]" id="godmind-main">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
      />
      
      <div className="relative z-10 flex-1 flex flex-col">
        <ChatInterface />
      </div>
      
      <ChatInput onSendMessage={handleSendMessageFromInput} />
    </main>
  );
}
