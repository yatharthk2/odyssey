import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bot, ArrowRight } from 'lucide-react';

interface InpersonaButtonProps {
  className?: string;
}

// One idle affordance, not five: the glow pulses for a few cycles to draw the
// eye, then settles. Hover feedback is a spring scale plus the arrow nudge.
const InpersonaButton: React.FC<InpersonaButtonProps> = ({
  className = ''
}) => {
  const [isPulsing, setIsPulsing] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPulsing(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative group ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-400/40 via-gray-500/40 to-gray-400/40 dark:from-white/20 dark:via-gray-300/20 dark:to-white/20 blur-lg"
        initial={{ opacity: 0 }}
        animate={{
          scale: isPulsing ? [0.9, 1.05, 0.9] : 1,
          opacity: isPulsing ? [0.4, 0.7, 0.4] : 0.5
        }}
        transition={{
          duration: 3,
          repeat: isPulsing ? Infinity : 0,
          ease: "easeInOut"
        }}
      />

      <Link href="/loading">
        <motion.button
          className="relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-lg shadow-black/20 dark:shadow-white/20"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          // Add touch events to trigger hover effect on mobile
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setTimeout(() => setIsHovered(false), 150)}
        >
          <div className="flex items-center justify-center bg-white/20 dark:bg-black/10 rounded-full p-1.5">
            <Bot size={16} className="text-white dark:text-gray-900 sm:hidden" />
            <Bot size={18} className="text-white dark:text-gray-900 hidden sm:block" />
          </div>

          <span className="font-medium tracking-wide text-sm sm:text-base">Chat with Inpersona</span>

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
    </div>
  );
};

export default InpersonaButton;
