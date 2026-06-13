import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SiGithub, SiLinkedin } from 'react-icons/si';
import config from '../../types/config';
import { asIcon } from '../../types/icons';
import InpersonaButton from './InpersonaButton';

const GithubIcon = asIcon(SiGithub);
const LinkedinIcon = asIcon(SiLinkedin);

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Ambient drift layer. Paths are fixed constants (SSR-safe, no per-render
// re-roll) and animate transform/opacity only, so the loops stay on the
// compositor. The orbs are radial gradients rather than blurred discs — the
// falloff is baked into the fill, so they read as defined glowing shapes
// (no filter layer needed) and the motion is clearly visible.
const ORBS = [
  {
    className:
      'hero-orb left-[6%] top-[10%] h-96 w-96 [background:radial-gradient(circle,rgba(82,82,82,0.45)_0%,transparent_65%)] dark:[background:radial-gradient(circle,rgba(255,255,255,0.30)_0%,transparent_65%)]',
    x: [0, 220, -140, 0],
    y: [0, -130, 100, 0],
    duration: 6,
  },
  {
    className:
      'hero-orb right-[4%] top-[20%] h-[28rem] w-[28rem] [background:radial-gradient(circle,rgba(64,64,64,0.40)_0%,transparent_65%)] dark:[background:radial-gradient(circle,rgba(229,229,229,0.24)_0%,transparent_65%)]',
    x: [0, -240, 150, 0],
    y: [0, 150, -160, 0],
    duration: 8,
  },
  {
    className:
      'hero-orb left-[28%] bottom-[2%] h-[26rem] w-[26rem] [background:radial-gradient(circle,rgba(115,115,115,0.50)_0%,transparent_65%)] dark:[background:radial-gradient(circle,rgba(255,255,255,0.20)_0%,transparent_65%)]',
    x: [0, 180, -120, 0],
    y: [0, -110, 130, 0],
    duration: 7,
  },
];

export default function Hero() {
  const { hero, footer } = config;
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[70svh] md:min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* No backdrop of its own — the hero sits on the Layout page gradient so
          there is no seam where the section ends. Texture + orbs only. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 dark:opacity-40 [background:radial-gradient(circle_at_25%_20%,rgba(120,120,120,0.14)_0%,transparent_55%),radial-gradient(circle_at_75%_75%,rgba(150,150,150,0.12)_0%,transparent_55%)]"
      />

      {/* Ambient drift — omitted entirely under OS Reduce Motion. */}
      {!reduceMotion && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {ORBS.map((orb, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${orb.className}`}
              animate={{
                x: orb.x,
                y: orb.y,
                scale: [1, 1.25, 0.9, 1],
                opacity: [0.75, 1, 0.85, 0.75],
              }}
              transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-4xl text-center">
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
          className="mx-auto mb-8 sm:mb-10 max-w-2xl px-4 text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
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
