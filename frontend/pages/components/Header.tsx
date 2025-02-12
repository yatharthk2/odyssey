import React from "react";
import config from "../index.json";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { motion } from "framer-motion"; // Add this import
import { useRouter } from 'next/router';

const Header = () => {
  const router = useRouter();
  const navigation = config.navigation;
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (href === '/inpersona') {
      router.push('/loading');
    } else {
      router.push(href);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 border-b border-gray-200/20 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <nav className="flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.title} className="relative group">
                {item.title === "Inpersona" ? (
                  <motion.a
                    href={item.url}
                    onClick={(e) => handleClick(e, item.url)}
                    className="relative whitespace-nowrap font-medium px-4 py-1.5 rounded-full text-purple-600 dark:text-purple-400"
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Smoother color changing glow effect */}
                    <motion.span 
                      className="absolute inset-0 rounded-full opacity-40 blur-xl"
                      animate={{
                        background: [
                          'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)',
                          'linear-gradient(to right, #22C55E, #EAB308, #EC4899)',
                          'linear-gradient(to right, #3B82F6, #F43F5E, #8B5CF6)',
                          'linear-gradient(to right, #EAB308, #8B5CF6, #22C55E)',
                          'linear-gradient(to right, #F43F5E, #22C55E, #3B82F6)',
                          'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                      }}
                    />
                    <motion.span 
                      className="absolute -inset-0.5 rounded-full opacity-50 blur-md"
                      animate={{
                        background: [
                          'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)',
                          'linear-gradient(to right, #22C55E, #EAB308, #EC4899)',
                          'linear-gradient(to right, #3B82F6, #F43F5E, #8B5CF6)',
                          'linear-gradient(to right, #EAB308, #8B5CF6, #22C55E)',
                          'linear-gradient(to right, #F43F5E, #22C55E, #3B82F6)',
                          'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                      }}
                    />
                    <motion.span 
                      className="absolute inset-0 rounded-full"
                      animate={{
                        background: [
                          'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)',
                          'linear-gradient(to right, #22C55E, #EAB308, #EC4899)',
                          'linear-gradient(to right, #3B82F6, #F43F5E, #8B5CF6)',
                          'linear-gradient(to right, #EAB308, #8B5CF6, #22C55E)',
                          'linear-gradient(to right, #F43F5E, #22C55E, #3B82F6)',
                          'linear-gradient(to right, #9333EA, #EC4899, #3B82F6)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                      }}
                    />
                    <span className="absolute inset-[1.5px] rounded-full bg-white dark:bg-gray-900" />
                    {/* Text content */}
                    <span className="relative">
                      ✨ {item.title}
                    </span>
                  </motion.a>
                ) : (
                  <>
                    <a 
                      href={item.url}
                      onClick={item.isDownload ? undefined : (e) => handleClick(e, item.url)}
                      download={item.isDownload}
                      className="whitespace-nowrap font-medium text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {item.title}
                    </a>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform" />
                  </>
                )}
              </div>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;