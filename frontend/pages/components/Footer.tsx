import { SiLinkedin, SiX, SiGithub } from 'react-icons/si';
import config from '../../types/config';
import { asIcon, type Icon } from '../../types/icons';

const socialLinks: { href: string; label: string; Icon: Icon }[] = [
  { href: config.footer.linkedin, label: 'LinkedIn', Icon: asIcon(SiLinkedin) },
  { href: config.footer.twitter, label: 'X (formerly Twitter)', Icon: asIcon(SiX) },
  { href: config.footer.github, label: 'GitHub', Icon: asIcon(SiGithub) },
].filter((link) => Boolean(link.href));

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-white dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="flex space-x-8 mb-4">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
            >
              <Icon className="w-6 h-6" />
            </a>
          ))}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {year} — Developed by{' '}
          <a
            href={config.site.developerUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {config.site.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
