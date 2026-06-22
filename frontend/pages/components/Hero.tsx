import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SiGithub, SiLinkedin } from 'react-icons/si';
import config from '../../types/config';
import { asIcon } from '../../types/icons';
import InpersonaButton from './InpersonaButton';
import DitherCanvas from '../../components/animations/DitherCanvas';

const GithubIcon = asIcon(SiGithub);
const LinkedinIcon = asIcon(SiLinkedin);

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Hero() {
  const { hero, footer } = config;

  return (
    <div className="relative flex min-h-[70svh] md:min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* Ambient pixel cloud — a drifting smoke field rendered as monochrome
          ordered-dither pixels. Alpha-based, so it blends over the Layout page
          gradient with no seam. Freezes to a single frame under Reduce Motion. */}
      <DitherCanvas className="pointer-events-none" palette="aurora" />

      {/* Readability scrim — darkens the LEFT column so the left-aligned headline
          and CTAs keep full contrast while the cloud builds toward the right. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:linear-gradient(to_right,rgba(250,250,250,0.94)_0%,rgba(250,250,250,0.72)_32%,transparent_62%)] dark:[background:linear-gradient(to_right,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.7)_32%,transparent_62%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 sm:px-8">
        <div className="max-w-xl text-left">
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mb-5 font-mono text-xs sm:text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400"
        >
          {hero.role}
        </motion.p>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight text-transparent"
        >
          {hero.name}
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-10 max-w-md text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-start gap-3 sm:gap-4"
        >
          <InpersonaButton className="touch-manipulation" />

          <a
            href="#experience"
            className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-700 px-5 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-900 dark:hover:border-gray-400 dark:hover:text-white"
          >
            {hero.secondaryCtaLabel}
          </a>

          <div className="flex items-center gap-1">
            <a
              href={footer.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-2.5 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
            <a
              href={footer.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="p-2.5 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <LinkedinIcon className="h-5 w-5" />
            </a>
          </div>
        </motion.div>
        </div>
      </div>

      <motion.a
        href="#about"
        aria-label="Scroll to content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 p-2 text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ChevronDown className="h-6 w-6 motion-safe:animate-bounce" />
      </motion.a>
    </div>
  );
}
