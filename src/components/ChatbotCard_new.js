import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import NotesTab from './NotesTab';
import { useAuth } from '../hooks/useAuth';

const ChatbotCard = ({ companyData }) => {
  const { messages, isLoading, error, sendMessage, handleSuggestionClick } = useChat(companyData);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { isAuthenticated } = useAuth();

  // Prevent any scrolling behavior when chatting
  useEffect(() => {
    const preventScrollOnFocus = (e) => {
      if (e.target === inputRef.current) {
        // Store current scroll position
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Restore scroll position after any potential scroll
        setTimeout(() => {
          window.scrollTo(scrollLeft, scrollTop);
        }, 0);
      }
    };

    document.addEventListener('focusin', preventScrollOnFocus);
    return () => document.removeEventListener('focusin', preventScrollOnFocus);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use scrollTop instead of scrollIntoView to prevent page scrolling
      const messagesContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
      // Keep focus on input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-2xl flex flex-col max-h-[calc(100vh-2rem)] relative" style={{ backgroundColor: 'rgba(10,10,10,0.2)', backdropFilter: 'blur(36px)', border: '1px solid rgba(80,80,80,0.18)' }}>
      {/* Floating effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-600/5 rounded-2xl pointer-events-none"></div>
      
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50 flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">TadaTeer AI</h2>
            <p className="text-sm text-gray-400">Your AI Financial Analyst</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800/30 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'notes'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Notes</span>
            {!isAuthenticated && (
              <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat' ? (
          // Chat Content
          <>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    {message.type === 'ai' && (
                      <div className="bg-teal-500 p-2 rounded-full flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                      {message.type === 'user' && (
                        <div className="inline-block bg-teal-600 text-white p-3 rounded-lg rounded-tr-none max-w-xs lg:max-w-md">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-teal-100 mt-1">{formatTimestamp(message.timestamp)}</p>
                        </div>
                      )}
                      
                      {message.type === 'ai' && (
                        <div className="bg-gray-800 text-gray-100 p-3 rounded-lg rounded-tl-none">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatTimestamp(message.timestamp)}</p>
                          
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-gray-400">Suggested follow-ups:</p>
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="block w-full text-left text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="bg-teal-500 p-2 rounded-full flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="bg-gray-800 text-gray-100 p-3 rounded-lg rounded-tl-none">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                        <span className="text-sm text-gray-400">TadaTeer is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="p-6 border-t border-gray-700/50 flex-shrink-0">
              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={(e) => {
                    e.target.scrollIntoView = () => {};
                  }}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 transition-all resize-none"
                  rows="1"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-400"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </form>
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </>
        ) : (
          // Notes Content
          <div className="flex-1 p-6 overflow-hidden">
            <NotesTab companyData={companyData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotCard;
