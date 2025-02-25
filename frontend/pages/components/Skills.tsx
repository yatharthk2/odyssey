import { motion, useAnimation } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  SiPython, SiGo, SiHtml5, SiCss3, SiJavascript, SiJava, SiBash, SiMysql, 
  SiGit, SiPytorch, SiTensorflow, SiDjango, SiNodedotjs, SiReact, SiTailwindcss,
  SiFastapi, SiDocker, SiAmazonaws, SiGraphql, SiDatabricks, SiApachespark, SiApacheairflow,
  SiGithubactions, SiMongodb, SiNeo4J, SiApachecassandra, SiAmazondynamodb,
  SiGooglecloud, SiMicrosoftazure, SiJenkins, SiPostgresql
} from 'react-icons/si';
import { FaCode, FaDatabase, FaTools, FaRocket, FaNetworkWired, FaServer } from 'react-icons/fa';
import config from '../index.json';

// Icon mapping for skills
const iconMapping = {
  // Languages
  'Python': SiPython,
  'GOLang': SiGo,
  'HTML': SiHtml5,
  'CSS': SiCss3,
  'JavaScript': SiJavascript,
  'Java': SiJava,
  'SLURM Scripting': SiBash,
  'SQL': SiMysql,
  
  // Technologies
  'GIT': SiGit,
  'PyTorch': SiPytorch,
  'Tensorflow': SiTensorflow,
  'Django': SiDjango,
  'NodeJS': SiNodedotjs,
  'ReactJS': SiReact,
  'TailWind CSS': SiTailwindcss,
  'Fastapi': SiFastapi,
  'Docker': SiDocker,
  'AWS': SiAmazonaws,
  'GraphQL': SiGraphql,
  'Databricks': SiDatabricks,
  'Spark': SiApachespark,
  'Airflow': SiApacheairflow,
  'GitHub Actions': SiGithubactions,
  
  // Databases
  'MySQL': SiMysql,
  'MongoDB': SiMongodb,
  'Neo4j': SiNeo4J,
  'CassandraDB': SiApachecassandra,
  'DynamoDB': SiAmazondynamodb,
  
  // Default icons for core competencies and others
  'ML Model Finetuning': SiPytorch,
  'AI Integration in Web Apps': SiReact,
  'Building AI-Powered Platforms': SiAmazonaws,
  'AWS Cost Optimization': SiAmazonaws,
  'CI/CD': SiGithubactions
};

// Default fallback icons by category
const defaultCategoryIcons = {
  languages: FaCode,
  technologies: FaTools,
  databases: FaDatabase,
  coreCompetencies: FaRocket
};

// Use skills data from config file
const skillsData = config.skills.categories;

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 260,
      damping: 20,
      mass: 0.8
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

// Decorative background pattern component
const BackgroundPattern = ({ color }) => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
      <div className={`w-full h-full ${color} blur-3xl`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full mix-blend-multiply"
            style={{
              width: `${Math.random() * 30 + 15}%`,
              height: `${Math.random() * 30 + 15}%`,
              left: `${Math.random() * 70}%`,
              top: `${Math.random() * 70}%`,
              opacity: Math.random() * 0.5 + 0.2,
              filter: `blur(${Math.random() * 40 + 30}px)`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Simplified SkillTag component without progress bar
const SkillTag = ({ skill, categoryStyle, category }) => {
  const { name } = skill;
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();
  
  // Get the appropriate icon or use category default
  const IconComponent = iconMapping[name] || defaultCategoryIcons[category] || FaCode;
  
  useEffect(() => {
    if (isHovered) {
      controls.start({ 
        scale: 1.05,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 17 
        }
      });
    } else {
      controls.start({ 
        scale: 1,
        boxShadow: "0 0 0 rgba(0,0,0,0)",
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }
      });
    }
  }, [isHovered, controls]);
  
  return (
    <motion.div
      variants={itemVariants}
      animate={controls}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative px-3 py-2 rounded-full border ${categoryStyle.border} ${categoryStyle.bg} 
                 transition-all duration-300 cursor-pointer transform-gpu`}
    >
      <div className="flex items-center space-x-2">
        {/* Icon */}
        <span className={`text-lg ${categoryStyle.textColor}`}>
          <IconComponent />
        </span>
        
        {/* Skill name */}
        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
          {name}
        </span>
      </div>
      
      {/* 3D glow effect on hover */}
      <motion.div
        className={`absolute inset-0 rounded-full ${categoryStyle.glow}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.15 : 0 }}
        transition={{ duration: 0.2 }}
      ></motion.div>
    </motion.div>
  );
};

export default function Skills() {
  const categoryStyles = {
    languages: {
      bg: 'bg-gradient-to-r from-purple-600/10 via-purple-500/5 to-blue-600/10',
      border: 'border-purple-200 dark:border-purple-800/50',
      title: skillsData.languages.title,
      icon: skillsData.languages.icon,
      progressBar: 'bg-gradient-to-r from-purple-500 to-blue-500',
      shadow: 'bg-gradient-to-r from-purple-500 to-blue-500',
      textColor: 'text-purple-600 dark:text-purple-400',
      pattern: 'bg-purple-600',
      glow: 'bg-purple-500/20 dark:bg-purple-400/20 blur-sm'
    },
    technologies: {
      bg: 'bg-gradient-to-r from-blue-600/10 via-blue-500/5 to-cyan-600/10',
      border: 'border-blue-200 dark:border-blue-800/50',
      title: skillsData.technologies.title,
      icon: skillsData.technologies.icon,
      progressBar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      shadow: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      pattern: 'bg-blue-600',
      glow: 'bg-blue-500/20 dark:bg-blue-400/20 blur-sm'
    },
    databases: {
      bg: 'bg-gradient-to-r from-green-600/10 via-green-500/5 to-teal-600/10',
      border: 'border-green-200 dark:border-green-800/50',
      title: skillsData.databases.title,
      icon: skillsData.databases.icon,
      progressBar: 'bg-gradient-to-r from-green-500 to-teal-500',
      shadow: 'bg-gradient-to-r from-green-500 to-teal-500',
      textColor: 'text-green-600 dark:text-green-400',
      pattern: 'bg-green-600',
      glow: 'bg-green-500/20 dark:bg-green-400/20 blur-sm'
    },
    coreCompetencies: {
      bg: 'bg-gradient-to-r from-pink-600/10 via-pink-500/5 to-rose-600/10',
      border: 'border-pink-200 dark:border-pink-800/50',
      title: skillsData.coreCompetencies.title,
      icon: skillsData.coreCompetencies.icon,
      progressBar: 'bg-gradient-to-r from-pink-500 to-rose-500',
      shadow: 'bg-gradient-to-r from-pink-500 to-rose-500',
      textColor: 'text-pink-600 dark:text-pink-400',
      pattern: 'bg-pink-600',
      glow: 'bg-pink-500/20 dark:bg-pink-400/20 blur-sm'
    }
  };

  const SkillCategory = ({ category, categoryKey, style }) => (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className="relative backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 group overflow-hidden"
    >
      {/* Background pattern */}
      <BackgroundPattern color={style.pattern} />
      
      {/* Glowing border effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-1000">
        <div className={`absolute inset-0 rounded-2xl ${style.progressBar} blur-lg opacity-20`}></div>
      </div>
      
      {/* Category header with icon */}
      <motion.div className="relative z-10" variants={headerVariants}>
        <div className="flex items-center space-x-3 mb-5">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${style.bg} border ${style.border} shadow-inner`}>
            <span className="text-2xl">{style.icon}</span>
          </div>
          <h3 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {style.title}
            </span>
          </h3>
        </div>
      </motion.div>
      
      {/* Skills grid with custom gap */}
      <div className="relative z-10 flex flex-wrap gap-3">
        {category.items.map((skill) => (
          <SkillTag 
            key={skill.name} 
            skill={skill} 
            categoryStyle={style}
            category={categoryKey}
          />
        ))}
      </div>
    </motion.div>
  );

  return (
    <motion.section
      id="skills"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="relative py-16 sm:py-24 bg-gradient-to-br from-white/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-3xl my-12 sm:my-24 shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full filter blur-3xl"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 
            className="text-4xl sm:text-5xl font-extrabold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {config.skills.title}
          </motion.h2>
          
          {/* Removed underline element */}
          
          <motion.p 
            className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
          >
            {config.skills.description}
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          <SkillCategory 
            category={skillsData.languages}
            categoryKey="languages"
            style={categoryStyles.languages}
          />
          
          <SkillCategory 
            category={skillsData.technologies}
            categoryKey="technologies" 
            style={categoryStyles.technologies}
          />
          
          <SkillCategory 
            category={skillsData.databases}
            categoryKey="databases"
            style={categoryStyles.databases}
          />
          
          <SkillCategory 
            category={skillsData.coreCompetencies}
            categoryKey="coreCompetencies"
            style={categoryStyles.coreCompetencies}
          />
        </div>
      </div>
    </motion.section>
  );
}
