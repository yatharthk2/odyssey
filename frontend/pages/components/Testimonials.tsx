import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../index.json';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  content: string;
  imageUrl?: string;
  linkedinUrl?: string;
}

const LinkedInIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5"
  >
    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 00.1.4V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
  </svg>
);

const TestimonialCard: React.FC<TestimonialProps> = ({ name, role, company, content, imageUrl, linkedinUrl }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > 150;
  const truncatedContent = shouldTruncate && !isExpanded ? content.substring(0, 150) + '...' : content;

  return (
    <motion.div 
      className="bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-gray-100/40 dark:border-gray-700/40 flex flex-col h-full mx-4 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      
      
      <div className="mb-6 flex-grow">
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg first-letter:text-3xl first-letter:font-serif first-letter:mr-1">
          "{truncatedContent}"
        </p>
        
        {shouldTruncate && (
          <button 
            className="text-purple-600 dark:text-purple-400 mt-2 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded px-2 py-0.5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center">
        {imageUrl ? (
          <div className="h-14 w-14 rounded-full overflow-hidden mr-4 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800">
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-full mr-4 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xl shadow-md">
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
                className="text-[#0A66C2] hover:text-[#004182] dark:text-[#0A66C2] dark:hover:text-[#4593de] transition-colors"
                aria-label={`${name}'s LinkedIn profile`}
              >
                <LinkedInIcon />
              </a>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{role}{company && `, ${company}`}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Testimonials: React.FC = () => {
  const { title, subtitle, items } = config.testimonials;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update display count based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setDisplayCount(3); // Show 3 on extra large screens
      } else if (window.innerWidth >= 1024) {
        setDisplayCount(2); // Show 2 on large screens
      } else {
        setDisplayCount(1); // Show 1 on smaller screens
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || items.length <= displayCount) return;
    
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex + displayCount >= items.length ? 0 : prevIndex + displayCount
      );
    }, 7000); // Rotate every 7 seconds
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRotate, displayCount, items.length, currentIndex]);

  const nextSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIndex((prevIndex) => 
      prevIndex + displayCount >= items.length 
        ? 0 
        : prevIndex + displayCount
    );
    // Restart auto-rotation
    setAutoRotate(true);
  };

  const prevSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIndex((prevIndex) => 
      prevIndex - displayCount < 0 
        ? Math.max(0, items.length - displayCount) 
        : prevIndex - displayCount
    );
    // Restart auto-rotation
    setAutoRotate(true);
  };

  const jumpToSlide = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIndex(index * displayCount);
    // Restart auto-rotation
    setAutoRotate(true);
  };

  const maxIndex = Math.ceil(items.length / displayCount);
  const currentPage = Math.floor(currentIndex / displayCount);
  const visibleTestimonials = items.slice(currentIndex, currentIndex + displayCount);

  return (
    <motion.section 
      id="testimonials"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/60 to-white/60 dark:from-gray-900/60 dark:to-gray-800/60 backdrop-blur-sm rounded-3xl my-12 sm:my-24 shadow-xl relative overflow-hidden"
      onMouseEnter={() => setAutoRotate(false)}
      onMouseLeave={() => setAutoRotate(true)}
      aria-label="Customer testimonials"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-300/30"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-300/30"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <motion.h2 
            className="text-3xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {title}
          </motion.h2>
          <motion.p 
            className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {subtitle}
          </motion.p>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div className={`flex flex-col lg:flex-row justify-center gap-6 lg:gap-8`}>
              <AnimatePresence mode="wait">
                {visibleTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={`${currentIndex}-${index}`}
                    className={`w-full ${
                      displayCount === 3 ? 'lg:w-1/3' : displayCount === 2 ? 'lg:w-1/2' : 'max-w-2xl mx-auto'
                    }`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <TestimonialCard {...testimonial} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          {items.length > displayCount && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-10 max-w-3xl mx-auto">
              <button 
                onClick={prevSlide}
                className="p-3 rounded-full bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors shadow-md group"
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Pagination indicators */}
              <div className="flex gap-3 my-4 sm:my-0">
                {Array.from({ length: maxIndex }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToSlide(idx)}
                    className={`transition-all duration-300 rounded ${
                      currentPage === idx 
                        ? 'w-8 h-2 bg-purple-600 dark:bg-purple-500' 
                        : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-purple-400 dark:hover:bg-purple-700'
                    }`}
                    aria-label={`Go to testimonial group ${idx + 1}`}
                    aria-current={currentPage === idx ? 'true' : 'false'}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextSlide}
                className="p-3 rounded-full bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors shadow-md group"
                aria-label="Next testimonials"
              >
                <ChevronRight className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
          
        </div>
      </div>
    </motion.section>
  );
};

export default Testimonials;
