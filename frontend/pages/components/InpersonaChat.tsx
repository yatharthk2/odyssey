'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Grape, Search, Info } from 'lucide-react';
import Link from 'next/link';
import Tooltip from './Tooltip';
import TextRotator from './TextRotator';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

interface Message {
  content: string;
  isUser: boolean;
  complete?: boolean;
  loading?: boolean;
}

export default function InpersonaChat() {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [useKnowledgeGraph, setUseKnowledgeGraph] = useState(false);
  const [useHydeQuery, setUseHydeQuery] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      setIsConnecting(true);
      // Changed URL to use dynamic host instead of hardcoded localhost
      const host = window.location.hostname;
      const ws = new WebSocket(`wss://${host}:8000/chat`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        wsRef.current = null;
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setIsLoading(false);
          setMessages(prev => {
            const newMessages = prev.slice(0, -1); // Remove loading message
            return [...newMessages, { content: `Error: ${data.error}`, isUser: false, complete: true }];
          });
          return;
        }

        if (data.type === 'chunk') {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (!lastMessage || lastMessage.isUser || lastMessage.complete) {
              return [...prev.slice(0, -1), { content: data.content, isUser: false, loading: true }];
            } else {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + data.content,
                loading: true
              };
              return newMessages;
            }
          });
        } else if (data.type === 'complete') {
          setIsLoading(false);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.complete = true;
              lastMessage.loading = false;
            }
            return newMessages;
          });
        }
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Add useEffect to handle mobile viewport
  useEffect(() => {
    // Prevent viewport height changes when keyboard opens
    const metaViewport = document.querySelector('meta[name=viewport]');
    metaViewport?.setAttribute('content', 'height=' + window.innerHeight + 'px, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    
    return () => {
      metaViewport?.setAttribute('content', 'width=device-width, initial-scale=1.0');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Add user message
    const userMessage: Message = { content: message, isUser: true, complete: true };
    // Add initial AI message with loading state
    const loadingMessage: Message = { content: "", isUser: false, loading: true };
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    // Prepare and send the query
    const query = {
      question: message,
      vector_store: useKnowledgeGraph ? "KG" : "vector",
      query_transformation: useHydeQuery ? "HyDE" : null
    };

    wsRef.current.send(JSON.stringify(query));
    setMessage('');
  };

  return (
    <div className="relative flex flex-col w-full h-[100dvh] bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 overflow-hidden">
      {/* Navigation Area - Reorganized */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 px-4 flex justify-between items-center z-50">
        <Link 
          href="/" 
          className="text-sm sm:text-base whitespace-nowrap font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
        >
          Home
        </Link>
        
        {/* Status and Theme grouped together */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              wsRef.current?.readyState === WebSocket.OPEN ? 'bg-green-500' : 'bg-red-500'
            }`}/>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {wsRef.current?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pt-14 pb-32 w-full scrollbar">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-240px)] space-y-4 sm:space-y-6 px-4 mt-2 sm:mt-4"> {/* Adjusted min-height and reduced margins further */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-lg animate-float">
                <img
                  src="/Newyork_Dumbo_300x300.jpg"
                  alt="Yatharth"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-light text-gray-600 dark:text-gray-300 mb-2">
                  How can I help you today?
                </p>
                <TextRotator />
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div 
                    className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-4 rounded-2xl transition-all ${
                      msg.isUser 
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md'
                    }`}
                  >
                    <p className="text-sm sm:text-base leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input Form - Updated for better mobile handling */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white dark:from-gray-900 to-transparent pt-6 pb-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-2 sm:px-4 w-full">
          <div className="flex flex-col gap-2">
            {/* Toggle Buttons */}
            <div className="flex flex-wrap gap-2 justify-end px-2 mb-2">
              {/* Desktop Tooltip */}
              <div className="hidden sm:block">
                <Tooltip text="More accurate, Less detailed">
                  <button
                    type="button"
                    onClick={() => setUseKnowledgeGraph(!useKnowledgeGraph)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                      useKnowledgeGraph
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    <Grape size={16} />
                    <span>Knowledge Graph</span>
                  </button>
                </Tooltip>
              </div>

              {/* Mobile Version with Info Button */}
              <div className="flex sm:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseKnowledgeGraph(!useKnowledgeGraph)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                    useKnowledgeGraph
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Grape size={12} />
                  <span>KG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseHydeQuery(!useHydeQuery)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                    useHydeQuery
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Search size={12} />
                  <span>HyDE</span>
                </button>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <Info size={14} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Info Modal for Mobile */}
              {showInfo && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:hidden">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 max-w-xs w-full shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Search Options</h3>
                    <div className="text-sm mb-4 space-y-3 text-gray-600 dark:text-gray-300">
                      <div>
                        <p className="font-medium mb-1">KG (Knowledge Graph):</p>
                        <p>More accurate but less detailed results.</p>
                        <a 
                          href="/inpersona/knowledgegraph" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                        >
                          View Knowledge Graph →
                        </a>
                      </div>
                      <div>
                        <p className="font-medium mb-1">HyDE:</p>
                        <p>Friendly and detailed results, but may occasionally provide inaccurate information.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInfo(false)}
                      className="w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Similar pattern for HyDE button... */}
              {/* Desktop Tooltip */}
              <div className="hidden sm:block">
                <Tooltip text="Friendly, Detailed, Prone to Hallucination">
                  <button
                    type="button"
                    onClick={() => setUseHydeQuery(!useHydeQuery)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                      useHydeQuery
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    <Search size={16} />
                    <span>Hyde Query</span>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Input Bar - Added touch-action-manipulation for better mobile handling */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg ring-1 ring-gray-100 dark:ring-gray-700 touch-action-manipulation">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-base py-1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <button 
                type="submit"
                className="ml-2 p-1.5 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:opacity-90 transition-opacity shadow-md"
                disabled={!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isLoading || !message.trim()}
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3">
            InPersona AI · Designed by Yatharth Kapadia
          </p>
        </form>
      </div>

      {/* Custom Scrollbar Styling */}
      <style jsx>{`
        .scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9CA3AF transparent;
        }

        .scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar::-webkit-scrollbar-thumb {
          background-color: #9CA3AF;
          border-radius: 4px;
        }

        .scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #6B7280;
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }
          50% {
            transform: translateY(-20px);
            box-shadow: 0 25px 30px rgba(0, 0, 0, 0.1);
          }
          100% {
            transform: translateY(0px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Global CSS for mobile input zoom prevention */}
      <style jsx global>{`
        @supports (-webkit-touch-callout: none) {
          .h-screen {
            height: -webkit-fill-available;
          }
        }
        
        body {
          overscroll-behavior: none;
        }
        
        @media screen and (max-width: 640px) {
          input, textarea, select {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}