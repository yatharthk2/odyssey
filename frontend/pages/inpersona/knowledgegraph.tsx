'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

export default function KnowledgeGraph() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        console.log('Knowledge Graph loaded');
      };
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Enhanced Navigation */}
      <nav className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link 
              href="/inpersona" 
              className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent font-bold hover:opacity-80 transition-opacity text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-purple-600 dark:stroke-purple-400" />
              <span>Back to Chat</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent hidden sm:block">
              Knowledge Graph Explorer
            </h1>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Graph Container with Shadow and Border */}
      <div className="flex-1 w-full p-2 sm:p-4">
        <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-200/20 dark:border-gray-700/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <iframe
            ref={iframeRef}
            src="/kg.html"
            className="w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)]"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* Mobile Title (shown only on small screens) */}
      <div className="sm:hidden text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        Knowledge Graph Explorer
      </div>

      {/* Footer Info */}
      <div className="text-center py-2 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        <p className="hidden sm:block">Interactive Knowledge Graph Visualization</p>
        <p className="sm:hidden">Pinch to zoom · Double tap to focus</p>
      </div>
    </div>
  );
}
