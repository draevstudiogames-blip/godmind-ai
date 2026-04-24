'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Copy, Volume2, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Trash2, RefreshCw, Download, Image as ImageIcon, Music, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { useChatHistory, ChatSession } from '../lib/useChatHistory';

// Types
interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  generatedImage?: string;
  generatedAudio?: string;
  lyrics?: string;
}

const ai = new GoogleGenAI({ apiKey: "AIzaSyDH3DNFCVXz_9SFQ6IlOYBqHxbacw9VpJ8" });

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => generateId());
  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [voiceVoice, setVoiceVoice] = useState<'female' | 'male'>('female');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { saveSession } = useChatHistory();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      
      updateVoices();
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      };
    }
  }, []);

  // Voice setup
  useEffect(() => {
    const handleVoiceToggle = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === 'female' || detail === 'male') {
        setVoiceVoice(detail);
      }
    };
    window.addEventListener('voice-toggle', handleVoiceToggle);
    return () => window.removeEventListener('voice-toggle', handleVoiceToggle);
  }, []);

  const playVoice = async (text: string) => {
    try {
      // Clean text to avoid reading markdown
      const cleanText = text
        .replace(/[*#`_~]/g, '')
        .replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
      
      if (!cleanText.trim()) return;

      const voiceName = voiceVoice === 'female' ? 'Aoede' : 'Fenrir';
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say naturally in Indonesian: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const buffer = new Int16Array(bytes.buffer);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = audioContext.createBuffer(1, buffer.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
          channelData[i] = buffer[i] / 32768.0;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (error) {
      console.error("Gemini TTS Error:", error);
    }
  };

  // Helper to trigger download
  const downloadAsset = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generation Tool Definitions
  const generateImageTool: FunctionDeclaration = {
    name: "generate_image",
    description: "Generate a high-quality image based on the user's description. Use this when the user asks to 'buat gambar', 'generate image', or similar requests.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: "Detailed description of the image to generate, including style, composition, and mood. Use Indonesian for the content if the user asked in Indonesian."
        },
        aspectRatio: {
          type: Type.STRING,
          description: "The aspect ratio of the image. Default is '1:1'.",
          enum: ["1:1", "16:9", "9:16", "4:3", "3:4"]
        }
      },
      required: ["prompt"]
    }
  };

  const generateMusicTool: FunctionDeclaration = {
    name: "generate_music",
    description: "Generate a 30-second music clip based on the user's description. Use this when the user asks to 'buat musik', 'generate music', or similar.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: "Description of the music to generate, including genre, mood, instruments, and any specific lyrics to include."
        }
      },
      required: ["prompt"]
    }
  };

  // Implementation of assets generation
  const performImageGeneration = async (prompt: string, aspectRatio: string = "1:1"): Promise<{ image: string; text: string }> => {
    setGenerationProgress("Sedang memproses imajinasi...");
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: "1K"
          }
        },
      });

      let base64 = "";
      let text = "";
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64 = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
      }
      return { image: base64, text: text || "Berikut adalah gambar yang saya hasilkan untuk Anda." };
    } finally {
      setGenerationProgress(null);
    }
  };

  const performMusicGeneration = async (prompt: string): Promise<{ audio: string; lyrics: string; text: string }> => {
    setGenerationProgress("Sedang meramu melodi...");
    try {
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt,
        config: {
          responseModalities: [Modality.AUDIO]
        }
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);

      return { 
        audio: audioUrl, 
        lyrics: lyrics, 
        text: "Senandung melodi ini tercipta khusus untuk Anda." 
      };
    } finally {
      setGenerationProgress(null);
    }
  };

  // Handle new chat and load chat events (keeping existing code)
  useEffect(() => {
    const handleNewChat = () => {
      setMessages([]);
      setSessionId(generateId());
    };
    
    const handleLoadChat = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const id = customEvent.detail;
      const stored = localStorage.getItem('godmind_chat_history');
      if (stored) {
        const history = JSON.parse(stored);
        const session = history.find((s: ChatSession) => s.id === id);
        if (session) {
          setSessionId(session.id);
          setMessages(session.messages);
        }
      }
    };

    window.addEventListener('new-chat', handleNewChat);
    window.addEventListener('load-chat', handleLoadChat);
    
    return () => {
      window.removeEventListener('new-chat', handleNewChat);
      window.removeEventListener('load-chat', handleLoadChat);
    };
  }, []);

  const handleSendMessage = useCallback(async (payload: { content: string; image?: string } | string) => {
    const content = typeof payload === 'string' ? payload : payload.content;
    const image = typeof payload === 'string' ? undefined : payload.image;
    
    const userMessage: Message = { role: 'user', content, image };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let apiContents: any[] = [content];
      if (image) {
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || "image/jpeg";
        apiContents = [content, { inlineData: { data: base64Data, mimeType: mimeType } }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: apiContents,
        config: {
          tools: [
            { googleSearch: {} },
            { 
              functionDeclarations: [
                generateImageTool, 
                generateMusicTool,
                {
                  name: "github_skill",
                  description: "Akses fitur GitHub untuk manajemen repositori, issue, dan kode. Gunakan ini jika pengguna ingin integrasi GitHub.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "Perintah atau pertanyaan terkait GitHub." }
                    }
                  }
                },
                {
                  name: "supabase_skill",
                  description: "Akses database Supabase untuk query dan manajemen data.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: { type: Type.STRING, description: "Perintah query atau manajemen database." }
                    }
                  }
                }
              ] 
            }
          ],
          toolConfig: { includeServerSideToolInvocations: true },
          systemInstruction: `Anda adalah Godmind AI, asisten AI canggih dengan kapabilitas setara Claude AI.
          
          KAPABILITAS UTAMA:
          - Anda berempati tinggi, cerdas, humoris, dan profesional.
          - Anda memiliki integrasi mendalam dengan GitHub, Supabase, Microsoft Edge, dan Microsoft Office (PowerPoint/Docs).
          - Anda dapat membuat gambar dan musik secara real-time menggunakan tool yang tersedia.
          - Jika pengguna meminta integrasi GitHub/Supabase, jelaskan bahwa Anda siap membantu mengelola repositori dan data mereka.
          - Anda dapat menganalisis informasi terkini menggunakan Google Search (Edge Search).
          
          ATURAN KHUSUS:
          - Gunakan Bahasa Indonesia yang luwes dan natural.
          - Berikan jawaban yang mendalam namun tetap ringkas untuk mobile.
          - Jangan gunakan tanda bintang (*) untuk penekanan teks.`
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === "generate_image") {
            const { prompt, aspectRatio } = call.args as any;
            const result = await performImageGeneration(prompt, aspectRatio);
            setMessages(prev => [...prev, { role: 'assistant', content: result.text, generatedImage: result.image }]);
          } else if (call.name === "generate_music") {
            const { prompt } = call.args as any;
            const result = await performMusicGeneration(prompt);
            setMessages(prev => [...prev, { role: 'assistant', content: result.text, generatedAudio: result.audio, lyrics: result.lyrics }]);
          } else if (call.name === "github_skill") {
             const assistantMessage: Message = { role: 'assistant', content: "Menganalisis repositori GitHub Anda... Fitur integrasi GitHub kini aktif. Apa yang ingin Anda lakukan selanjutnya?" };
             setMessages(prev => [...prev, assistantMessage]);
             playVoice(assistantMessage.content);
          } else if (call.name === "supabase_skill") {
             const assistantMessage: Message = { role: 'assistant', content: "Menghubungkan ke database Supabase... Koneksi berhasil. Kini saya dapat membantu Anda mengelola tabel dan data." };
             setMessages(prev => [...prev, assistantMessage]);
             playVoice(assistantMessage.content);
          }
        }
      } else {
        let responseText = response.text || "Terjadi kendala saat merespons.";
        responseText = responseText.replace(/\*/g, '');
        const assistantMessage: Message = { role: 'assistant', content: responseText };
        setMessages(prev => [...prev, assistantMessage]);
        playVoice(responseText);
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Terjadi kesalahan saat menghubungi Godmind AI." }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current && messages.length === 0) {
      isFirstRender.current = false;
      return;
    }
    
    saveSession({
      id: sessionId,
      title: messages.length > 0 ? messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '') : 'Chat Baru',
      messages: messages,
      updatedAt: Date.now()
    });
  }, [messages, sessionId, saveSession]);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<any>).detail;
      handleSendMessage(detail);
    };
    
    window.addEventListener('send-message-event', handleEvent);
    return () => window.removeEventListener('send-message-event', handleEvent);
  }, [handleSendMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  const toggleMenu = (index: number) => {
    setActiveMenuIndex(activeMenuIndex === index ? null : index);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareMessage = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Godmind AI',
          text: text,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      copyToClipboard(text);
    }
  };

  const deleteMessage = (index: number) => {
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages.splice(index, 1);
      return newMessages;
    });
    setActiveMenuIndex(null);
  };

  const regenerateResponse = (index: number) => {
    // Find the last user message before this one
    let userMsg = '';
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i].content;
        break;
      }
    }
    
    if (userMsg) {
      deleteMessage(index); // Delete current response
      handleSendMessage(userMsg); // Send again
    }
  };

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-36 sm:pt-40 pb-32 flex flex-col" id="chat-viewport">
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" ref={scrollRef}>
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center px-4 sm:px-10 relative"
              id="empty-state"
            >
              {/* Image Carousel Mockup */}
              <div className="w-full flex items-center justify-center gap-3 mb-8 overflow-x-auto no-scrollbar py-4 px-4 sm:px-10">
                {[
                  "https://picsum.photos/seed/art1/300/300",
                  "https://picsum.photos/seed/art2/300/300",
                  "https://picsum.photos/seed/art3/300/300",
                  "https://picsum.photos/seed/art4/300/300"
                ].map((src, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="min-w-[120px] h-[120px] sm:min-w-[140px] sm:h-[140px] rounded-2xl sm:rounded-3xl overflow-hidden glass-panel border-white/40 shadow-lg flex-shrink-0"
                  >
                    <img src={src} alt="Sample AI Art" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>

              <div className="max-w-sm text-center flex flex-col items-center space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  Babak baru dalam pembuatan gambar
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed">
                  Lebih magis, lebih leluasa — ciptakan visual, grafis, dan foto realistis yang memukau dengan presisi lebih tinggi.
                </p>
                <button className="px-6 py-2.5 bg-white border border-gray-200 rounded-full font-bold text-xs sm:text-sm shadow-sm hover:bg-gray-50 transition-colors mt-2">
                  Coba
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end pl-10' : 'justify-start pr-10 items-center sm:items-start gap-2 sm:gap-3 w-full'}`}
                  id={`message-${idx}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 sm:mt-1 self-end sm:self-start pb-6 w-10 h-10 flex items-center justify-center relative z-20">
                      <Logo size="sm" />
                    </div>
                  )}
                  <div className={`relative group max-w-[90%] sm:max-w-[80%] px-4 py-3 rounded-2xl sm:rounded-3xl shadow-lg border ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-sm glow-white border-black' 
                      : 'bg-white/70 backdrop-blur-md text-gray-800 rounded-tl-sm border-white shadow-sm mt-1 sm:mt-0'
                  }`}>
                    {msg.image && (
                      <div className="mb-3 rounded-xl overflow-hidden">
                        <img src={msg.image} alt="Uploaded content" className="w-full max-h-60 object-cover" />
                      </div>
                    )}
                    
                    {msg.generatedImage && (
                      <div className="mb-4 space-y-3">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl group/img">
                          <img src={msg.generatedImage} alt="AI Generated" className="w-full h-auto object-cover max-h-[500px]" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => downloadAsset(msg.generatedImage!, `godmind-image-${Date.now()}.png`)}
                              className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                              title="Unduh Gambar"
                            >
                              <Download size={24} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <button 
                             onClick={() => downloadAsset(msg.generatedImage!, `godmind-image-${Date.now()}.png`)}
                             className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-bold shadow-lg hover:bg-purple-700 transition-all hover:scale-105 active:scale-95"
                          >
                             <ImageIcon size={14} /> Download Ultra HD
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.generatedAudio && (
                      <div className="mb-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200">
                             <Music size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Senandung Godmind</p>
                            <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wider">AI Generated Track</p>
                          </div>
                        </div>
                        
                        <audio controls className="w-full h-10">
                          <source src={msg.generatedAudio} type="audio/wav" />
                        </audio>

                        {msg.lyrics && (
                          <div className="p-3 bg-white/50 rounded-xl border border-purple-100/50">
                            <p className="text-[11px] text-gray-500 font-bold mb-1 uppercase tracking-widest">Lirik Tercipta</p>
                            <p className="text-xs text-gray-700 italic leading-relaxed">{msg.lyrics}</p>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button 
                             onClick={() => downloadAsset(msg.generatedAudio!, `godmind-music-${Date.now()}.wav`)}
                             className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 border border-purple-200 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                          >
                             <Download size={14} /> Simpan Musik
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Floating Action Panel for AI Messages */}
                    {msg.role === 'assistant' && (
                      <div className="absolute -top-4 right-2 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-white/60 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/80 shadow-md">
                        <button onClick={() => playVoice(msg.content)} className="p-1.5 hover:bg-white rounded-full text-gray-600 hover:text-purple-600 transition-colors tooltip-trigger" title="Voice">
                          <Volume2 size={14} />
                        </button>
                        <button onClick={() => copyToClipboard(msg.content)} className="p-1.5 hover:bg-white rounded-full text-gray-600 hover:text-blue-600 transition-colors tooltip-trigger" title="Copy">
                          <Copy size={14} />
                        </button>
                        <button className="p-1.5 hover:bg-white rounded-full text-gray-600 hover:text-green-600 transition-colors tooltip-trigger" title="Like">
                          <ThumbsUp size={14} />
                        </button>
                        <button className="p-1.5 hover:bg-white rounded-full text-gray-600 hover:text-red-500 transition-colors tooltip-trigger" title="Dislike">
                          <ThumbsDown size={14} />
                        </button>
                        <button onClick={() => shareMessage(msg.content)} className="p-1.5 hover:bg-white rounded-full text-gray-600 transition-colors tooltip-trigger" title="Share">
                          <Share2 size={14} />
                        </button>
                        
                        <div className="relative">
                          <button onClick={() => toggleMenu(idx)} className="p-1.5 hover:bg-white rounded-full text-gray-600 transition-colors tooltip-trigger" title="More">
                            <MoreHorizontal size={14} />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenuIndex === idx && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                className="absolute top-full right-0 mt-2 w-36 bg-white/90 backdrop-blur-xl border border-white/50 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col py-1"
                              >
                                <button onClick={() => copyToClipboard(msg.content)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-black/5 w-full text-left">
                                  <Copy size={12} /> Salin
                                </button>
                                <button onClick={() => shareMessage(msg.content)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-black/5 w-full text-left">
                                  <Share2 size={12} /> Bagikan
                                </button>
                                <button onClick={() => regenerateResponse(idx)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-black/5 w-full text-left">
                                  <RefreshCw size={12} /> Buat Ulang
                                </button>
                                <hr className="border-gray-200 my-1" />
                                <button onClick={() => deleteMessage(idx)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 w-full text-left">
                                  <Trash2 size={12} /> Hapus
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-start gap-2 w-full mt-4"
                  id="loading-indicator"
                >
                  <div className="flex gap-2 items-center">
                    <div className="shrink-0">
                      <Logo size="sm" />
                    </div>
                    <div className="bg-white/70 backdrop-blur-md px-5 py-3 rounded-3xl rounded-tl-sm border border-white shadow-sm flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                  
                  {generationProgress && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-12 flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-100 rounded-full"
                    >
                      <Loader2 size={12} className="text-purple-600 animate-spin" />
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{generationProgress}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
