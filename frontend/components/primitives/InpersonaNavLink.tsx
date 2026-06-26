import { motion } from 'framer-motion';
import { type MouseEventHandler } from 'react';

interface InpersonaNavLinkProps {
  label: string;
  href: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  variant?: 'desktop' | 'mobile';
}

/**
 * The aurora-shimmering "Inpersona" pill used in both the desktop and
 * mobile navs (teal→mint→green, echoing the hero cloud). The shimmer is one
 * wide gradient animated via CSS
 * background-position (`.nav-pill-shimmer` in globals.css) — cheap on the
 * compositor, unlike interpolating gradient strings per frame on the main
 * thread inside a sticky header. Two layers: a blurred halo and a crisp
 * border ring, with a solid pill on top so the label stays legible.
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
      <span
        aria-hidden="true"
        className="nav-pill-shimmer absolute -inset-0.5 rounded-full opacity-50 blur-md"
      />
      <span aria-hidden="true" className="nav-pill-shimmer absolute inset-0 rounded-full" />
      <span className="absolute inset-[1.5px] rounded-full bg-white dark:bg-gray-900" />
      <span className="relative">{label}</span>
    </motion.a>
  );
}
