import { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiMessageCircle, FiPhone, FiClock } from 'react-icons/fi';
import { aiService, type SimilarQuery } from '../../services/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
  animalType?: string;
  showHistory?: boolean;
}

export const AIChatbot = ({ isOpen, onClose, initialContext, animalType, showHistory = false }: AIChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistoryId, setChatHistoryId] = useState<string | undefined>();
  const [similarQueries, setSimilarQueries] = useState<SimilarQuery[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: initialContext
            ? `I'm here to help you with this emergency. Based on what you've described, I can provide guidance on immediate care while waiting for the vet. What would you like to know?`
            : `Hello! I'm your AI assistant. I can help you with pet care questions and provide guidance during emergencies. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);

      // Fetch similar past queries if context is provided
      if (initialContext && showHistory) {
        fetchSimilarQueries(initialContext);
      }
    }
  }, [isOpen, initialContext, messages.length, showHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const fetchSimilarQueries = async (query: string) => {
    try {
      const result = await aiService.getSimilarQueries(query);
      if (result.queries.length > 0) {
        setSimilarQueries(result.queries);
        setShowSimilar(true);
      }
    } catch (error) {
      console.error('Failed to fetch similar queries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Use the new chat endpoint
      const response = await aiService.chat(
        userInput,
        initialContext,
        chatHistoryId
      );

      // Save chat history ID for subsequent messages
      if (response.chatHistoryId) {
        setChatHistoryId(response.chatHistoryId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'I apologize, but I could not generate a response. Please try again or contact a veterinarian directly.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact a veterinarian directly for urgent assistance.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePastQuery = (query: SimilarQuery) => {
    // Add the past query and answer to the chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📋 **From your past query:**\n\n"${query.query}"\n\n${query.answer || 'No recorded answer.'}\n\n${query.contactNumber ? `📞 Contact: ${query.contactNumber}` : ''}`,
        timestamp: new Date(),
      },
    ]);
    setShowSimilar(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border-4 border-[#FFCDC9]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FD7979] to-[#FDACAC] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <FiMessageCircle className="h-5 w-5 text-[#FD7979]" />
            </div>
            <div>
              <h3 className="font-bold text-white">AI Assistant</h3>
              <p className="text-white/80 text-xs">Emergency guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Similar Past Queries */}
        {showSimilar && similarQueries.length > 0 && (
          <div className="p-3 bg-[#FEEAC9] border-b-2 border-[#FFCDC9]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#5D4E4E]">📋 Similar Past Queries</span>
              <button
                onClick={() => setShowSimilar(false)}
                className="text-xs text-[#5D4E4E] hover:text-[#FD7979]"
              >
                Hide
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {similarQueries.slice(0, 3).map((query) => (
                <button
                  key={query.id}
                  onClick={() => handleUsePastQuery(query)}
                  className="w-full text-left p-2 bg-white rounded-lg hover:bg-[#FFF9F0] transition-colors border border-[#FFCDC9]"
                >
                  <p className="text-xs text-[#5D4E4E] line-clamp-1">{query.query}</p>
                  {query.contactNumber && (
                    <p className="text-xs text-[#FD7979] flex items-center gap-1 mt-1">
                      <FiPhone className="h-3 w-3" />
                      {query.contactNumber}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFF9F0]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-[#FD7979] text-white rounded-br-sm'
                    : 'bg-white text-[#5D4E4E] rounded-bl-sm border-2 border-[#FEEAC9]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-[#5D4E4E]/50'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-[#5D4E4E] rounded-2xl rounded-bl-sm p-3 border-2 border-[#FEEAC9]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-[#FD7979] border-t-transparent rounded-full" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t-2 border-[#FEEAC9]">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pet care..."
              className="flex-1 px-4 py-3 bg-[#FFF9F0] border-2 border-[#FEEAC9] rounded-xl focus:outline-none focus:border-[#FD7979] text-[#5D4E4E] placeholder-[#5D4E4E]/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-[#FD7979] text-white rounded-xl hover:bg-[#E05A5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_3px_0_#E05A5A]"
            >
              <FiSend className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Floating AI Chat Button
interface AIFloatingButtonProps {
  onClick: () => void;
}

export const AIFloatingButton = ({ onClick }: AIFloatingButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-[#FD7979] to-[#FDACAC] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
      aria-label="Open AI Assistant"
    >
      <FiMessageCircle className="h-6 w-6" />
    </button>
  );
};
