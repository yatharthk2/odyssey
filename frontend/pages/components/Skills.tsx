import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  SiAmazon,
  SiAmazondynamodb,
  SiApacheairflow,
  SiApachekafka,
  SiApachespark,
  SiCplusplus,
  SiDatabricks,
  SiDjango,
  SiDocker,
  SiExpress,
  SiFastapi,
  SiGit,
  SiGithubactions,
  SiGo,
  SiGraphql,
  SiJavascript,
  SiKubernetes,
  SiMongodb,
  SiMysql,
  SiNeo4J,
  SiNextdotjs,
  SiNodedotjs,
  SiPytorch,
  SiPython,
  SiReact,
  SiRedis,
  SiRust,
  SiTailwindcss,
  SiTensorflow,
  SiTypescript,
} from 'react-icons/si';
import { FaCode, FaDatabase, FaRocket, FaTools } from 'react-icons/fa';
import useIsMobile from '../../hooks/useIsMobile';
import config, { type Skill, type SkillCategoryKey } from '../../types/config';
import { asIconMap, type Icon } from '../../types/icons';

const skillIcons = asIconMap({
  // Languages
  Rust: SiRust,
  Python: SiPython,
  'C++': SiCplusplus,
  Go: SiGo,
  TypeScript: SiTypescript,
  JavaScript: SiJavascript,
  SQL: SiMysql,

  // Technologies
  PyTorch: SiPytorch,
  Tensorflow: SiTensorflow,
  Django: SiDjango,
  NodeJS: SiNodedotjs,
  Express: SiExpress,
  ReactJS: SiReact,
  'Next.js': SiNextdotjs,
  'TailWind CSS': SiTailwindcss,
  Fastapi: SiFastapi,
  Docker: SiDocker,
  'Kubernetes (EKS)': SiKubernetes,
  AWS: SiAmazon,
  Kafka: SiApachekafka,
  GIT: SiGit,
  GraphQL: SiGraphql,
  Databricks: SiDatabricks,
  Spark: SiApachespark,
  Airflow: SiApacheairflow,
  'GitHub Actions': SiGithubactions,

  // Databases
  MongoDB: SiMongodb,
  Neo4j: SiNeo4J,
  DynamoDB: SiAmazondynamodb,
  Redis: SiRedis,

  // Core competencies
  'Hybrid Search & Vector DBs': SiNeo4J,
  'LLM Engineering': SiPytorch,
  'Real-Time Systems': SiApachekafka,
  'ML Model Finetuning': SiPytorch,
  'AI Integration in Web Apps': SiReact,
  'AWS Cost Optimization': SiAmazon,
  'CI/CD': SiGithubactions,
}) as Record<string, Icon>;

const categoryFallbackIcons = asIconMap<SkillCategoryKey>({
  languages: FaCode,
  technologies: FaTools,
  databases: FaDatabase,
  coreCompetencies: FaRocket,
});

interface CategoryStyle {
  bg: string;
  border: string;
  textColor: string;
  glowOverlay: string;
  pattern: string;
}

// One shared monochrome scheme for every category — the emoji icon and title carry
// the per-category identity, so the cards stay visually unified in black & white.
const monochromeStyle: CategoryStyle = {
  bg: 'bg-gradient-to-r from-gray-200/50 via-gray-100/20 to-gray-200/50 dark:from-gray-700/40 dark:via-gray-800/20 dark:to-gray-700/40',
  border: 'border-gray-200 dark:border-gray-700',
  textColor: 'text-gray-900 dark:text-gray-100',
  glowOverlay: 'bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-300 dark:to-gray-500',
  pattern: 'bg-gray-500',
};

const categoryStyles: Record<SkillCategoryKey, CategoryStyle> = {
  languages: monochromeStyle,
  technologies: monochromeStyle,
  databases: monochromeStyle,
  coreCompetencies: monochromeStyle,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 200, damping: 25 },
  },
};

function SkillTag({
  skill,
  category,
  style,
}: {
  skill: Skill;
  category: SkillCategoryKey;
  style: CategoryStyle;
}) {
  const Icon = skillIcons[skill.name] ?? categoryFallbackIcons[category];
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`relative cursor-pointer rounded-full border ${style.border} ${style.bg} px-3 py-2 transition-colors`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`text-lg ${style.textColor}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {skill.name}
        </span>
      </div>
    </motion.div>
  );
}

function SkillCategoryView({
  categoryKey,
  style,
  isMobile,
}: {
  categoryKey: SkillCategoryKey;
  style: CategoryStyle;
  isMobile: boolean;
}) {
  const category = config.skills.categories[categoryKey];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: isMobile ? '-20px' : '-50px' }}
      variants={containerVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm shadow-lg ${
        isMobile ? 'p-4' : 'p-6'
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 opacity-10 ${style.pattern} blur-2xl`}
      />
      {!isMobile && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-2xl ${style.glowOverlay} blur-lg transition-opacity duration-500 ${
            isHovered ? 'opacity-20' : 'opacity-0'
          }`}
        />
      )}

      <div className="relative z-10">
        <div className={`flex items-center gap-3 ${isMobile ? 'mb-3' : 'mb-5'}`}>
          <div
            className={`flex items-center justify-center rounded-full border ${style.border} ${style.bg} shadow-inner ${
              isMobile ? 'w-10 h-10' : 'w-12 h-12'
            }`}
          >
            <span className={isMobile ? 'text-xl' : 'text-2xl'}>{category.icon}</span>
          </div>
          <h3 className={isMobile ? 'text-lg font-bold' : 'text-xl font-bold'}>
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              {category.title}
            </span>
          </h3>
        </div>

        <div className={`flex flex-wrap ${isMobile ? 'gap-2' : 'gap-3'}`}>
          {category.items.map((skill) => (
            <SkillTag key={skill.name} skill={skill} category={categoryKey} style={style} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const CATEGORY_KEYS: SkillCategoryKey[] = [
  'languages',
  'technologies',
  'databases',
  'coreCompetencies',
];

export default function Skills() {
  const isMobile = useIsMobile();
  const { title, description } = config.skills;

  return (
    <motion.section
      id="skills"
      initial={{ opacity: 0, y: isMobile ? 30 : 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: isMobile ? 0.5 : 0.7 }}
      className={`relative overflow-hidden rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-100/80 dark:from-gray-800/80 dark:to-black/80 backdrop-blur-sm shadow-xl ${
        isMobile ? 'my-8 py-10' : 'my-12 sm:my-24 py-16 sm:py-24'
      }`}
    >
      {!isMobile && (
        <>
          <div className="pointer-events-none absolute top-0 left-0 w-40 h-40 bg-gray-500/10 dark:bg-white/5 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 w-60 h-60 bg-gray-500/10 dark:bg-white/5 rounded-full blur-3xl" />
        </>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: isMobile ? -10 : -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}
        >
          <h2
            className={`mb-4 font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent ${
              isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'
            }`}
          >
            {title}
          </h2>
          {description && (
            <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </motion.div>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'md:grid-cols-2 gap-8 sm:gap-10'}`}>
          {CATEGORY_KEYS.map((key) => (
            <SkillCategoryView
              key={key}
              categoryKey={key}
              style={categoryStyles[key]}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
