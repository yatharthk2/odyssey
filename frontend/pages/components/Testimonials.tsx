import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SiLinkedin as SiLinkedinIcon } from 'react-icons/si';
import GradientHeading from '../../components/primitives/GradientHeading';
import config, { type TestimonialItem } from '../../types/config';
import { asIcon } from '../../types/icons';

const SiLinkedin = asIcon(SiLinkedinIcon);

function TestimonialCard({
  name,
  role,
  company,
  content,
  imageUrl,
  linkedinUrl,
  truncationLength,
}: TestimonialItem & { truncationLength: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > truncationLength;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative mx-4 flex h-full flex-col rounded-xl border border-gray-100/40 dark:border-gray-700/40 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-sm p-8 shadow-xl"
    >
      <div className="mb-6 flex-grow">
        {/* line-clamp (not character truncation) so every collapsed card shows
            exactly five lines — keeps Read more and the divider aligned across
            cards regardless of where words happen to wrap. */}
        <p
          className={`text-lg leading-relaxed text-gray-700 dark:text-gray-200 first-letter:mr-1 first-letter:font-serif first-letter:text-3xl ${
            shouldTruncate && !isExpanded ? 'line-clamp-5' : ''
          }`}
        >
          “{content}”
        </p>
        {shouldTruncate && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
            className="mt-2 -ml-2 rounded px-2 py-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>

      <div className="mt-auto flex items-center border-t border-gray-100 dark:border-gray-700 pt-4">
        {imageUrl ? (
          <div className="mr-4 h-14 w-14 overflow-hidden rounded-full ring-2 ring-gray-900 dark:ring-white ring-offset-2 dark:ring-offset-gray-800">
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white text-xl font-bold text-white dark:text-gray-900 shadow-md">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{name}</h3>
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                aria-label={`${name}'s LinkedIn profile`}
              >
                <SiLinkedin className="h-5 w-5" />
              </a>
            )}
          </div>
          {/* Fixed two-line meta block so the divider sits at the same height
              on every card whether the role wraps to one line or two. */}
          <p className="min-h-[2.5rem] text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {role}
            {company && `, ${company}`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function useDisplayCount() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1280) setCount(3);
      else if (window.innerWidth >= 1024) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
}

export default function Testimonials() {
  const { title, subtitle, rotationIntervalMs, truncationLength, items } = config.testimonials;
  const displayCount = useDisplayCount();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxIndex = Math.ceil(items.length / displayCount);
  const currentPage = Math.floor(currentIndex / displayCount);
  const visibleTestimonials = items.slice(currentIndex, currentIndex + displayCount);
  const canPaginate = items.length > displayCount;

  // A page index from one breakpoint can be out of range at another (e.g.
  // rotation advanced to index 2 while mobile showed 1 card, then the window
  // widens to show 3) — without a reset the slice strands a partial group.
  useEffect(() => {
    setCurrentIndex(0);
  }, [displayCount]);

  useEffect(() => {
    if (!autoRotate || !canPaginate) return undefined;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + displayCount >= items.length ? 0 : prev + displayCount));
    }, rotationIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRotate, canPaginate, displayCount, items.length, rotationIntervalMs]);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const next = () => {
    clearTimer();
    setCurrentIndex((prev) => (prev + displayCount >= items.length ? 0 : prev + displayCount));
    setAutoRotate(true);
  };

  const prev = () => {
    clearTimer();
    setCurrentIndex((prev) => {
      const previous = prev - displayCount;
      if (previous >= 0) return previous;
      // Land on the last full page so partial groups don't show overlapping cards.
      return Math.max(0, (maxIndex - 1) * displayCount);
    });
    setAutoRotate(true);
  };

  const jumpToPage = (page: number) => {
    clearTimer();
    setCurrentIndex(page * displayCount);
    setAutoRotate(true);
  };

  return (
    <motion.section
      id="testimonials"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onMouseEnter={() => setAutoRotate(false)}
      onMouseLeave={() => setAutoRotate(true)}
      aria-label="Testimonials"
      className="relative my-12 sm:my-24 overflow-hidden rounded-3xl bg-gradient-to-b from-gray-100/60 to-white/60 dark:from-gray-900/60 dark:to-gray-800/60 backdrop-blur-sm py-16 sm:py-24 shadow-xl"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gray-400/30 dark:bg-white/10" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-400/30 dark:bg-white/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <GradientHeading size="xl" className="mb-6">
            {title}
          </GradientHeading>
          {subtitle && (
            <motion.p
              className="mx-auto max-w-3xl text-lg text-gray-700 dark:text-gray-300"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div className="flex flex-col justify-center gap-6 lg:flex-row lg:gap-8">
              <AnimatePresence mode="wait">
                {visibleTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={`${currentIndex}-${index}`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`w-full ${
                      displayCount === 3
                        ? 'lg:w-1/3'
                        : displayCount === 2
                          ? 'lg:w-1/2'
                          : 'mx-auto max-w-2xl'
                    }`}
                  >
                    <TestimonialCard {...testimonial} truncationLength={truncationLength} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {canPaginate && (
            <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between sm:flex-row">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous testimonials"
                className="group rounded-full bg-white dark:bg-gray-700 p-3 shadow-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900 dark:text-gray-100 transition-transform group-hover:scale-110" />
              </button>

              <div className="my-4 flex gap-3 sm:my-0">
                {Array.from({ length: maxIndex }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => jumpToPage(idx)}
                    aria-label={`Go to testimonial group ${idx + 1}`}
                    aria-current={currentPage === idx ? 'true' : 'false'}
                    className={`rounded transition-all duration-300 ${
                      currentPage === idx
                        ? 'h-2 w-8 bg-gray-900 dark:bg-white'
                        : 'h-2 w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={next}
                aria-label="Next testimonials"
                className="group rounded-full bg-white dark:bg-gray-700 p-3 shadow-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ChevronRight className="h-5 w-5 text-gray-900 dark:text-gray-100 transition-transform group-hover:scale-110" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
