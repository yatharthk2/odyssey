import { motion } from 'framer-motion';
import { Building2, Calendar, ExternalLink, MapPin } from 'lucide-react';
import SectionCard from '../../components/primitives/SectionCard';
import SectionHeading from '../../components/primitives/SectionHeading';
import config from '../../types/config';

export default function Experience() {
  const { title, items } = config.experience;

  return (
    <SectionCard id="experience">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading className="mb-12">{title}</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((exp, index) => (
            <motion.article
              key={`${exp.company}-${exp.period}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex h-full flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-aurora-500/50 dark:hover:border-aurora-400/40 hover:shadow-md hover:shadow-aurora-500/10"
            >
              <div
                className={`relative h-40 overflow-hidden ${
                  exp.iconOnly ? 'bg-white' : ''
                }`}
              >
                <img
                  src={exp.image}
                  alt={`${exp.company} logo`}
                  className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                    exp.iconOnly ? 'object-contain p-6' : 'object-cover'
                  }`}
                />
              </div>

              {/* The link carries mt-auto to pin to the card bottom, so the
                  space-y utility must stay scoped to the details block —
                  its sibling selector out-specifies .mt-auto and would
                  otherwise cancel the pinning. */}
              <div className="flex flex-grow flex-col p-4">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
                  {exp.title}
                </h3>

                <div className="space-y-1">
                  <Detail icon={<Building2 size={14} />} text={exp.company} tone="primary" />
                  <Detail icon={<MapPin size={14} />} text={exp.location} />
                  <Detail icon={<Calendar size={14} />} text={exp.period} mono />
                </div>

                {exp.description && (
                  <p className="pt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {exp.description}
                  </p>
                )}

                {exp.companyUrl && (
                  <a
                    href={exp.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-auto pt-4 text-sm text-gray-900 dark:text-gray-100 hover:text-aurora-600 dark:hover:text-aurora-400 transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Visit Company Page</span>
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function Detail({
  icon,
  text,
  tone = 'muted',
  mono = false,
}: {
  icon: React.ReactNode;
  text: string;
  tone?: 'primary' | 'muted';
  mono?: boolean;
}) {
  const color =
    tone === 'primary'
      ? 'text-gray-700 dark:text-gray-300'
      : 'text-gray-500 dark:text-gray-400';
  return (
    <div className={`flex items-center gap-2 ${color}`}>
      {icon}
      <p className={mono ? 'font-mono text-xs' : 'text-sm'}>{text}</p>
    </div>
  );
}
