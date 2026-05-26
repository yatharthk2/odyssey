import { motion } from 'framer-motion';
import { type MouseEventHandler } from 'react';

const gradientStops = [
  'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)',
  'linear-gradient(to right, #22C55E, #EAB308, #EC4899)',
  'linear-gradient(to right, #3B82F6, #F43F5E, #8B5CF6)',
  'linear-gradient(to right, #EAB308, #8B5CF6, #22C55E)',
  'linear-gradient(to right, #F43F5E, #22C55E, #3B82F6)',
  'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)',
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
 * The animated, color-cycling "Inpersona" link used in both the desktop and
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
      className={`relative whitespace-nowrap font-medium px-3 py-1 rounded-full text-purple-600 dark:text-purple-400 max-w-[140px] ${
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
