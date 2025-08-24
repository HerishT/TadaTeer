import React, { useState, useEffect, useRef } from 'react';
import unifiedDataService from '../services/unifiedDataService';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

const SmartSearchPage = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  const { user, isAuthenticated } = useAuth();
  const { searchHistory, addSearchQuery } = useUserData(user?.id);

  // Search for companies as user types
  useEffect(() => {
    if (query.length > 1) {
      setIsSearching(true);
      
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Debounce search
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Use unified data service for guaranteed consistency
          console.log(`[SEARCH] Searching for "${query}" using unified service`);
          const results = await unifiedDataService.searchCompanies(query);
          
          console.log(`[SEARCH] Found ${results.length} results for "${query}"`);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('[SEARCH] Error:', error);
          setSuggestions([]);
          setShowSuggestions(true);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      const searchQuery = query.trim().toUpperCase();
      
      // Add to search history if user is authenticated
      if (isAuthenticated && user?.id) {
        addSearchQuery(searchQuery);
      }
      
      setShowSuggestions(false);
      setShowHistory(false);
      onSearch(searchQuery);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const searchQuery = suggestion.symbol;
    setQuery(searchQuery);
    
    // Add to search history if user is authenticated
    if (isAuthenticated && user?.id) {
      addSearchQuery(searchQuery);
    }
    
    setShowSuggestions(false);
    setShowHistory(false);
    onSearch(searchQuery);
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem.query);
    setShowHistory(false);
    setShowSuggestions(false);
    onSearch(historyItem.query);
  };

  const popularStocks = [
    { symbol: 'NABIL', name: 'Nabil Bank Limited' },
    { symbol: 'SANIMA', name: 'Sanima Bank Limited' },
    { symbol: 'NIC', name: 'NIC Asia Bank Limited' },
    { symbol: 'EBL', name: 'Everest Bank Limited' },
    { symbol: 'SBI', name: 'Nepal SBI Bank Limited' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            TadaTeer
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-400">
            AI-Powered Foresight for the Nepal Stock Exchange
          </p>
        </div>

        {/* Search Section */}
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-400 border-t-transparent"></div>
            ) : (
              <svg
                className="h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          
          {/* History Button */}
          {isAuthenticated && searchHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="absolute inset-y-0 right-12 flex items-center pr-3 text-gray-400 hover:text-teal-400 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.length <= 1 && isAuthenticated && searchHistory.length > 0) {
                setShowHistory(true);
              }
            }}
            placeholder="Search for any NEPSE-listed company (e.g., NABIL, Nabil Bank)..."
            className="w-full text-white placeholder-gray-500 text-lg rounded-xl py-4 pl-12 pr-16 focus:outline-none transition-all duration-300"
            autoComplete="off"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(28px)' }}
          />
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl max-h-80 overflow-y-auto z-50" style={{ backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-700/50 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{suggestion.symbol}</div>
                      <div className="text-gray-400 text-sm">{suggestion.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">रु {Number(suggestion.currentPrice || suggestion.price || 0).toFixed(2)}</div>
                      <div className={`text-sm ${suggestion.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {suggestion.change >= 0 ? '+' : ''}{Number(suggestion.change || 0).toFixed(2)} ({Number(suggestion.changePercent || 0).toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {showHistory && isAuthenticated && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto z-50" style={{ backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-4 py-3 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Recent Searches</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {searchHistory.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-700/50 last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-white font-medium">{item.query}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>
        
        <div className="mt-6 text-sm text-gray-500">
          <span>Popular stocks:</span>
          {popularStocks.map((stock, index) => (
            <React.Fragment key={stock.symbol}>
              <button
                onClick={() => handleSuggestionClick(stock)}
                className="ml-2 hover:text-teal-400 transition-colors"
              >
                {stock.symbol}
              </button>
              {index < popularStocks.length - 1 && <span className="mx-1">·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmartSearchPage;
