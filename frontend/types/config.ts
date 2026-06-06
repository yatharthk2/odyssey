import configJson from '../pages/index.json';

export interface NavItem {
  title: string;
  url: string;
}

export interface Skill {
  name: string;
}

export interface SkillCategory {
  title: string;
  icon: string;
  items: Skill[];
}

export interface SkillCategories {
  languages: SkillCategory;
  technologies: SkillCategory;
  databases: SkillCategory;
  coreCompetencies: SkillCategory;
}

export type SkillCategoryKey = keyof SkillCategories;

export interface ExperienceItem {
  title: string;
  company: string;
  companyUrl?: string;
  period: string;
  location: string;
  image: string;
  iconOnly?: boolean;
}

export interface AchievementItem {
  title: string;
  date: string;
  description: string;
  companyIcon?: string;
  link?: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  github?: string;
  url?: string;
  image?: string;
  media?: 'openNotifAnimation';
}

export interface TestimonialItem {
  name: string;
  role: string;
  company?: string;
  content: string;
  imageUrl?: string;
  linkedinUrl?: string;
}

export interface InpersonaFeature {
  icon: 'MessageSquare' | 'Brain' | 'Sparkles' | 'Zap';
  title: string;
  description: string;
}

export interface InpersonaToggle {
  label: string;
  shortLabel: string;
  tooltip: string;
  description: string;
}

export interface Config {
  site: {
    name: string;
    developerUrl: string;
  };
  navigation: NavItem[];
  hero: {
    name: string;
    subtitle: string;
  };
  about: {
    title: string;
    primary: string;
    secondary: string;
    image: string;
  };
  skills: {
    title: string;
    description: string;
    categories: SkillCategories;
  };
  experience: {
    title: string;
    items: ExperienceItem[];
  };
  achievements: {
    title: string;
    items: AchievementItem[];
  };
  projects: {
    title: string;
    items: ProjectItem[];
  };
  testimonials: {
    title: string;
    subtitle: string;
    rotationIntervalMs: number;
    truncationLength: number;
    items: TestimonialItem[];
  };
  contact: {
    title: string;
    description: string;
    ctaLabel: string;
    formId: string;
  };
  footer: {
    linkedin: string;
    twitter: string;
    github: string;
  };
  inpersona: {
    homeLink: string;
    loadingTitle: string;
    emptyStatePrompt: string;
    inputPlaceholder: string;
    readyButton: string;
    footerCredit: string;
    avatar: string;
    websocketPath: string;
    websocketPort: number;
    features: InpersonaFeature[];
    suggestions: string[];
    toggles: {
      knowledgeGraph: InpersonaToggle;
      hyde: InpersonaToggle;
    };
  };
}

const config = configJson as unknown as Config;

export default config;
