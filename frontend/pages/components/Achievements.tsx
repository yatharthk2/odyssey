import React from 'react';
import { motion } from 'framer-motion';
import config from '../index.json';
import { SiDell, SiNvidia, SiAmazon } from 'react-icons/si';

// Cast each icon to React.ComponentType to resolve the type issues
const SafeSiDell = SiDell as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const SafeSiNvidia = SiNvidia as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const SafeSiAmazon = SiAmazon as React.ComponentType<React.SVGProps<SVGSVGElement>>;

const companyIconMap: { [key: string]: React.ReactElement } = {
  dell: <SafeSiDell className="text-blue-700 dark:text-blue-400 text-2xl" />,
  nvidia: <SafeSiNvidia className="text-green-600 dark:text-green-400 text-2xl" />,
  amazon: <SafeSiAmazon className="text-orange-500 dark:text-orange-400 text-2xl" />
};

const Achievements = () => {
  const { achievements } = config;
  
  return (
    <motion.section 
      id="achievements"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-12 sm:py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl my-8 sm:my-20 shadow-xl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-16 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          {achievements.title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {achievements.items.map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 relative overflow-hidden group flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-bl-full transform translate-x-5 -translate-y-5" />
              
              <div className="flex items-start mb-4">
                {achievement.companyIcon && (
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-600 mr-4">
                    {companyIconMap[achievement.companyIcon]}
                  </div>
                )}
                
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{achievement.date}</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">
                {achievement.description}
              </p>
              
              {achievement.link && (
                <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-600 text-right">
                  <a 
                    href={achievement.link} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                  >
                    Learn more
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default Achievements;
