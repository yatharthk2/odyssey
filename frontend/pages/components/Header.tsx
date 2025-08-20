import React, { useState } from "react";
import config from "../index.json";
import Link from "next/link";
import { motion } from "framer-motion"; // Add this import
import { useRouter } from 'next/router';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-50 relative supports-[backdrop-filter]:backdrop-blur-sm bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.title} className="relative group">
                {item.title === "Inpersona" ? (
                  <motion.a
                    href={item.url}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleClick(e, item.url)}
                    className="relative whitespace-nowrap font-medium px-3 py-1 rounded-full text-teal-600 max-w-[120px]"
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Smoother color changing glow effect */}
                    <motion.span 
                      className="absolute inset-0 rounded-full opacity-40 blur-xl"
                      animate={{
                        background: [
                          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)',
                          'linear-gradient(to right, #06b6d4, #14b8a6, #f59e0b)',
                          'linear-gradient(to right, #f59e0b, #06b6d4, #14b8a6)',
                          'linear-gradient(to right, #14b8a6, #06b6d4, #f59e0b)',
                          'linear-gradient(to right, #06b6d4, #f59e0b, #14b8a6)',
                          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)'
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
                          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)',
                          'linear-gradient(to right, #06b6d4, #14b8a6, #f59e0b)',
                          'linear-gradient(to right, #f59e0b, #06b6d4, #14b8a6)',
                          'linear-gradient(to right, #14b8a6, #06b6d4, #f59e0b)',
                          'linear-gradient(to right, #06b6d4, #f59e0b, #14b8a6)',
                          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)'
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
                          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)',
                          'linear-gradient(to right, #06b6d4, #14b8a6, #f59e0b)',
                          'linear-gradient(to right, #f59e0b, #06b6d4, #14b8a6)',
                          'linear-gradient(to right, #14b8a6, #06b6d4, #f59e0b)',
                          'linear-gradient(to right, #06b6d4, #f59e0b, #14b8a6)',
                          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                      }}
                    />
                    <span className="absolute inset-[1.5px] rounded-full bg-white" />
                    {/* Text content */}
                    <span className="relative">
                      ✨ {item.title}
                    </span>
                  </motion.a>
                ) : (
                  <>
                    <a 
                      href={item.url}
                      onClick={item.isDownload ? undefined : (e: React.MouseEvent<HTMLAnchorElement>) => handleClick(e, item.url)}
                      download={item.isDownload}
                      className="whitespace-nowrap font-medium text-gray-800 hover:text-teal-600 transition-colors"
                    >
                      {item.title}
                    </a>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-500 via-amber-500 to-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform" />
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* Theme toggle removed */}
        </div>

    {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                item.title === "Inpersona" ? (
                  <motion.a
                    key={item.title}
                    href={item.url}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      handleClick(e, item.url);
                      setIsMenuOpen(false);
                    }}
  className="relative inline-block whitespace-nowrap font-medium px-3 py-1 rounded-full text-teal-600 max-w-[120px]"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.span 
                      className="absolute inset-0 rounded-full opacity-40 blur-xl"
                      animate={{
                        background: [
          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)',
          'linear-gradient(to right, #06b6d4, #14b8a6, #f59e0b)',
          'linear-gradient(to right, #f59e0b, #06b6d4, #14b8a6)',
          'linear-gradient(to right, #14b8a6, #06b6d4, #f59e0b)',
          'linear-gradient(to right, #06b6d4, #f59e0b, #14b8a6)',
          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)'
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
          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)',
          'linear-gradient(to right, #06b6d4, #14b8a6, #f59e0b)',
          'linear-gradient(to right, #f59e0b, #06b6d4, #14b8a6)',
          'linear-gradient(to right, #14b8a6, #06b6d4, #f59e0b)',
          'linear-gradient(to right, #06b6d4, #f59e0b, #14b8a6)',
          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)'
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
          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)',
          'linear-gradient(to right, #06b6d4, #14b8a6, #f59e0b)',
          'linear-gradient(to right, #f59e0b, #06b6d4, #14b8a6)',
          'linear-gradient(to right, #14b8a6, #06b6d4, #f59e0b)',
          'linear-gradient(to right, #06b6d4, #f59e0b, #14b8a6)',
          'linear-gradient(to right, #14b8a6, #f59e0b, #06b6d4)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                      }}
                    />
                    <span className="absolute inset-[1.5px] rounded-full bg-white" />
                    <span className="relative">
                      ✨ {item.title}
                    </span>
                  </motion.a>
                ) : (
                  <a
                    key={item.title}
                    href={item.url}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      handleClick(e, item.url);
                      setIsMenuOpen(false);
                    }}
  className="text-gray-800 hover:text-teal-600"
                  >
                    {item.title}
                  </a>
                )
              ))}
            </div>
          </div>
        )}
      </div>
  {/* Gradient bottom border to match Hero palette */}
  <div className="pointer-events-none absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-teal-500 via-amber-500 to-cyan-500 opacity-70" />
    </header>
  );
};

export default Header;