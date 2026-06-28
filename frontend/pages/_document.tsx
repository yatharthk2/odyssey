import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        {/* Anti-FOUC: set the theme class on <html> before first paint so the
            page never renders in the default (light) theme and then flips to
            dark on hydration. That flip animated the cards' transition-colors
            light→dark while titles flipped instantly, flashing the text. Must
            mirror ThemeContext's logic exactly (localStorage 'theme', else the
            OS preference) or the two would briefly disagree. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if((t||(d?'dark':'light'))==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fafafa" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
      </Head>
      <body className="text-black">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
