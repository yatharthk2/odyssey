import { motion } from 'framer-motion';
import { Github, ExternalLink } from 'lucide-react';
import config from '../index.json';

export default function Projects() {
  return (
    <motion.section 
      id="projects"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-20 shadow-xl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent dark:text-gray-100">
          {config.projects.title}
        </h2>
        <p className="text-base text-gray-700 dark:text-gray-300 md:text-lg">
          {config.projects.description}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {config.projects.projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Project Image with Overlay */}
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-blue-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Project Links */}
                <div className="flex items-center gap-4 mt-auto">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    <ExternalLink size={16} />
                    <span>Live Demo</span>
                  </a>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Github size={16} />
                    <span>Source</span>
                  </a>
                </div>
              </div>

              {/* Decorative Corner Gradient */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 dark:from-purple-600/10 dark:to-blue-600/10 transform rotate-45 translate-x-10 -translate-y-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}