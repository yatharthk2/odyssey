import React, { useState, useEffect } from 'react';
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
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full mx-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-4">
        {imageUrl ? (
          <div className="h-16 w-16 rounded-full overflow-hidden mr-4 border-2 border-purple-500">
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full mr-4 flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold text-2xl">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{name}</h3>
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
      <div className="flex-grow">
        <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">"{truncatedContent}"</p>
        {shouldTruncate && (
          <button 
            className="text-purple-600 dark:text-purple-400 mt-2 text-sm font-medium hover:underline focus:outline-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const Testimonials: React.FC = () => {
  const { title, subtitle, items } = config.testimonials;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(1); // Number of testimonials to show at once

  // Update display count based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setDisplayCount(2); // Show 2 on large screens
      } else {
        setDisplayCount(1); // Show 1 on smaller screens
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex + displayCount >= items.length 
        ? 0 
        : prevIndex + displayCount
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex - displayCount < 0 
        ? Math.max(0, items.length - displayCount) 
        : prevIndex - displayCount
    );
  };

  const visibleTestimonials = items.slice(currentIndex, currentIndex + displayCount);

  return (
    <motion.section 
      id="testimonials"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-12 sm:py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-8 sm:my-20 shadow-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="relative px-4">
          <div className="overflow-hidden">
            <div className={`flex flex-col lg:flex-row justify-center ${items.length <= displayCount ? 'gap-6' : ''}`}>
              <AnimatePresence mode="wait">
                {visibleTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={`${currentIndex}-${index}`}
                    className="w-full lg:w-1/2 flex-shrink-0"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <TestimonialCard {...testimonial} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          {items.length > displayCount && (
            <div className="flex justify-center items-center mt-8 gap-8">
              <button 
                onClick={prevSlide}
                className="p-2 rounded-full bg-purple-100 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </button>
              
              {/* Pagination indicators */}
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(items.length / displayCount) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx * displayCount)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      Math.floor(currentIndex / displayCount) === idx 
                        ? 'bg-purple-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextSlide}
                className="p-2 rounded-full bg-purple-100 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default Testimonials;
