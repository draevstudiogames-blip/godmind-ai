'use client';

import { useState, useRef } from 'react';
import { Plus, Mic, X, Camera as CameraIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ToolMenu from './ToolMenu';

interface ChatInputProps {
  onSendMessage: (msg: { content: string; image?: string }) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // First set preview local base64 quickly
      const reader = new FileReader();
      reader.onloadend = () => {
        setIsMenuOpen(false);
      };
      reader.readAsDataURL(file);

      // Now do the real backend upload
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        if (data.success) {
          setSelectedImage(data.url);
        } else {
          // fallback to base64 if upload fails
          setSelectedImage(reader.result as string);
        }
      } catch (err) {
        console.error(err);
        setSelectedImage(reader.result as string);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung Web Speech API.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera. Pastikan izin telah diberikan.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setSelectedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
      return;
    }
    
    if (message.trim() || selectedImage) {
      onSendMessage({ content: message, image: selectedImage || undefined });
      setMessage('');
      setSelectedImage(null);
      setIsMenuOpen(false);
    } else {
      startRecording();
    }
  };

  const handleToolMenuClick = (action: string) => {
    if (action === 'upload-image') {
      fileInputRef.current?.click();
    } else if (action === 'open-camera') {
      startCamera();
    } else if (action.startsWith('skill-')) {
      const skill = action.replace('skill-', '');
      setMessage(`Aktifkan fitur ${skill} dan jelaskan apa yang bisa saya lakukan.`);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-40 flex items-center justify-center" id="chat-input-container">
      <div className="w-full max-w-2xl relative">
        <ToolMenu isOpen={isMenuOpen} onItemClick={handleToolMenuClick} />
        
        <AnimatePresence>
          {isCameraOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-full mb-3 left-0 right-0 glass-panel rounded-3xl border-white/60 shadow-2xl flex flex-col items-center bg-white/90 overflow-hidden"
            >
              <div className="relative w-full aspect-square sm:aspect-video bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-4 p-4">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 text-gray-800 hover:scale-105 active:scale-95 transition-all"
                >
                  <CameraIcon size={28} />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg text-white hover:bg-red-600 active:scale-95 transition-all"
                >
                  <X size={28} />
                </button>
              </div>
            </motion.div>
          )}

          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-3 left-4 p-2 bg-white/80 glass-panel rounded-2xl border-white/60 shadow-lg"
            >
              <div className="relative" suppressHydrationWarning>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form 
          onSubmit={handleSubmit}
          className="glass-panel rounded-[28px] flex items-center px-1.5 sm:px-2 py-1.5 border-white/80 shadow-xl bg-white/60"
          id="chat-form"
        >
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isMenuOpen ? 'bg-purple-100 text-purple-600 rotate-45' : 'text-gray-500 hover:bg-white/40'}`}
            id="toggle-menu-btn"
          >
            <Plus size={24} />
          </button>
          
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            disabled={isUploading}
            placeholder={isUploading ? "Mempersiapkan gambar..." : "Tanya Godmind AI"}
            className="flex-1 bg-transparent border-none outline-none px-2 sm:px-4 text-sm sm:text-base font-medium text-gray-800 placeholder-gray-400 max-h-[120px] resize-none py-2.5 sm:py-3 scrollbar-thin"
            rows={1}
            id="chat-input-field"
            style={{ height: '44px', overflowY: 'auto' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          
          <div className="flex items-center gap-0.5 sm:gap-1 pr-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-colors ${
                isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-gray-500 hover:bg-white/40 hover:text-black'
              }`}
              id="btn-voice-send"
            >
              {message.trim() || selectedImage ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              ) : (
                <Mic size={22} className={isRecording ? "animate-bounce" : ""} />
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
