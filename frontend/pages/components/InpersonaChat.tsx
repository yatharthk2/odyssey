'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Grape, Search } from 'lucide-react';
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
      const ws = new WebSocket('ws://localhost:8000/chat');
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
    <div className="relative flex flex-col w-full h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 overflow-hidden">
      {/* Navigation Area */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center z-10">
        <Link 
          href="/" 
          className="text-sm sm:text-base whitespace-nowrap font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
        >
          Home
        </Link>
        <ThemeToggle />
      </div>

      {/* Connection Status */}
      {isConnecting && (
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 text-xs sm:text-sm text-gray-600">
          Connecting...
        </div>
      )}

      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pt-16 sm:pt-24 pb-32 sm:pb-40 w-full scrollbar">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 sm:space-y-6 px-4">
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

      {/* Message Input Form */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white dark:from-gray-900 to-transparent pt-10 sm:pt-20 pb-4 sm:pb-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-2 sm:px-4 w-full">
          <div className="flex flex-col gap-2">
            {/* Toggle Buttons */}
            <div className="flex flex-wrap gap-2 justify-end px-2">
              <Tooltip text="More accurate, Less detailed">
                <button
                  type="button"
                  onClick={() => setUseKnowledgeGraph(!useKnowledgeGraph)}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-all ${
                    useKnowledgeGraph
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Grape size={12} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Knowledge Graph</span>
                  <span className="sm:hidden">KG</span>
                </button>
              </Tooltip>
              <Tooltip text="Friendly, Detailed, Prone to Hallucination">
                <button
                  type="button"
                  onClick={() => setUseHydeQuery(!useHydeQuery)}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-all ${
                    useHydeQuery
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Search size={12} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Hyde Query</span>
                  <span className="sm:hidden">HyDE</span>
                </button>
              </Tooltip>
            </div>

            {/* Input Bar */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl px-3 sm:px-4 py-2 shadow-lg ring-1 ring-gray-100 dark:ring-gray-700 hover:ring-blue-200 dark:hover:ring-blue-700 transition-all">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-lg py-1 sm:py-2"
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
                className="ml-2 p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:opacity-90 transition-opacity shadow-md"
              >
                <Send size={20} className="sm:w-6 sm:h-6 text-white" />
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
    </div>
  );
}