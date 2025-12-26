import { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiMessageCircle } from 'react-icons/fi';
import { aiService } from '../../services/ai';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';

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
}

export const AIChatbot = ({ isOpen, onClose, initialContext, animalType }: AIChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    }
  }, [isOpen, initialContext, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

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
    setInput('');
    setIsLoading(true);

    try {
      // Use the guidance endpoint for chat
      const contextQuery = initialContext
        ? `Context: ${initialContext}\n\nUser question: ${input.trim()}`
        : input.trim();

      const response = await aiService.getGuidance(contextQuery, animalType);

      // Format the guidance response into a readable message
      let assistantContent = '';

      if (response.guidance.immediateSteps && response.guidance.immediateSteps.length > 0) {
        assistantContent += `**Immediate Steps:**\n`;
        response.guidance.immediateSteps.forEach((step, i) => {
          assistantContent += `${i + 1}. ${step}\n`;
        });
        assistantContent += '\n';
      }

      if (response.guidance.suggestions && response.guidance.suggestions.length > 0) {
        assistantContent += `**Suggestions:**\n`;
        response.guidance.suggestions.forEach((suggestion) => {
          assistantContent += `• ${suggestion}\n`;
        });
        assistantContent += '\n';
      }

      if (response.guidance.disclaimer) {
        assistantContent += `\n*${response.guidance.disclaimer}*`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent || 'I apologize, but I could not generate a response. Please try again or contact a veterinarian directly.',
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
