import React from 'react';
import { motion } from 'motion/react';

const Logo = ({ className = "h-12", variant = "light" }) => {
  const isDark = variant === "dark";
  
  // High-end gold gradient colors
  const primaryGold = "#D4AF37";
  const lightGold = "#F4C430";
  const darkBlue = "#002147";
  const textColor = isDark ? "text-white" : "text-[#002147]";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Premium SVG Icon */}
      <motion.div 
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Main Diamond/Shield Shape representing land plot & security */}
          <path 
            d="M24 4L40 12V36L24 44L8 36V12L24 4Z" 
            fill="url(#gold_gradient)" 
            className="transition-all duration-300 group-hover:opacity-90"
          />
          
          {/* Internal stylized 'T' and tracing lines */}
          <path 
            d="M24 12V36M16 18H32M18 30L24 36L30 30" 
            stroke={isDark ? "white" : darkBlue} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="opacity-80"
          />
          
          {/* The 'Trace' element: a digital node */}
          <circle cx="24" cy="36" r="4" fill={isDark ? "white" : darkBlue} />
          <circle cx="24" cy="36" r="6" stroke={isDark ? "white" : darkBlue} strokeOpacity="0.3" />

          {/* Gradients */}
          <defs>
            <linearGradient id="gold_gradient" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor={lightGold} />
              <stop offset="0.5" stopColor={primaryGold} />
              <stop offset="1" stopColor="#B8860B" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
        
        {/* Animated Background Ring */}
        <motion.div 
          className="absolute -inset-1 border border-[#D4AF37]/20 rounded-xl -z-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Typography */}
      <div className="flex flex-col">
        <h1 className={`text-2xl font-bold tracking-tight leading-none ${textColor}`} style={{ fontFamily: 'var(--font-display, sans-serif)' }}>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-white font-black" style={{ display: isDark ? 'inline' : 'none' }}>Terra</span>
          <span className="" style={{ display: isDark ? 'none' : 'inline' }}>Terra</span>
          <span className="text-[#D4AF37]">Trace</span>
        </h1>
        <p className={`text-[9px] uppercase tracking-[0.3em] font-semibold opacity-60 ${textColor}`}>
          Trust in Land
        </p>
      </div>
    </div>
  );
};

export default Logo;
