'use client';

import { motion } from 'motion/react';

export default function Logo({ className = "", size = "md" }: { className?: string, size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  const dim = sizes[size];
  const tSize = textSizes[size];

  // A more detailed and accurate SVG path for a jellyfish head
  return (
    <div className={`relative flex flex-col items-center justify-center ${dim} ${className}`} id="godmind-logo-container">
      {/* Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 logo-gradient-bg rounded-full blur-xl z-0" 
      />
      
      {/* SVG Jellyfish wrapper */}
      <motion.div 
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 100 120" className="w-full h-full absolute inset-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="jellyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d8b4fe" /> {/* purple-300 */}
              <stop offset="50%" stopColor="#e879f9" /> {/* fuchsia-400 */}
              <stop offset="100%" stopColor="#fdf4ff" /> {/* fuchsia-50 */}
            </linearGradient>
            <linearGradient id="tentacleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e879f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d8b4fe" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Main Jellyfish Head / Bell */}
          <path 
            d="M 50 15 C 20 15, 10 45, 15 65 C 18 75, 82 75, 85 65 C 90 45, 80 15, 50 15 Z" 
            fill="url(#jellyGrad)" 
            opacity="0.95"
            stroke="white"
            strokeWidth="1.5"
          />
          
          {/* Scalloped edge (bottom of the bell) */}
          <path 
            d="M 15 65 Q 25 70 32 63 Q 41 68 50 63 Q 59 68 68 63 Q 75 70 85 65" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
          />

          {/* Animated Tentacles */}
          <motion.path 
            d="M 25 65 Q 20 85 30 105" 
            fill="none" 
            stroke="url(#tentacleGrad)" 
            strokeWidth="3" 
            strokeLinecap="round"
            animate={{ d: ["M 25 65 Q 20 85 30 105", "M 25 65 Q 35 85 20 105", "M 25 65 Q 20 85 30 105"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path 
            d="M 40 65 Q 35 90 45 115" 
            fill="none" 
            stroke="url(#tentacleGrad)" 
            strokeWidth="4" 
            strokeLinecap="round"
            animate={{ d: ["M 40 65 Q 35 90 45 115", "M 40 65 Q 50 90 35 115", "M 40 65 Q 35 90 45 115"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.path 
            d="M 60 65 Q 65 90 55 115" 
            fill="none" 
            stroke="url(#tentacleGrad)" 
            strokeWidth="4" 
            strokeLinecap="round"
            animate={{ d: ["M 60 65 Q 65 90 55 115", "M 60 65 Q 50 90 65 115", "M 60 65 Q 65 90 55 115"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
          <motion.path 
            d="M 75 65 Q 80 85 70 105" 
            fill="none" 
            stroke="url(#tentacleGrad)" 
            strokeWidth="3" 
            strokeLinecap="round"
            animate={{ d: ["M 75 65 Q 80 85 70 105", "M 75 65 Q 65 85 80 105", "M 75 65 Q 80 85 70 105"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
        </svg>

        {/* The 'G' Text integrated inside */}
        <span className={`text-white font-extrabold italic ${tSize} absolute top-1/3 left-1/2 -translate-x-1/2 drop-shadow-md`}>G</span>
      </motion.div>
    </div>
  );
}
