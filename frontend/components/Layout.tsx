import React from 'react';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <main className="flex-grow transition-colors">
        {children}
      </main>
      <Footer />
    </div>
  );
}
