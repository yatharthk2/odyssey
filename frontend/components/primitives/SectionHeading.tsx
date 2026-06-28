import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  /** h2 by default — pass another tag for SEO/accessibility hierarchy. */
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl',
  xl: 'text-4xl sm:text-5xl',
} as const;

/**
 * Section title: solid near-black/white with tight tracking. The monochrome
 * text gradient is reserved for the hero h1 — repeating it on every heading
 * diluted it and washed out contrast at smaller sizes. Animated in from a
 * slight upward offset when scrolled into view.
 */
export default function SectionHeading({
  children,
  as = 'h2',
  align = 'center',
  size = 'lg',
  className = '',
}: SectionHeadingProps) {
  const Component = motion[as];
  const alignment = align === 'center' ? 'text-center' : 'text-left';

  return (
    <Component
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`${sizeClasses[size]} ${alignment} font-bold tracking-tight text-gray-900 dark:text-white ${className}`}
    >
      {children}
    </Component>
  );
}
