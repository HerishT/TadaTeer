import { useState, useCallback } from 'react';
import geminiService from '../services/geminiService';

export const useChat = (companyData = null) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `I have analyzed ${companyData?.name || 'the current company'}'s latest reports. Ask me anything about its financials, sentiment, or future outlook.`,
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'ai',
      content: 'Try one of these:',
      suggestions: [
        "What was the net profit growth this quarter?",
        "Compare revenue with similar companies.",
        "Summarize the sentiment from recent news.",
        "What are the key risks for this investment?",
        "Analyze the financial ratios."
      ],
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userMessage) => {
    console.log('sendMessage called with:', userMessage);
    if (!userMessage.trim()) {
      console.log('Empty message, returning early');
      return;
    }

    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    console.log('Adding user message:', userMsg);
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      console.log('Calling geminiService.sendMessage...');
      // Send to Gemini API
      const response = await geminiService.sendMessage(userMessage, companyData);
      console.log('Gemini API response:', response);
      
      // Add AI response
      const aiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.success ? response.message : response.message,
        timestamp: new Date(),
        error: !response.success
      };

      console.log('Adding AI message:', aiMsg);
      setMessages(prev => [...prev, aiMsg]);
      
      if (!response.success) {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error in sendMessage:', err);
      const errorMsg = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMsg]);
      setError("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  }, [companyData]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: `I have analyzed ${companyData?.name || 'the current company'}'s latest reports. Ask me anything about its financials, sentiment, or future outlook.`,
        timestamp: new Date()
      }
    ]);
    setError(null);
  }, [companyData]);

  const handleSuggestionClick = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    handleSuggestionClick
  };
};
