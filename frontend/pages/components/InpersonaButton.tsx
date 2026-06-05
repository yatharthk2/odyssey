import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';

interface InpersonaButtonProps {
  className?: string;
}

const InpersonaButton: React.FC<InpersonaButtonProps> = ({ 
  className = ''
}) => {
  const [isPulsing, setIsPulsing] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // Stop continuous pulsing after a few iterations to avoid distraction
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPulsing(false);
    }, 12000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative group ${className}`}>
      {/* Outer glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-400/40 via-gray-500/40 to-gray-400/40 dark:from-white/20 dark:via-gray-300/20 dark:to-white/20 blur-lg opacity-75"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: isPulsing ? [0.8, 1.1, 0.9] : 1,
          opacity: isPulsing ? [0.5, 0.8, 0.5] : 0.7
        }}
        transition={{
          duration: 3,
          repeat: isPulsing ? Infinity : 0,
          ease: "easeInOut"
        }}
      />

      <Link href="/loading">
        <motion.button
          className="relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl shadow-black/20 dark:shadow-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          // Add touch events to trigger hover effect on mobile
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setTimeout(() => setIsHovered(false), 150)}
        >
          {/* Animated icon container */}
          <motion.div
            className="relative flex items-center justify-center bg-white/20 dark:bg-black/10 rounded-full p-1.5"
            animate={{ 
              rotate: isPulsing ? [0, 15, -15, 0] : 0,
            }}
            transition={{
              duration: 4,
              repeat: isPulsing ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <Bot size={16} className="text-white dark:text-gray-900 sm:hidden" />
            <Bot size={18} className="text-white dark:text-gray-900 hidden sm:block" />
            
            {/* Sparkle icon */}
            <motion.div 
              className="absolute -top-1 -right-1"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut"
              }}
            >
              <Sparkles size={8} className="text-white dark:text-gray-900 sm:hidden" />
              <Sparkles size={10} className="text-white dark:text-gray-900 hidden sm:block" />
            </motion.div>
          </motion.div>
          
          <span className="font-medium tracking-wide text-sm sm:text-base">Chat with InPersona</span>
          
          {/* Animated arrow */}
          <motion.div
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="ml-auto"
          >
            <ArrowRight size={14} className="text-white/80 dark:text-gray-900/80 sm:hidden" />
            <ArrowRight size={16} className="text-white/80 dark:text-gray-900/80 hidden sm:block" />
          </motion.div>
        </motion.button>
      </Link>

      {/* Interactive particle effects on hover/touch */}
      {isHovered && (
        <>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
              initial={{ 
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                x: Math.random() * 40 - 20,
                y: Math.random() * 40 - 20,
              }}
              transition={{ 
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default InpersonaButton;
