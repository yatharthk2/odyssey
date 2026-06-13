import { useReducedMotion } from 'framer-motion';

/**
 * Static architecture diagram for the Open-Notif project card, themed via
 * Tailwind fill/stroke classes so it follows light/dark mode. Exactly one
 * animated element — a dot traveling the pipeline — instead of the previous
 * ~30 simultaneous SMIL loops; it's omitted entirely under Reduce Motion.
 */
function Node({
  x,
  y,
  width,
  label,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={80}
        rx={12}
        strokeWidth={2}
        className="fill-white stroke-gray-300 dark:fill-gray-900 dark:stroke-gray-700"
      />
      <text
        x={x + width / 2}
        y={y + 48}
        textAnchor="middle"
        fontSize={26}
        fontWeight={600}
        className="fill-gray-800 dark:fill-gray-200"
      >
        {label}
      </text>
    </g>
  );
}

export default function OpenNotifAnimation() {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 900 500"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Open-Notif architecture: user request through Chalice API and SNS, fanning out over SQS and Lambda to call and email delivery"
    >
      <rect width="900" height="500" className="fill-gray-100 dark:fill-gray-950" />

      <text x={40} y={56} fontSize={22} className="fill-gray-500 font-mono">
        open-notif · event pipeline
      </text>

      {/* Flow edges */}
      <g strokeWidth={2} fill="none" className="stroke-gray-400 dark:stroke-gray-600">
        <path d="M 170 250 L 250 250" />
        <path d="M 430 250 L 510 250" />
        <path d="M 630 250 C 685 250 675 120 720 120" />
        <path d="M 630 250 C 685 250 675 380 720 380" />
      </g>

      {/* Branch annotations */}
      <g fontSize={20} textAnchor="middle" className="fill-gray-500 font-mono">
        <text x={672} y={166}>
          SQS · λ
        </text>
        <text x={672} y={346}>
          SQS · λ
        </text>
      </g>

      {/* Rendered before the nodes so the dot passes behind the boxes
          instead of sliding over their labels. */}
      {!reduceMotion && (
        <circle r={7} className="fill-gray-900 dark:fill-white">
          <animateMotion
            dur="5s"
            repeatCount="indefinite"
            path="M 170 250 L 630 250 C 685 250 675 120 720 120"
          />
        </circle>
      )}

      <Node x={40} y={210} width={130} label="User" />
      <Node x={250} y={210} width={180} label="Chalice API" />
      <Node x={510} y={210} width={120} label="SNS" />
      <Node x={720} y={80} width={150} label="Call" />
      <Node x={720} y={340} width={150} label="Email" />
    </svg>
  );
}
