import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import SectionCard from '../../components/primitives/SectionCard';
import GradientHeading from '../../components/primitives/GradientHeading';
import OpenNotifAnimation from '../../components/animations/OpenNotifAnimation';
import config from '../../types/config';

const mediaComponents = {
  openNotifAnimation: OpenNotifAnimation,
} as const;

export default function Projects() {
  const { title, items } = config.projects;

  return (
    <SectionCard id="projects">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <GradientHeading className="mb-12">{title}</GradientHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((project, index) => {
            const MediaComponent = project.media ? mediaComponents[project.media] : null;

            return (
              <motion.article
                key={project.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative flex h-full flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {MediaComponent ? (
                    <MediaComponent />
                  ) : (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                </div>

                <div className="flex flex-grow flex-col p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="flex-grow text-gray-600 dark:text-gray-300 mb-4">
                    {project.description}
                  </p>

                  <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        <Github size={16} className="mr-1" />
                        <span>Source</span>
                      </a>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto"
                      >
                        <span>Live Demo</span>
                        <ExternalLink size={16} className="ml-1" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-900/15 to-gray-500/10 dark:from-white/10 dark:to-white/5 rotate-45 translate-x-10 -translate-y-10" />
              </motion.article>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
