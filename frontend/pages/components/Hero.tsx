import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import config from '../index.json';
import InpersonaButton from './InpersonaButton';

export default function Hero() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Pre-calculate stable animation parameters to prevent re-renders affecting animations
  const animationParams = useMemo(() => {
    const params = [];
    for (let i = 0; i < 8; i++) {
      params.push({
        startX: -100 + Math.random() * 200,
        midX: 1200 - 100 + Math.random() * 100,
        endX: -100 + Math.random() * 200,
        startY: -100 + Math.random() * 200,
        midY: 800 - 100 + Math.random() * 100,
        endY: -100 + Math.random() * 200,
        left: 5 + i * 12,
        top: 5 + i * 8,
      });
    }
    return params;
  }, []);

  const particleParams = useMemo(() => {
    const params = [];
    for (let i = 0; i < 12; i++) {
      params.push({
        x1: Math.random() * 1200,
        x2: Math.random() * 1200,
        x3: Math.random() * 1200,
        y1: Math.random() * 800,
        y2: Math.random() * 800,
        y3: Math.random() * 800,
      });
    }
    return params;
  }, []);

  useEffect(() => {
    setIsMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      checkMobile();
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-4 sm:px-6 touch-pan-y">
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

      {/* Sophisticated animated background */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
          {/* Floating orbs with complex animations */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-48 h-48 rounded-full blur-2xl ${
                i % 4 === 0 
                  ? 'bg-gradient-to-br from-purple-500/40 to-fuchsia-500/40 dark:from-purple-500/60 dark:to-fuchsia-500/60' 
                  : i % 4 === 1 
                  ? 'bg-gradient-to-br from-blue-500/40 to-cyan-500/40 dark:from-blue-500/60 dark:to-cyan-500/60'
                  : i % 4 === 2
                  ? 'bg-gradient-to-br from-pink-500/40 to-rose-500/40 dark:from-pink-500/60 dark:to-rose-500/60'
                  : 'bg-gradient-to-br from-indigo-500/40 to-purple-500/40 dark:from-indigo-500/60 dark:to-purple-500/60'
              }`}
              animate={
                isMobile 
                  ? {
                      // Simplified animation for mobile to prevent scroll interference
                      scale: [0.8, 1.5, 1.2, 0.8],
                      opacity: [0.3, 0.6, 0.4, 0.3],
                      rotate: [0, 180, 360]
                    }
                  : {
                      x: [
                        animationParams[i].startX,
                        animationParams[i].midX,
                        animationParams[i].endX
                      ],
                      y: [
                        animationParams[i].startY,
                        animationParams[i].midY,
                        animationParams[i].endY
                      ],
                      scale: [0.8, 2, 1.2, 0.8],
                      opacity: [0.4, 0.8, 0.6, 0.4]
                    }
              }
              transition={{
                duration: 12 + i * 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 1.5
              }}
              style={{
                left: `${animationParams[i].left}%`,
                top: `${animationParams[i].top}%`,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
            />
          ))}
          
          {/* Dynamic mesh gradient overlay */}
          <motion.div 
            className="absolute inset-0 opacity-50 dark:opacity-70"
            animate={{
              background: [
                'radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.25) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
                'radial-gradient(circle at 60% 20%, rgba(147, 51, 234, 0.25) 0%, transparent 60%), radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
                'radial-gradient(circle at 80% 60%, rgba(236, 72, 153, 0.25) 0%, transparent 60%), radial-gradient(circle at 20% 40%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
                'radial-gradient(circle at 30% 80%, rgba(147, 51, 234, 0.25) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(236, 72, 153, 0.25) 0%, transparent 60%)',
                'radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.25) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)'
              ]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              willChange: 'background',
              transform: 'translateZ(0)'
            }}
          />
          
          {/* Animated particles */}
          {!isMobile && [...Array(12)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-purple-400/60 dark:bg-white/80 rounded-full shadow-lg"
              animate={{
                x: [
                  particleParams[i].x1,
                  particleParams[i].x2,
                  particleParams[i].x3
                ],
                y: [
                  particleParams[i].y1,
                  particleParams[i].y2,
                  particleParams[i].y3
                ],
                opacity: [0, 1, 0.5, 0],
                scale: [0, 1, 0.5, 0]
              }}
              transition={{
                duration: 8 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8
              }}
              style={{
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
            />
          ))}
          
          {/* Morphing light beams */}
          <motion.div
            className="absolute inset-0 opacity-20 dark:opacity-40"
            animate={{
              background: [
                'linear-gradient(45deg, transparent 20%, rgba(147, 51, 234, 0.15) 50%, transparent 80%)',
                'linear-gradient(135deg, transparent 20%, rgba(59, 130, 246, 0.15) 50%, transparent 80%)',
                'linear-gradient(225deg, transparent 20%, rgba(236, 72, 153, 0.15) 50%, transparent 80%)',
                'linear-gradient(315deg, transparent 20%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)',
                'linear-gradient(45deg, transparent 20%, rgba(147, 51, 234, 0.15) 50%, transparent 80%)'
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              willChange: 'background',
              transform: 'translateZ(0)'
            }}
          />
          
          {/* Pulsing rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full border border-purple-400/40 dark:border-purple-400/30"
              style={{
                width: '200px',
                height: '200px',
                left: '50%',
                top: '50%',
                marginLeft: '-100px',
                marginTop: '-100px',
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
              }}
              animate={{
                scale: [1, 3, 1],
                opacity: [0.6, 0, 0.6],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 2
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}