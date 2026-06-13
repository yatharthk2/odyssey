import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Brain, MessageSquare, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import config from '../../types/config';

const READY_DELAY_MS = 3000;
const FEATURE_BASE_DELAY = 1;
const FEATURE_STEP = 0.3;

const featureIcons: Record<string, LucideIcon> = {
  MessageSquare,
  Brain,
  Sparkles,
  Zap,
};

export default function InpersonaLoading() {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);
  const { loadingTitle, readyButton, features } = config.inpersona;

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), READY_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const progressDelay = FEATURE_BASE_DELAY + features.length * FEATURE_STEP;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4">
      <div className="relative w-full max-w-[600px]">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative p-4 sm:p-8 text-center text-white"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-4 sm:mb-8 text-2xl sm:text-3xl font-bold tracking-tight text-white"
          >
            {loadingTitle}
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = featureIcons[feature.icon] ?? Sparkles;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: FEATURE_BASE_DELAY + index * FEATURE_STEP }}
                  className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm p-3 sm:p-4"
                >
                  <div className="rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 p-1.5 sm:p-2">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm sm:text-base font-semibold">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-300">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="mt-4 sm:mt-8 h-1 overflow-hidden rounded-full bg-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: progressDelay }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-gray-400 via-white to-gray-400"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, delay: progressDelay, ease: 'easeInOut' }}
            />
          </motion.div>

          {showButton && (
            <motion.button
              onClick={() => router.push('/inpersona')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="group relative mt-4 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-gray-900 hover:bg-gray-200 text-sm sm:text-base font-medium shadow-lg"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-gray-900 opacity-20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {readyButton}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
