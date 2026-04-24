'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderClosed, Image as ImageIcon, MoreHorizontal, Search, User, SquarePen, MoreVertical, Trash2, Copy, Download, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { useChatHistory, ChatSession } from '../lib/useChatHistory';
import JSZip from 'jszip';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { history, deleteSession } = useChatHistory();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
    setActiveMenu(null);
  };

  const downloadFullProject = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch('/api/code?file=full_project');
      const data = await res.json();
      
      if (data.files) {
        const zip = new JSZip();
        data.files.forEach((file: { path: string, content: string }) => {
          zip.file(file.path, file.content);
        });
        
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `godmind_project_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Gagal mengunduh proyek.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden"
            id="sidebar-backdrop"
          />
          
          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-64 sm:w-72 glass-panel z-50 p-5 flex flex-col shadow-2xl border-r border-white/20"
            id="sidebar-panel"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900">Godmind AI</h2>
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-gray-700" id="sidebar-search">
                  <Search size={18} />
                </button>
                <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-gray-700" id="sidebar-user">
                  <User size={18} />
                </button>
                <button 
                  onClick={onClose} 
                  className="p-1.5 hover:bg-black/5 rounded-full lg:hidden"
                  id="close-sidebar-btn"
                >
                  <X size={18} className="text-gray-900" />
                </button>
              </div>
            </div>

            <nav className="space-y-2 mb-6">
              <SidebarItem icon={<FolderClosed size={20} />} label="Proyek" id="menu-proyek" />
              <SidebarItem icon={<ImageIcon size={20} />} label="Gambar" id="menu-gambar" />
              <SidebarItem icon={<MoreHorizontal size={20} />} label="Lainnya" id="menu-lainnya" />
            </nav>

            {/* Chat History Section */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Riwayat Chat</p>
              {history.map((session: ChatSession) => (
                <div 
                  key={session.id} 
                  onClick={() => window.dispatchEvent(new CustomEvent('load-chat', { detail: session.id }))}
                  className="group relative flex items-center gap-3 py-2 px-2 rounded-xl cursor-pointer hover:bg-white/40 transition-colors"
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-gray-800 truncate">{session.title}</p>
                  </div>
                  <button 
                    onClick={(e) => toggleMenu(e, session.id)} 
                    className="p-1 text-gray-400 hover:text-gray-800 rounded-full hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {activeMenu === session.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden"
                      >
                        <button 
                          onClick={(e) => handleDelete(e, session.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <Trash2 size={14} />
                          Hapus
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-sm text-gray-400 px-2 italic">Belum ada riwayat</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-4 flex flex-col gap-3">
              <motion.button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", "godmind_backup.json");
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-gray-700 bg-white/50 border border-gray-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/80 transition-colors"
                id="sidebar-backup"
              >
                <FolderClosed size={16} />
                <span className="font-semibold text-sm">Backup Data</span>
              </motion.button>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <motion.button
                    onClick={async () => {
                      const res = await fetch('/api/code?file=ChatInterface.tsx');
                      const data = await res.json();
                      if (data.content) {
                        navigator.clipboard.writeText(data.content);
                        alert('Kode UI Chat tersalin!');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 text-gray-700 bg-white/50 border border-gray-200 px-2 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-white/80 transition-colors"
                  >
                    <span className="font-semibold text-xs">Salin UI Chat</span>
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      const res = await fetch('/api/code?file=Sidebar.tsx');
                      const data = await res.json();
                      if (data.content) {
                        navigator.clipboard.writeText(data.content);
                        alert('Kode UI Sidebar tersalin!');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 text-gray-700 bg-white/50 border border-gray-200 px-2 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-white/80 transition-colors"
                  >
                    <span className="font-semibold text-xs">Salin UI Sidebar</span>
                  </motion.button>
                </div>
                
                <motion.button
                  onClick={async () => {
                    const res = await fetch('/api/code?file=all');
                    const data = await res.json();
                    if (data.content) {
                      // Format as HTML template
                      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Godmind UI Bundle</title>
    <style>body { font-family: sans-serif; background: #f9fafb; padding: 20px; }</style>
</head>
<body>
    <h1>Godmind AI UI Components Bundle</h1>
    <p>This file contains the core UI source code for reference.</p>
    <pre style="background: #1e293b; color: #f8fafc; padding: 20px; border-radius: 8px; overflow: auto; max-width: 100%;">
${data.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </pre>
</body>
</html>`;
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `godmind_ui_reference_${Date.now()}.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                >
                  <Download size={14} />
                  <span className="font-semibold text-xs text-center">Unduh Kode HTML/UI Fitur</span>
                </motion.button>
                
                <motion.button
                  onClick={downloadFullProject}
                  disabled={isDownloading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-purple-700 bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span className="font-semibold text-xs text-center">Unduh Full Project Structure (ZIP)</span>
                </motion.button>
              </div>
              
              <motion.button
                onClick={() => window.dispatchEvent(new Event('new-chat'))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                id="sidebar-new-chat"
              >
                <SquarePen size={18} className="fill-white/20" />
                <span className="font-bold text-sm">Obrolan Baru</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SidebarItem({ icon, label, id }: { icon: React.ReactNode, label: string, id: string }) {
  return (
    <div 
      id={id}
      className={`group flex items-center gap-3 py-2 cursor-pointer transition-all hover:translate-x-1`}
    >
      <div className={`text-gray-900 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-base font-medium text-gray-900">{label}</span>
    </div>
  );
}
