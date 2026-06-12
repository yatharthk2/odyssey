import Head from 'next/head';

export const SITE_URL = 'https://www.yatharthk.com';

const OG_IMAGE = `${SITE_URL}/og.png`;

interface SeoProps {
  title: string;
  description: string;
  /** Canonical path for this page, e.g. "/inpersona". Defaults to the homepage. */
  path?: string;
  noindex?: boolean;
}

/**
 * Per-page metadata: title, description, canonical, and Open Graph / Twitter
 * cards so shared links unfurl with a real preview. Every page should render
 * one of these — _document.tsx only carries the site-wide icons/theme-color.
 */
export default function Seo({ title, description, path = '/', noindex = false }: SeoProps) {
  const url = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Yatharth Kapadia" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Head>
  );
}
