import React from "react";
import config from "../index.json";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";

const Header = () => {
  const navigation = config.navigation;
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 border-b border-gray-200/20 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <nav className="flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.title} className="relative group">
                <a 
                  href={item.url}
                  onClick={(e) => handleClick(e, item.url)}
                  className="whitespace-nowrap font-medium text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {item.title}
                </a>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform" />
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