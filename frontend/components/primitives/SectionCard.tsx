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
 * Section container used by every section on the home page: spacing plus the
 * scroll-reveal entrance, nothing else. Sections are open regions on the page
 * background — surface treatment (border/shadow/rounding) belongs to the
 * content cards inside, so the page reads as one composition rather than a
 * stack of glass panels.
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
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative ${spacing} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.section>
  );
}
