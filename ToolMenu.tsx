'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, Paperclip, Palette, Lightbulb, Search, Globe, HelpCircle, LayoutGrid, Github, Database, Layout, Presentation } from 'lucide-react';

interface ToolMenuProps {
  isOpen: boolean;
  onItemClick?: (label: string) => void;
}

const menuItems = [
  { icon: <Camera size={20} />, label: 'Kamera', id: 'camera', action: 'open-camera' },
  { icon: <ImageIcon size={20} />, label: 'Foto', action: 'upload-image' },
  { icon: <Paperclip size={20} />, label: 'File', id: 'file' },
  { icon: <Palette size={20} />, label: 'Buat gambar', id: 'generate-image' },
  { icon: <Search size={20} />, label: 'Riset mendalam', id: 'research' },
  { icon: <Globe size={20} />, label: 'Pencarian web', id: 'web-search' },
  { icon: <Github size={20} />, label: 'Integrasi GitHub', id: 'github', action: 'skill-github' },
  { icon: <Database size={20} />, label: 'Supabase DB', id: 'supabase', action: 'skill-supabase' },
  { icon: <Layout size={20} />, label: 'Edge Search', id: 'edge', action: 'skill-edge' },
  { icon: <Presentation size={20} />, label: 'PowerPoint/Docs', id: 'office', action: 'skill-office' },
  { icon: <LayoutGrid size={20} />, label: 'Jelajahi aplikasi', id: 'explore' },
];

export default function ToolMenu({ isOpen, onItemClick }: ToolMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="absolute bottom-20 left-0 w-64 glass-panel rounded-[32px] py-4 px-2 z-40 shadow-2xl border-white/60 max-h-[420px] overflow-y-auto no-scrollbar"
          id="floating-tool-menu"
        >
          <div className="flex flex-col space-y-1">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                onClick={() => onItemClick && onItemClick(item.action || item.label)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 px-3 py-2.5 rounded-2xl hover:bg-black/5 cursor-pointer transition-colors group"
                id={`tool-item-${index}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-gray-700 shadow-sm group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </motion.div>
            ))}
          </div>
          {/* Mock Scrollbar Handle */}
          <div className="absolute right-1 top-10 bottom-10 w-1 bg-gray-200/50 rounded-full" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
