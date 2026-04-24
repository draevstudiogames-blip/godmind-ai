'use client';

import { useState } from 'react';
import { Menu, User, FolderClosed, Volume2 } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [voiceVoice, setVoiceVoice] = useState<'female' | 'male'>('female');

  const toggleVoice = () => {
    const newVoice = voiceVoice === 'female' ? 'male' : 'female';
    setVoiceVoice(newVoice);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voice-toggle', { detail: newVoice }));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-4 pt-3" id="app-header">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
        {/* Top Tray */}
        <div className="w-full flex items-center justify-between">
          <button 
            onClick={onMenuClick}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors"
            id="hamburger-btn"
          >
            <Menu size={22} className="text-gray-800" />
          </button>
          
          <div className="flex items-center gap-2">
            {/* Voice Toggle */}
            <button 
              onClick={toggleVoice}
              className="px-3 h-8 flex items-center gap-1.5 glass-panel rounded-full hover:bg-white/60 transition-colors shadow-sm text-xs font-semibold text-gray-700"
              title="Toggle Voice"
              id="voice-toggle-btn"
            >
              <Volume2 size={14} className={voiceVoice === 'male' ? 'text-blue-500' : 'text-pink-500'} />
              {voiceVoice === 'female' ? 'Female' : 'Male'}
            </button>

            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors" id="profile-btn">
              <User size={22} className="text-gray-800" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 transition-colors" id="refresh-btn">
              <div className="w-5 h-5 border-2 border-gray-800 border-dashed rounded-full" />
            </button>
          </div>
        </div>
        
        {/* Central Badge */}
        <div className="flex justify-center" id="badge-container">
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 text-gray-500 shadow-sm border-white/60">
            <FolderClosed size={16} className="rotate-12" />
            <span className="text-[13px] font-medium font-jakarta">Personalisasi terbatas</span>
            <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold">i</div>
          </div>
        </div>
      </div>
    </header>
  );
}
