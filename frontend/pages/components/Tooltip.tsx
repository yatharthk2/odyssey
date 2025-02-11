import { useRouter } from 'next/router';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const router = useRouter();

  return (
    <div className="group relative inline-block">
      {children}
      <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible hover:opacity-100 hover:visible transition-all duration-300 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gradient-to-br from-purple-600 to-blue-600 text-white text-sm rounded-xl whitespace-nowrap shadow-lg">
        {text}
        <button 
          className="block mt-2 text-white underline hover:text-blue-200 transition-colors text-xs cursor-pointer w-full text-left"
          onClick={() => router.push('/inpersona/knowledgegraph')}
        >
          Interact with Knowledge Graph →
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2 border-4 border-transparent border-t-blue-600"></div>
        <div className="absolute h-2 w-full left-0 bottom-[-8px]"></div>
      </div>
    </div>
  );
};

export default Tooltip;
