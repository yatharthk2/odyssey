import React from "react";
import config from "../index.json";

const Footer = () => {
  const footer = config.footer;
  const getYear = () => {
    return new Date().getFullYear();
  };

  return (
    <footer className="w-full bg-white dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="flex space-x-6 mb-4">
            {footer.twitter && (
              <a
                href={footer.twitter}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <i className="devicon-twitter-original text-2xl"></i>
              </a>
            )}
            {footer.linkedin && (
              <a
                href={footer.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <i className="devicon-linkedin-plain text-2xl"></i>
              </a>
            )}
            {footer.github && (
              <a
                href={footer.github}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <i className="devicon-github-original text-2xl"></i>
              </a>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {getYear()} - Developed by{" "}
            <a 
              href="https://www.dylanarveson.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Yatharth Kapadia
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;