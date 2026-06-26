import { useState, type MouseEvent } from 'react';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import InpersonaNavLink from '../../components/primitives/InpersonaNavLink';
import config, { type NavItem } from '../../types/config';

const INPERSONA_LANDING = '/loading';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const navigation = config.navigation;

  const navigateTo = (href: string) => {
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else if (href === '/inpersona') {
      router.push(INPERSONA_LANDING);
    } else {
      router.push(href);
    }
  };

  const handleNavClick =
    (item: NavItem, closeMenu = false) =>
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      navigateTo(item.url);
      if (closeMenu) setIsMenuOpen(false);
    };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 border-b border-gray-200/20 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) =>
              item.title === 'Inpersona' ? (
                <InpersonaNavLink
                  key={item.title}
                  label={item.title}
                  href={item.url}
                  onClick={handleNavClick(item)}
                />
              ) : (
                <NavLink key={item.title} item={item} onClick={handleNavClick(item)} />
              )
            )}
          </nav>

          <ThemeToggle />
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) =>
                item.title === 'Inpersona' ? (
                  <InpersonaNavLink
                    key={item.title}
                    label={item.title}
                    href={item.url}
                    onClick={handleNavClick(item, true)}
                    variant="mobile"
                  />
                ) : (
                  <a
                    key={item.title}
                    href={item.url}
                    onClick={handleNavClick(item, true)}
                    className="text-gray-700 dark:text-gray-300 hover:text-aurora-600 dark:hover:text-aurora-400 transition-colors"
                  >
                    {item.title}
                  </a>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <div className="group relative">
      <a
        href={item.url}
        onClick={onClick}
        className="whitespace-nowrap font-medium text-gray-700 dark:text-gray-300 hover:text-aurora-600 dark:hover:text-aurora-400 transition-colors"
      >
        {item.title}
      </a>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-aurora-600 dark:bg-aurora-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </div>
  );
}
