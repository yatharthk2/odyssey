import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

interface SectionCardProps extends Omit<HTMLMotionProps<'section'>, 'children'> {
  id?: string;
  children: ReactNode;
  /** Tighten vertical padding/margin for sections that already have inner spacing. */
  compact?: boolean;
  className?: string;
}

/**
 * Glass-panel section container used by every section on the home page.
 * Wraps the repeated `motion.section + bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
 * rounded-3xl shadow-xl` envelope so individual sections stay focused on their content.
 */
export default function SectionCard({
  id,
  children,
  compact = false,
  className = '',
  ...motionProps
}: SectionCardProps) {
  const spacing = compact
    ? 'py-12 sm:py-16 my-8 sm:my-16'
    : 'py-16 sm:py-20 my-12 sm:my-20';

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative ${spacing} bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden ${className}`}
      {...motionProps}
    >
      {children}
    </motion.section>
  );
}
