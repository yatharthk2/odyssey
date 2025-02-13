'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function KnowledgeGraph() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        console.log('Knowledge Graph loaded');
      };
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Enhanced Navigation */}
      <nav className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/inpersona" 
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent font-bold hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5 stroke-purple-600 dark:stroke-purple-400" />
              <span>Back to Chat</span>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Knowledge Graph Explorer
            </h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      {/* Graph Container with Shadow and Border */}
      <div className="flex-1 w-full p-4">
        <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-200/20 dark:border-gray-700/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <iframe
            ref={iframeRef}
            src="/kg.html"
            className="w-full h-[calc(100vh-6rem)]"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Interactive Knowledge Graph Visualization</p>
      </div>
    </div>
  );
}
