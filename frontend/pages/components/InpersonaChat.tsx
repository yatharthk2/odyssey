'use client';

import { useState } from 'react';
import { Send, Grape, Search } from 'lucide-react';
import Link from 'next/link';
import Tooltip from './Tooltip';
import TextRotator from './TextRotator';

interface Message {
  content: string;
  isUser: boolean;
}

export default function InpersonaChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [useKnowledgeGraph, setUseKnowledgeGraph] = useState(false);
  const [useHydeQuery, setUseHydeQuery] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = { content: message, isUser: true };
    const aiMessage: Message = { 
      content: "This is a fixed AI response for demonstration purposes. In a real implementation, this would come from an API call to your LLM service.", 
      isUser: false 
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setMessage('');
  };

  return (
    <div className="relative flex flex-col w-full h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      {/* Home Button */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 whitespace-nowrap font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
      >
        Home
      </Link>

      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-32 w-full scrollbar">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
                <span className="text-3xl font-bold text-white">C</span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-gray-600 mb-2">How can I help you today?</p>
                <TextRotator />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl transition-all ${
                      msg.isUser 
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Input Form */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white to-transparent pt-16 pb-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 w-full">
          <div className="flex flex-col gap-2">
            {/* Toggle Buttons */}
            <div className="flex gap-2 justify-end px-2">
              <Tooltip text="Use Knowledge Graph to enhance responses with structured information and relationships from a comprehensive knowledge base">
                <button
                  type="button"
                  onClick={() => setUseKnowledgeGraph(!useKnowledgeGraph)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                    useKnowledgeGraph
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Grape size={14} />
                  <span>Knowledge Graph</span>
                </button>
              </Tooltip>
              <Tooltip text="Use Hypothetical Document Embeddings (HyDE) to improve query understanding and generate more accurate responses">
                <button
                  type="button"
                  onClick={() => setUseHydeQuery(!useHydeQuery)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                    useHydeQuery
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300'
                  }`}
                >
                  <Search size={14} />
                  <span>Hyde Query</span>
                </button>
              </Tooltip>
            </div>
            {/* Input Bar */}
            <div className="flex items-center bg-white rounded-xl px-4 py-2 shadow-lg ring-1 ring-gray-100 hover:ring-blue-200 transition-all">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-lg py-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
                className="ml-2 p-2 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:opacity-90 transition-opacity shadow-md"
              >
                <Send size={24} className="text-white" />
              </button>
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-3">
            InPersona AI · Always learning
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
      `}</style>
    </div>
  );
}