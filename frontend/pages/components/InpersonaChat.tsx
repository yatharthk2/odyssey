'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Grape, Search, Info } from 'lucide-react';
import Link from 'next/link';
import Tooltip from './Tooltip';
// Remove TextRotator import since we're replacing it
// import TextRotator from './TextRotator';
// Dark mode removed

interface Message {
  content: string;
  isUser: boolean;
  complete?: boolean;
  loading?: boolean;
}

export default function InpersonaChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [useKnowledgeGraph, setUseKnowledgeGraph] = useState(false);
  const [useHydeQuery, setUseHydeQuery] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Update suggestion questions - limit to top 4
  const suggestionQuestions = [
    "Tell me about your background",
    "What are your technical skills?",
    "What projects have you worked on?",
    "What's your educational background?"
  ];

  // Function to handle suggestion tile clicks
  const handleSuggestionClick = (question: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isLoading) return;
    
    // Add user message
    const userMessage: Message = { content: question, isUser: true, complete: true };
    // Add initial AI message with loading state
    const loadingMessage: Message = { content: "", isUser: false, loading: true };
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    // Prepare and send the query
    const query = {
      question: question,
      vector_store: useKnowledgeGraph ? "KG" : "vector",
      query_transformation: useHydeQuery ? "HyDE" : null
    };

    wsRef.current.send(JSON.stringify(query));
  };

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
  <div className="relative flex flex-col w-full h-[100dvh] bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      {/* Navigation Area - Reorganized */}
  <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm py-2 px-4 flex justify-between items-center z-50">
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
            <span className="text-xs text-gray-600">
              {wsRef.current?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {/* Theme toggle removed */}
        </div>
      </div>

      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pt-14 pb-32 w-full scrollbar">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-240px)] space-y-4 sm:space-y-6 px-4 mt-2 sm:mt-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-lg animate-float">
                <img
                  src="/Newyork_Dumbo_300x300.jpg"
                  alt="Yatharth"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-light text-gray-600 mb-4">
                  How can I help you today?
                </p>
                {/* Display only 4 suggestion tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {suggestionQuestions.slice(0, 4).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(question)}
                      className="bg-white p-3 rounded-xl text-left text-sm sm:text-base text-gray-700 shadow-sm hover:shadow-md border border-gray-200 transition-all hover:border-purple-300 hover:bg-gray-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
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
            : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    {msg.isUser ? (
                      <p className="text-sm sm:text-base leading-relaxed">{msg.content}</p>
                    ) : (
                      // Changed to use dangerouslySetInnerHTML for HTML content
                      <div 
                        className={`html-content text-sm sm:text-base leading-relaxed ${msg.loading ? 'typing-container' : ''}`}
                        dangerouslySetInnerHTML={{ __html: msg.content || '&nbsp;' }}
                      />
                    )}
                    {msg.loading && (
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input Form - Updated for better mobile handling */}
  <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white to-transparent pt-6 pb-4">
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
                        ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-md'
            : 'bg-gradient-to-r from-white to-gray-100 text-gray-700 border border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <Grape size={16} />
                    <span>Use Knowledge Graph</span>
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
                      ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-md'
            : 'bg-gradient-to-r from-white to-gray-100 text-gray-700 border border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <Grape size={12} />
                  <span>Use KG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseHydeQuery(!useHydeQuery)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                    useHydeQuery
                      ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md'
            : 'bg-gradient-to-r from-white to-gray-100 text-gray-700 border border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <Search size={12} />
                  <span>Use HyDE</span>
                </button>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-1 rounded-full bg-gray-100 border border-gray-200"
                >
                  <Info size={14} className="text-gray-600" />
                </button>
              </div>

              {/* Info Modal for Mobile */}
              {showInfo && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:hidden">
                  <div className="bg-white rounded-xl p-4 max-w-xs w-full shadow-lg border border-gray-200">
                    <h3 className="font-semibold mb-2 text-gray-800">Search Options</h3>
                    <div className="text-sm mb-4 space-y-3 text-gray-600">
                      <div>
                        <p className="font-medium mb-1">KG (Knowledge Graph):</p>
                        <p>More accurate but less detailed results.</p>
                        {/* Removing the Knowledge Graph link */}
                      </div>
                      <div>
                        <p className="font-medium mb-1">HyDE:</p>
                        <p>Friendly and detailed results, but may occasionally provide inaccurate information.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInfo(false)}
                      className="w-full py-2 bg-gray-100 rounded-lg text-sm text-gray-800 hover:bg-gray-200 transition-colors"
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
                        ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md'
            : 'bg-gradient-to-r from-white to-gray-100 text-gray-700 border border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <Search size={16} />
                    <span>Use Hyde Query</span>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Input Bar - Added touch-action-manipulation for better mobile handling */}
      <div className="flex items-center bg-white rounded-xl px-3 py-2 shadow-lg ring-1 ring-gray-100 touch-action-manipulation">
              <input
                type="text"
                placeholder="Ask me anything..."
        className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base py-1"
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
        
        /* Button hover effects */
        button {
          transition: all 0.2s ease;
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        button:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Global CSS for mobile input zoom prevention and HTML content styling */}
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
        
        /* New typing indicator animation (three dots) */
        .typing-indicator {
          display: inline-flex;
          align-items: center;
          margin-top: 4px;
          min-height: 18px;
        }
        
        .typing-indicator span {
          height: 8px;
          width: 8px;
          margin: 0 2px;
          background-color: rgba(107, 114, 128, 0.7);
          border-radius: 50%;
          display: inline-block;
          opacity: 0.4;
        }
        
        .dark .typing-indicator span {
          background-color: rgba(156, 163, 175, 0.7);
        }
        
        .typing-indicator span:nth-child(1) {
          animation: bounce 1s infinite 0.2s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation: bounce 1s infinite 0.4s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation: bounce 1s infinite 0.6s;
        }
        
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }
        
        /* Shimmer effect for loading content */
        .typing-container {
          position: relative;
          overflow: hidden;
        }
        
        .typing-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
        }
        
        .dark .typing-container::after {
          background: linear-gradient(
            90deg,
            rgba(30, 41, 59, 0) 0%,
            rgba(30, 41, 59, 0.2) 50%,
            rgba(30, 41, 59, 0) 100%
          );
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        /* New character appear animation */
        .html-content {
          position: relative;
        }
        
        .html-content p, .html-content li, .html-content h3 {
          animation: slide-up-fade 0.4s ease forwards;
          opacity: 0;
          transform: translateY(8px);
        }
        
        .html-content p:nth-child(1) { animation-delay: 0.1s; }
        .html-content p:nth-child(2) { animation-delay: 0.2s; }
        .html-content p:nth-child(3) { animation-delay: 0.3s; }
        .html-content p:nth-child(n+4) { animation-delay: 0.4s; }
        
        .html-content li:nth-child(odd) { animation-delay: 0.15s; }
        .html-content li:nth-child(even) { animation-delay: 0.25s; }
        
        @keyframes slide-up-fade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* HTML content styling */
        .html-content p {
          margin-bottom: 0.75rem;
        }
        
        .html-content p:last-child {
          margin-bottom: 0;
        }
        
        .html-content ul, .html-content ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        
        .html-content li {
          margin-bottom: 0.5rem;
        }
        
        .html-content h3 {
          font-weight: 600;
          margin: 1.25rem 0 0.75rem 0;
          font-size: 1.1em;
        }
        
        .html-content strong {
          font-weight: 600;
        }
        
        .html-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .dark .html-content a {
          color: #60a5fa;
        }
        
        .html-content hr {
          margin: 1.5rem 0;
          border-color: rgba(209, 213, 219, 0.3);
        }
        
        .dark .html-content hr {
          border-color: rgba(75, 85, 99, 0.5);
        }

        /* Add style for dark hover state */
        .dark .dark\\:hover\\:bg-gray-750:hover {
          background-color: #2d3748;
        }
      `}</style>
    </div>
  );
}