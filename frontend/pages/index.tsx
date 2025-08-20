import { useState } from 'react';
import Layout from '../components/Layout';
import Hero from './components/Hero';
import Projects from './components/Projects';
import ContactModal from './components/ContactModal';
import Skills from './components/Skills';  // Add this import
import Achievements from './components/Achievements'; // Add this import
import { motion } from 'framer-motion';
import config from './index.json';
import Experience from './components/Experience';
import Testimonials from './components/Testimonials';

export default function Home() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <Layout>
      {/* Hero Section */}
      <Hero />

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* About Section */}
        <motion.section 
          id="about"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: "easeOut"
          }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-12 sm:py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-8 sm:my-20 shadow-xl"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            >
              {config.about.title}
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4 sm:space-y-6"
              >
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
                >
                  {config.about.primary}
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-sm sm:text-base text-gray-600 dark:text-gray-400"
                >
                  {config.about.secondary}
                </motion.p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative mt-8 md:mt-0"
              >
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl transform blur-lg opacity-30" 
                />
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  src={config.about.image}
                  alt="About"
                  className="relative rounded-2xl shadow-lg dark:opacity-90"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <Skills />
        </motion.div>

        {/* Experience Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <Experience />
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <Achievements />
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <Projects />
        </motion.div>

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* <Testimonials /> */}
        </motion.div>

        {/* Contact Section */}
        <motion.section 
          id="contact"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: "easeOut"
          }}
          viewport={{ once: true, margin: "-50px" }}
          className="py-12 sm:py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl mb-8 sm:mb-20 shadow-xl"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            >
              {config.contact.title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 sm:mb-12"
            >
              {config.contact.description}
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 8px 25px rgba(147, 51, 234, 0.3)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsContactModalOpen(true)}
              className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-shadow"
            >
              Get in Touch
            </motion.button>
          </div>
        </motion.section>
      </div>

      <ContactModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </Layout>
  );
}
