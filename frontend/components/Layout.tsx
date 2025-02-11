import React from 'react';
import Header from '../pages/components/Header';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      <Header />
      <main className="transition-colors">
        {children}
      </main>
    </div>
  );
}
