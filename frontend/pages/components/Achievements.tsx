import { motion } from 'framer-motion';
import { SiAmazon, SiDell, SiNvidia, SiYcombinator } from 'react-icons/si';
import { FaGraduationCap } from 'react-icons/fa';
import SectionCard from '../../components/primitives/SectionCard';
import SectionHeading from '../../components/primitives/SectionHeading';
import config from '../../types/config';
import { asIcon, type Icon } from '../../types/icons';

// All company marks render in a single grayscale tone to keep the section
// monochrome at rest; they pick up the aurora accent on card hover, matching
// the rest of the page. The icon shapes themselves stay recognizable.
const ICON_TONE =
  'text-gray-700 dark:text-gray-300 transition-colors group-hover:text-aurora-600 dark:group-hover:text-aurora-400';
const companyIcons: Record<string, { Icon: Icon; className: string }> = {
  dell: { Icon: asIcon(SiDell), className: ICON_TONE },
  nvidia: { Icon: asIcon(SiNvidia), className: ICON_TONE },
  amazon: { Icon: asIcon(SiAmazon), className: ICON_TONE },
  // Kelley School of Business — there's no university brand icon in react-icons,
  // so we use a graduation cap as a recognizable stand-in.
  kelley: { Icon: asIcon(FaGraduationCap), className: ICON_TONE },
  ycombinator: { Icon: asIcon(SiYcombinator), className: ICON_TONE },
};

export default function Achievements() {
  const { title, items } = config.achievements;

  return (
    <SectionCard id="achievements" compact>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading className="mb-8 sm:mb-16">{title}</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item, index) => {
            const iconConfig = item.companyIcon ? companyIcons[item.companyIcon] : null;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group relative flex h-full flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-aurora-500/50 dark:hover:border-aurora-400/40 hover:shadow-md hover:shadow-aurora-500/10"
              >
                <div className="flex items-start mb-4">
                  {iconConfig && (
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mr-4 transition-colors group-hover:bg-aurora-500/10 dark:group-hover:bg-aurora-400/10">
                      <iconConfig.Icon className={`text-2xl ${iconConfig.className}`} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold tracking-tight text-lg text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.date}</p>
                  </div>
                </div>

                <p className="flex-grow text-sm text-gray-700 dark:text-gray-300">
                  {item.description}
                </p>

                {item.link && (
                  <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 text-right">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-aurora-600 dark:hover:text-aurora-400 transition-colors"
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
