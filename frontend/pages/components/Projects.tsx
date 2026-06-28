import { motion } from 'framer-motion';
import { ExternalLink, Github, Package } from 'lucide-react';
import SectionCard from '../../components/primitives/SectionCard';
import SectionHeading from '../../components/primitives/SectionHeading';
import OpenNotifAnimation from '../../components/animations/OpenNotifAnimation';
import TaskbundlePoster from '../../components/animations/TaskbundlePoster';
import config from '../../types/config';

const mediaComponents = {
  openNotifAnimation: OpenNotifAnimation,
  taskbundlePoster: TaskbundlePoster,
} as const;

export default function Projects() {
  const { title, items } = config.projects;

  return (
    <SectionCard id="projects">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading className="mb-12">{title}</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((project, index) => {
            const MediaComponent = project.media ? mediaComponents[project.media] : null;

            return (
              <motion.article
                key={project.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative flex h-full flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-aurora-500/50 dark:hover:border-aurora-400/40 hover:shadow-md hover:shadow-aurora-500/10"
              >
                <div className="relative h-48 overflow-hidden">
                  {MediaComponent ? (
                    <MediaComponent />
                  ) : (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>

                <div className="flex flex-grow flex-col p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="flex-grow text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {project.description}
                  </p>

                  <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-aurora-600 dark:hover:text-aurora-400 transition-colors"
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
                        className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-aurora-600 dark:hover:text-aurora-400 transition-colors ml-auto"
                      >
                        <span>Live Demo</span>
                        <ExternalLink size={16} className="ml-1" />
                      </a>
                    )}
                    {project.pypi && (
                      <a
                        href={project.pypi}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-aurora-600 dark:hover:text-aurora-400 transition-colors"
                      >
                        <Package size={16} className="mr-1" />
                        <span>PyPI</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
