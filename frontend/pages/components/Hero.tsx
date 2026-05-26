import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useIsMobile from '../../hooks/useIsMobile';
import config from '../../types/config';
import InpersonaButton from './InpersonaButton';

const ORB_COUNT = 5;

interface OrbConfig {
  startX: number;
  midX: number;
  endX: number;
  startY: number;
  midY: number;
  endY: number;
  left: number;
  top: number;
  palette: string;
}

const palettes = [
  'bg-gradient-to-br from-purple-500/40 to-fuchsia-500/40 dark:from-purple-500/60 dark:to-fuchsia-500/60',
  'bg-gradient-to-br from-blue-500/40 to-cyan-500/40 dark:from-blue-500/60 dark:to-cyan-500/60',
  'bg-gradient-to-br from-pink-500/40 to-rose-500/40 dark:from-pink-500/60 dark:to-rose-500/60',
  'bg-gradient-to-br from-indigo-500/40 to-purple-500/40 dark:from-indigo-500/60 dark:to-purple-500/60',
];

export default function Hero() {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Random animation paths are seeded once per mount so re-renders never jitter
  // the orbs. The viewport is sampled at this point so the bounds match the device.
  const orbs = useMemo<OrbConfig[]>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    return Array.from({ length: ORB_COUNT }, (_, i) => ({
      startX: -100 + Math.random() * 200,
      midX: width - 100 + Math.random() * 100,
      endX: -100 + Math.random() * 200,
      startY: -100 + Math.random() * 200,
      midY: height - 100 + Math.random() * 100,
      endY: -100 + Math.random() * 200,
      left: 10 + i * 18,
      top: 10 + i * 14,
      palette: palettes[i % palettes.length],
    }));
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-4 sm:px-6 touch-pan-y">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
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
          className="mx-auto mb-6 sm:mb-8 max-w-2xl px-4 text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300"
        >
          {config.hero.subtitle}
        </motion.p>

        <motion.div
          className="mt-6 sm:mt-8 mb-8 sm:mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, -5, 0] }}
          transition={{
            delay: 0.3,
            y: {
              delay: 0.8,
              duration: 2.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            },
          }}
        >
          <div className="relative mx-auto w-fit">
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-400/20 via-fuchsia-400/20 to-blue-400/20 blur-lg"
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            />
            <InpersonaButton className="touch-manipulation" />
          </div>
        </motion.div>
      </div>

      {isMounted && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        >
          {orbs.map((orb, i) => (
            <motion.div
              key={i}
              className={`absolute w-48 h-48 rounded-full blur-2xl ${orb.palette}`}
              animate={
                isMobile
                  ? {
                      scale: [0.8, 1.4, 1.1, 0.8],
                      opacity: [0.3, 0.6, 0.4, 0.3],
                      rotate: [0, 180, 360],
                    }
                  : {
                      x: [orb.startX, orb.midX, orb.endX],
                      y: [orb.startY, orb.midY, orb.endY],
                      scale: [0.8, 1.8, 1.1, 0.8],
                      opacity: [0.4, 0.7, 0.5, 0.4],
                    }
              }
              transition={{
                duration: 14 + i * 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
                delay: i * 1.5,
              }}
              style={{
                left: `${orb.left}%`,
                top: `${orb.top}%`,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
              }}
            />
          ))}

          <motion.div
            className="absolute inset-0 opacity-50 dark:opacity-70"
            animate={{
              background: [
                'radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.25) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
                'radial-gradient(circle at 80% 60%, rgba(236, 72, 153, 0.25) 0%, transparent 60%), radial-gradient(circle at 20% 40%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
                'radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.25) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
              ],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            style={{ willChange: 'background', transform: 'translateZ(0)' }}
          />
        </div>
      )}
    </div>
  );
}
