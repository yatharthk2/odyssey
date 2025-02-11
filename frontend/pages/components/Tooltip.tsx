import { useRouter } from 'next/router';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const router = useRouter();

  return (
    <div className="group relative inline-block">
      {children}
      <div className="pointer-events-auto absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-3 py-2 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-lg">
        {text}
        <button 
          className="block mt-2 text-white underline hover:text-blue-200 transition-colors text-xs cursor-pointer w-full text-left"
          onClick={() => router.push('/inpersona/knowledgegraph')}
        >
          Interact with Knowledge Graph →
        </button>
        <svg className="absolute left-0 top-full h-2 w-full" x="0px" y="0px" viewBox="0 0 255 255">
          <polygon className="fill-purple-600" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </div>
    </div>
  );
}
