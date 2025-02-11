import config from '../index.json';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
        >
          {config.hero.name}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8"
        >
          {config.hero.subtitle}
        </motion.p>

        {/* Call to action buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-4 justify-center"
        >
          <a 
            href="#projects" 
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-shadow"
          >
            View Projects
          </a>
          <a 
            href="#contact" 
            className="px-6 py-3 rounded-full border-2 border-purple-600 text-purple-600 dark:text-purple-400 font-medium hover:bg-purple-600 hover:text-white transition-colors"
          >
            Contact Me
          </a>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-conic from-purple-500/30 to-transparent dark:from-purple-500/10 animate-spin-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-conic from-blue-500/30 to-transparent dark:from-blue-500/10 animate-spin-slow" />
      </div>
    </div>
  );
}