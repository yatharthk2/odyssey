import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface GradientHeadingProps {
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
 * Title with the signature purple → pink → blue gradient that appears on every section.
 * Animated in from a slight upward offset when scrolled into view.
 */
export default function GradientHeading({
  children,
  as = 'h2',
  align = 'center',
  size = 'lg',
  className = '',
}: GradientHeadingProps) {
  const Component = motion[as];
  const alignment = align === 'center' ? 'text-center' : 'text-left';

  return (
    <Component
      initial={{ opacity: 0, y: -16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`${sizeClasses[size]} ${alignment} font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent ${className}`}
    >
      {children}
    </Component>
  );
}
