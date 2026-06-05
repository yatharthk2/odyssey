import { motion } from 'framer-motion';
import { Building2, Calendar, ExternalLink, MapPin } from 'lucide-react';
import SectionCard from '../../components/primitives/SectionCard';
import GradientHeading from '../../components/primitives/GradientHeading';
import config from '../../types/config';

export default function Experience() {
  const { title, items } = config.experience;

  return (
    <SectionCard id="experience">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <GradientHeading className="mb-12">{title}</GradientHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((exp, index) => (
            <motion.article
              key={`${exp.company}-${exp.period}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`relative h-40 overflow-hidden ${
                  exp.iconOnly ? 'bg-white' : ''
                }`}
              >
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <img
                  src={exp.image}
                  alt={`${exp.company} logo`}
                  className={`w-full h-full transition-transform duration-300 group-hover:scale-110 ${
                    exp.iconOnly ? 'object-contain p-6' : 'object-cover'
                  }`}
                />
              </div>

              <div className="p-4 space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {exp.title}
                </h3>

                <Detail icon={<Building2 size={14} />} text={exp.company} tone="primary" />
                <Detail icon={<MapPin size={14} />} text={exp.location} />
                <Detail icon={<Calendar size={14} />} text={exp.period} />

                {exp.companyUrl && (
                  <a
                    href={exp.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Visit Company Page</span>
                  </a>
                )}
              </div>

              <div className="pointer-events-none absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-900/15 to-gray-500/10 dark:from-white/10 dark:to-white/5 rotate-45 translate-x-8 -translate-y-8" />
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
}: {
  icon: React.ReactNode;
  text: string;
  tone?: 'primary' | 'muted';
}) {
  const color =
    tone === 'primary'
      ? 'text-gray-600 dark:text-gray-300'
      : 'text-gray-500 dark:text-gray-400';
  return (
    <div className={`flex items-center gap-2 ${color}`}>
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  );
}
