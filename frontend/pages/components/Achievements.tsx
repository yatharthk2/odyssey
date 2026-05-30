import { motion } from 'framer-motion';
import { SiAmazon, SiDell, SiNvidia, SiYcombinator } from 'react-icons/si';
import { FaGraduationCap } from 'react-icons/fa';
import SectionCard from '../../components/primitives/SectionCard';
import GradientHeading from '../../components/primitives/GradientHeading';
import config from '../../types/config';
import { asIcon, type Icon } from '../../types/icons';

const companyIcons: Record<string, { Icon: Icon; className: string }> = {
  dell: { Icon: asIcon(SiDell), className: 'text-blue-700 dark:text-blue-400' },
  nvidia: { Icon: asIcon(SiNvidia), className: 'text-green-600 dark:text-green-400' },
  amazon: { Icon: asIcon(SiAmazon), className: 'text-orange-500 dark:text-orange-400' },
  // Kelley School of Business — there's no university brand icon in react-icons,
  // so we use a graduation cap in IU crimson as a recognizable stand-in.
  kelley: { Icon: asIcon(FaGraduationCap), className: 'text-red-700 dark:text-red-400' },
  ycombinator: { Icon: asIcon(SiYcombinator), className: 'text-orange-500 dark:text-orange-400' },
};

export default function Achievements() {
  const { title, items } = config.achievements;

  return (
    <SectionCard id="achievements" compact>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <GradientHeading className="mb-8 sm:mb-16">{title}</GradientHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item, index) => {
            const iconConfig = item.companyIcon ? companyIcons[item.companyIcon] : null;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group relative flex h-full flex-col bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 overflow-hidden"
              >
                <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-bl-full translate-x-5 -translate-y-5" />

                <div className="flex items-start mb-4">
                  {iconConfig && (
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-600 mr-4">
                      <iconConfig.Icon className={`text-2xl ${iconConfig.className}`} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">{item.date}</p>
                  </div>
                </div>

                <p className="flex-grow text-sm text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>

                {item.link && (
                  <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-600 text-right">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                    >
                      Learn more
                      <svg
                        className="ml-1 w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
