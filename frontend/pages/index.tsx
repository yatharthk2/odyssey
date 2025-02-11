import Layout from '../components/Layout';
import Hero from './components/Hero';
import Projects from './components/Projects';
import { motion } from 'framer-motion';
import config from './index.json';

export default function Home() {
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
          className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-20 shadow-xl"
        >
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {config.about.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {config.about.primary}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {config.about.secondary}
                </p>
              </div>
              <div className="relative">
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

        {/* Projects Section */}
        <motion.section 
          id="projects"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-20 shadow-xl"
        >
          <Projects />
        </motion.section>

        {/* Contact Section */}
        <motion.section 
          id="contact"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl mb-20 shadow-xl"
        >
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {config.contact.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
              {config.contact.description}
            </p>
            <a
              href="#"
              className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-shadow"
            >
              Get in Touch
            </a>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
