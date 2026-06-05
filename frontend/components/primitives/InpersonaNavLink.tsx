import { motion } from 'framer-motion';
import { type MouseEventHandler } from 'react';

// Grayscale shimmer: mid/light grays cycle through so the animated halo reads on
// both light and dark backgrounds (a dark-gray halo would vanish in dark mode).
const gradientStops = [
  'linear-gradient(to right, #4b5563, #d1d5db, #4b5563)',
  'linear-gradient(to right, #9ca3af, #f3f4f6, #9ca3af)',
  'linear-gradient(to right, #6b7280, #e5e7eb, #374151)',
  'linear-gradient(to right, #374151, #d1d5db, #6b7280)',
  'linear-gradient(to right, #9ca3af, #4b5563, #9ca3af)',
  'linear-gradient(to right, #4b5563, #d1d5db, #4b5563)',
];

const animationConfig = {
  animate: { background: gradientStops },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'linear' as const,
    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
  },
};

interface InpersonaNavLinkProps {
  label: string;
  href: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  variant?: 'desktop' | 'mobile';
}

/**
 * The animated, grayscale-shimmering "Inpersona" link used in both the desktop and
 * mobile navs. Renders three stacked gradient layers (blur halo, soft glow,
 * crisp border) with a solid pill on top so the underlying text stays legible.
 */
export default function InpersonaNavLink({
  label,
  href,
  onClick,
  variant = 'desktop',
}: InpersonaNavLinkProps) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      className={`relative whitespace-nowrap font-medium px-3 py-1 rounded-full text-gray-900 dark:text-gray-100 max-w-[140px] ${
        variant === 'mobile' ? 'inline-block' : ''
      }`}
    >
      <motion.span
        className="absolute inset-0 rounded-full opacity-40 blur-xl"
        {...animationConfig}
      />
      <motion.span
        className="absolute -inset-0.5 rounded-full opacity-50 blur-md"
        {...animationConfig}
      />
      <motion.span className="absolute inset-0 rounded-full" {...animationConfig} />
      <span className="absolute inset-[1.5px] rounded-full bg-white dark:bg-gray-900" />
      <span className="relative">{label}</span>
    </motion.a>
  );
}
