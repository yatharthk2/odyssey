import { type ReactNode } from 'react';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <Header />
      <main className="flex-grow transition-colors">{children}</main>
      <Footer />
    </div>
  );
}
