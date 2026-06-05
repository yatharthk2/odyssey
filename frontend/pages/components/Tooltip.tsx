import { type ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        role="tooltip"
        className="invisible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-xl bg-gray-900 dark:bg-gray-700 px-4 py-3 text-sm text-white opacity-0 shadow-lg transition-all duration-300 group-hover:visible group-hover:opacity-100"
      >
        {text}
        <div className="absolute left-1/2 top-full -mt-2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        <div className="absolute left-0 bottom-[-8px] h-2 w-full" />
      </div>
    </div>
  );
}
