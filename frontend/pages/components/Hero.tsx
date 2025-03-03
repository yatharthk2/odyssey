import React from 'react';
import { motion } from 'framer-motion';
import config from '../index.json';
import InpersonaButton from './InpersonaButton';

export default function Hero() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
        >
          {config.hero.name}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4"
        >
          {config.hero.subtitle}
        </motion.p>

        {/* InPersona Button with subtle floating animation - mobile optimized */}
        <motion.div
          className="mt-6 sm:mt-8 mb-8 sm:mb-12"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            y: [0, -5, 0]
          }}
          transition={{ 
            delay: 0.3,
            y: {
              delay: 0.8,
              duration: 2.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }
          }}
        >
          {/* Subtle shimmer effect behind button */}
          <div className="relative mx-auto w-fit">
            <motion.div 
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-400/20 via-fuchsia-400/20 to-blue-400/20 blur-lg opacity-0"
              animate={{
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 1.5
              }}
            />
            <InpersonaButton className="touch-manipulation" />
          </div>
        </motion.div>

        {/* Call to action buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {/* Add your CTA buttons here */}
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-conic from-purple-500/30 to-transparent dark:from-purple-500/10 animate-spin-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-conic from-blue-500/30 to-transparent dark:from-blue-500/10 animate-spin-slow" />
      </div>
    </div>
  );
}