import { useEffect, useState } from 'react';

/**
 * Returns true when the viewport is narrower than `breakpoint` (default 768px).
 * Re-runs on resize. Defaults to false on the server / first render so SSR markup
 * matches the desktop layout; flips to the real value after hydration.
 */
export default function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}
