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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-12 sm:py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-8 sm:my-20 shadow-xl"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {config.about.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="space-y-4 sm:space-y-6">
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {config.about.primary}
                </p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {config.about.secondary}
                </p>
              </div>
              <div className="relative mt-8 md:mt-0">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl transform rotate-6 blur-lg opacity-30" />
                <img
                  src={config.about.image}
                  alt="About"
                  className="relative rounded-2xl shadow-lg dark:opacity-90"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Skills Section */}
        <Skills />

        {/* Experience Section */}
        <Experience />

        {/* Achievements Section */}
        <Achievements />

        {/* Projects Section */}
        <Projects />

        {/* Testimonials Section */}
        <Testimonials />

        {/* Contact Section */}
        <motion.section 
          id="contact"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-12 sm:py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl mb-8 sm:mb-20 shadow-xl"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {config.contact.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 sm:mb-12">
              {config.contact.description}
            </p>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-shadow"
            >
              Get in Touch
            </button>
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
