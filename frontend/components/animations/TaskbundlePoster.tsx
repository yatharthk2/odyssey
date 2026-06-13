/**
 * Project poster for Taskbundle. The project posters are the site's one
 * full-color exception to the monochrome theme. This one is a realistic
 * terminal session of the actual CLI loop (init → validate → run →
 * RESOLVED) on a deep indigo backdrop — authentic to what Taskbundle is, and
 * legible at card size. preserveAspectRatio="slice" keeps the backdrop
 * edge-to-edge regardless of the card's aspect ratio.
 */
const MONO = 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace';

export default function TaskbundlePoster() {
  return (
    <svg
      viewBox="0 0 960 520"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Taskbundle terminal session: task init builds the image, task validate confirms the baseline, task run reports RESOLVED."
      style={{ fontFamily: MONO }}
    >
      <defs>
        <linearGradient id="tb-bg" x1="0" y1="0" x2="960" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#171633" />
        </linearGradient>
        <radialGradient id="tb-glow" cx="0.84" cy="0.16" r="0.7">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <filter id="tb-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="14" stdDeviation="20" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Backdrop (oversized so slice never reveals a gap) */}
      <rect x="-60" y="-60" width="1080" height="640" fill="url(#tb-bg)" />
      <rect x="-60" y="-60" width="1080" height="640" fill="url(#tb-glow)" />

      {/* Terminal window */}
      <g filter="url(#tb-shadow)">
        <rect x="74" y="78" width="812" height="372" rx="18" fill="#0c0c15" />
        <rect x="74" y="78" width="812" height="372" rx="18" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1.5" />
        {/* title bar */}
        <rect x="74" y="78" width="812" height="50" rx="18" fill="#17172b" />
        <rect x="74" y="110" width="812" height="18" fill="#17172b" />
        <rect x="75" y="79" width="810" height="1.5" fill="#ffffff" fillOpacity="0.06" />
      </g>

      <circle cx="108" cy="103" r="7" fill="#ff5f57" />
      <circle cx="132" cy="103" r="7" fill="#febc2e" />
      <circle cx="156" cy="103" r="7" fill="#28c840" />
      <text x="480" y="109" textAnchor="middle" fontSize="20" fill="#8b8bb0">
        taskbundle · task run
      </text>

      {/* Session */}
      <g fontSize="29">
        <text x="112" y="194">
          <tspan fill="#818cf8">$</tspan>
          <tspan fill="#e2e8f0"> task init </tspan>
          <tspan fill="#67e8f9">bundle/</tspan>
        </text>
        <text x="864" y="194" textAnchor="end" fill="#34d399">✓ image built</text>

        <text x="112" y="252">
          <tspan fill="#818cf8">$</tspan>
          <tspan fill="#e2e8f0"> task validate</tspan>
        </text>
        <text x="864" y="252" textAnchor="end" fill="#94a3b8">
          p2p <tspan fill="#34d399">✓</tspan> · f2p <tspan fill="#34d399">✓</tspan>
        </text>

        <text x="112" y="310">
          <tspan fill="#818cf8">$</tspan>
          <tspan fill="#e2e8f0"> task run </tspan>
          <tspan fill="#67e8f9">bundle/</tspan>
        </text>
        <text x="864" y="310" textAnchor="end" fontWeight="700" fill="#34d399">✓ RESOLVED</text>

        <text x="112" y="384">
          <tspan fill="#818cf8">$</tspan>
          <tspan fill="#e2e8f0"> ▋</tspan>
        </text>
      </g>
    </svg>
  );
}
