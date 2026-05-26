'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Info, Network, Search, Send } from 'lucide-react';
import Tooltip from './Tooltip';
import ThemeToggle from '../../components/ThemeToggle';
import config from '../../types/config';

interface Message {
  content: string;
  isUser: boolean;
  complete?: boolean;
  loading?: boolean;
}

interface ChatQuery {
  question: string;
  vector_store: 'KG' | 'vector';
  query_transformation: 'HyDE' | null;
}

const RECONNECT_DELAY_MS = 3000;

export default function InpersonaChat() {
  const [draftMessage, setDraftMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [useKnowledgeGraph, setUseKnowledgeGraph] = useState(false);
  const [useHydeQuery, setUseHydeQuery] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { inpersona } = config;
  const { knowledgeGraph: kgToggle, hyde: hydeToggle } = inpersona.toggles;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lock the visual viewport so the iOS keyboard doesn't trigger reflow that
  // jumps the chat. Restore the default viewport on unmount so the rest of the
  // site stays responsive.
  useEffect(() => {
    const meta = document.querySelector('meta[name=viewport]');
    const original = meta?.getAttribute('content');
    meta?.setAttribute(
      'content',
      `height=${window.innerHeight}px, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0`
    );
    return () => {
      meta?.setAttribute('content', original ?? 'width=device-width, initial-scale=1.0');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;

      const url = `wss://${window.location.hostname}:${inpersona.websocketPort}${inpersona.websocketPath}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
      ws.onerror = (event) => {
        // eslint-disable-next-line no-console
        console.error('Inpersona WebSocket error', event);
      };
      ws.onmessage = handleMessage;
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMessage = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data);

    if (data.error) {
      setIsLoading(false);
      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          { content: `Error: ${data.error}`, isUser: false, complete: true },
        ];
      });
      return;
    }

    if (data.type === 'chunk') {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (!last || last.isUser || last.complete) {
          return [...next.slice(0, -1), { content: data.content, isUser: false, loading: true }];
        }
        next[next.length - 1] = {
          ...last,
          content: last.content + data.content,
          loading: true,
        };
        return next;
      });
    } else if (data.type === 'complete') {
      setIsLoading(false);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && !last.isUser) {
          next[next.length - 1] = { ...last, complete: true, loading: false };
        }
        return next;
      });
    }
  };

  const sendQuestion = (question: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || isLoading || !question.trim()) {
      return;
    }
    const userMessage: Message = { content: question, isUser: true, complete: true };
    const loadingMessage: Message = { content: '', isUser: false, loading: true };
    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    const query: ChatQuery = {
      question,
      vector_store: useKnowledgeGraph ? 'KG' : 'vector',
      query_transformation: useHydeQuery ? 'HyDE' : null,
    };
    ws.send(JSON.stringify(query));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draftMessage.trim()) return;
    sendQuestion(draftMessage);
    setDraftMessage('');
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 px-4">
        <Link
          href="/"
          className="whitespace-nowrap text-sm sm:text-base font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
        >
          {inpersona.homeLink}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`block h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Messages */}
      <div className="inpersona-scrollbar flex-1 w-full overflow-y-auto px-2 sm:px-4 pt-14 pb-32">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <EmptyState
              onSuggestionClick={sendQuestion}
              isReady={isConnected && !isLoading}
            />
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input + toggles */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white dark:from-gray-900 to-transparent pt-6 pb-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-2 sm:px-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2 px-2 mb-2">
              {/* Desktop toggles */}
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Tooltip text={kgToggle.tooltip}>
                  <ToggleButton
                    active={useKnowledgeGraph}
                    icon={<Network size={16} />}
                    label={kgToggle.label}
                    onToggle={() => setUseKnowledgeGraph((v) => !v)}
                    activeClasses="bg-gradient-to-r from-purple-700 to-purple-500 text-white"
                  />
                </Tooltip>
                <Tooltip text={hydeToggle.tooltip}>
                  <ToggleButton
                    active={useHydeQuery}
                    icon={<Search size={16} />}
                    label={hydeToggle.label}
                    onToggle={() => setUseHydeQuery((v) => !v)}
                    activeClasses="bg-gradient-to-r from-blue-700 to-blue-500 text-white"
                  />
                </Tooltip>
              </div>

              {/* Mobile toggles */}
              <div className="flex items-center gap-2 sm:hidden">
                <ToggleButton
                  active={useKnowledgeGraph}
                  icon={<Network size={12} />}
                  label={kgToggle.shortLabel}
                  onToggle={() => setUseKnowledgeGraph((v) => !v)}
                  activeClasses="bg-gradient-to-r from-purple-700 to-purple-500 text-white"
                  compact
                />
                <ToggleButton
                  active={useHydeQuery}
                  icon={<Search size={12} />}
                  label={hydeToggle.shortLabel}
                  onToggle={() => setUseHydeQuery((v) => !v)}
                  activeClasses="bg-gradient-to-r from-blue-700 to-blue-500 text-white"
                  compact
                />
                <button
                  type="button"
                  onClick={() => setShowInfo(true)}
                  aria-label="About these toggles"
                  className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1"
                >
                  <Info size={14} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex items-center rounded-xl bg-white dark:bg-gray-800 px-3 py-2 shadow-lg ring-1 ring-gray-100 dark:ring-gray-700 touch-action-manipulation">
              <input
                type="text"
                placeholder={inpersona.inputPlaceholder}
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                className="flex-1 bg-transparent py-1 text-base text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              <button
                type="submit"
                disabled={!isConnected || isLoading || !draftMessage.trim()}
                className="ml-2 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 p-1.5 shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                aria-label="Send"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </div>
          <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-gray-400">
            {inpersona.footerCredit}
          </p>
        </form>
      </div>

      {showInfo && (
        <InfoModal
          onClose={() => setShowInfo(false)}
          knowledgeGraphDescription={kgToggle.description}
          hydeDescription={hydeToggle.description}
        />
      )}
    </div>
  );
}

function EmptyState({
  onSuggestionClick,
  isReady,
}: {
  onSuggestionClick: (question: string) => void;
  isReady: boolean;
}) {
  const { inpersona } = config;
  return (
    <div className="flex min-h-[calc(100vh-240px)] flex-col items-center justify-center space-y-4 sm:space-y-6 px-4 mt-2 sm:mt-4">
      <div className="h-24 w-24 sm:h-32 sm:w-32 animate-float rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-lg">
        <img
          src={inpersona.avatar}
          alt="Yatharth"
          className="h-full w-full rounded-full object-cover"
        />
      </div>
      <div className="text-center">
        <p className="mb-4 text-xl sm:text-2xl font-light text-gray-600 dark:text-gray-300">
          {inpersona.emptyStatePrompt}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {inpersona.suggestions.slice(0, 4).map((question) => (
            <button
              key={question}
              onClick={() => onSuggestionClick(question)}
              disabled={!isReady}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-left text-sm sm:text-base text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`flex animate-fade-in ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 transition-all ${
          message.isUser
            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md'
        }`}
      >
        {message.isUser ? (
          <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
        ) : (
          <div
            className={`html-content text-sm sm:text-base leading-relaxed ${
              message.loading ? 'typing-container' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: message.content || '&nbsp;' }}
          />
        )}
        {message.loading && (
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  icon,
  label,
  onToggle,
  activeClasses,
  compact = false,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onToggle: () => void;
  activeClasses: string;
  compact?: boolean;
}) {
  const sizeClasses = compact ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
  const idleClasses =
    'bg-gradient-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-full transition-all ${sizeClasses} ${
        active ? `${activeClasses} shadow-md` : `${idleClasses} hover:shadow-sm`
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function InfoModal({
  onClose,
  knowledgeGraphDescription,
  hydeDescription,
}: {
  onClose: () => void;
  knowledgeGraphDescription: string;
  hydeDescription: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:hidden">
      <div className="w-full max-w-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg">
        <h3 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">Search Options</h3>
        <div className="mb-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <p className="mb-1 font-medium">KG (Knowledge Graph):</p>
            <p>{knowledgeGraphDescription}</p>
          </div>
          <div>
            <p className="mb-1 font-medium">HyDE:</p>
            <p>{hydeDescription}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 py-2 text-sm text-gray-800 dark:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
