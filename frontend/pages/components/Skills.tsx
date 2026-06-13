import { motion } from 'framer-motion';
import {
  SiRust,
  SiPython,
  SiCplusplus,
  SiGo,
  SiTypescript,
  SiJavascript,
  SiMysql,
  SiPytorch,
  SiTensorflow,
  SiDjango,
  SiNodedotjs,
  SiExpress,
  SiReact,
  SiNextdotjs,
  SiTailwindcss,
  SiFastapi,
  SiDocker,
  SiKubernetes,
  SiAmazon,
  SiApachekafka,
  SiGit,
  SiGraphql,
  SiDatabricks,
  SiApachespark,
  SiApacheairflow,
  SiGithubactions,
  SiMongodb,
  SiNeo4J,
  SiAmazondynamodb,
  SiRedis,
} from 'react-icons/si';
import { FaCode, FaDatabase, FaRocket, FaTools } from 'react-icons/fa';
import SectionCard from '../../components/primitives/SectionCard';
import SectionHeading from '../../components/primitives/SectionHeading';
import config, { type Skill, type SkillCategoryKey } from '../../types/config';
import { asIconMap, type Icon } from '../../types/icons';

// Keyed by skill name from index.json — typed as Record<string, …> because
// config names are plain strings; misses fall through to the category icon.
const skillIcons: Record<string, Icon> = asIconMap({
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
  TensorFlow: SiTensorflow,
  Django: SiDjango,
  'Node.js': SiNodedotjs,
  Express: SiExpress,
  React: SiReact,
  'Next.js': SiNextdotjs,
  'Tailwind CSS': SiTailwindcss,
  FastAPI: SiFastapi,
  Docker: SiDocker,
  'Kubernetes (EKS)': SiKubernetes,
  AWS: SiAmazon,
  Kafka: SiApachekafka,
  Git: SiGit,
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
});

const categoryFallbackIcons = asIconMap<SkillCategoryKey>({
  languages: FaCode,
  technologies: FaTools,
  databases: FaDatabase,
  coreCompetencies: FaRocket,
});

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

function SkillTag({ skill, category }: { skill: Skill; category: SkillCategoryKey }) {
  const Icon = skillIcons[skill.name] ?? categoryFallbackIcons[category];
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 transition-colors hover:border-gray-500 dark:hover:border-gray-400"
    >
      <Icon className="text-base text-gray-700 dark:text-gray-300" />
      <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
        {skill.name}
      </span>
    </motion.div>
  );
}

// Open groups (heading row + pill cloud) rather than boxed cards — the pills
// already carry a border, so boxing the group made three nested surfaces.
function SkillCategoryView({ categoryKey }: { categoryKey: SkillCategoryKey }) {
  const category = config.skills.categories[categoryKey];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={containerVariants}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xl" aria-hidden="true">
          {category.icon}
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          {category.title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3">
        {category.items.map((skill) => (
          <SkillTag key={skill.name} skill={skill} category={categoryKey} />
        ))}
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
  const { title, description } = config.skills;

  return (
    <SectionCard id="skills">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading className="mb-4">{title}</SectionHeading>
        {description && (
          <p className="mx-auto mb-10 max-w-2xl text-center text-gray-700 dark:text-gray-300">
            {description}
          </p>
        )}

        <div className="mt-10 md:mt-16 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
          {CATEGORY_KEYS.map((key) => (
            <SkillCategoryView key={key} categoryKey={key} />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
