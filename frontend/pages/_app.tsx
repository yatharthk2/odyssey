import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Geist, Geist_Mono } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '../context/ThemeContext';
import '../styles/globals.css';

// Self-hosted via next/font: zero external requests, auto-preload, and
// size-adjusted fallback metrics so the swap causes no layout shift.
const sans = Geist({ subsets: ['latin'], variable: '--font-sans' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
      </Head>
      {/* reducedMotion="user" disables framer transform/layout animations for
          visitors with OS-level Reduce Motion enabled; opacity fades remain. */}
      <MotionConfig reducedMotion="user">
        <div className={`${sans.variable} ${mono.variable} font-sans`}>
          <Component {...pageProps} />
        </div>
      </MotionConfig>
    </ThemeProvider>
  );
}
