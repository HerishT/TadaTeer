import React, { useState } from 'react';

const SearchPage = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleSuggestionClick = (suggestion) => {
    onSearch(suggestion);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
          TadaTeer
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-400">
          AI-Powered Foresight for the Nepal Stock Exchange
        </p>
        
        <form onSubmit={handleSearch} className="relative mt-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any NEPSE-listed company (e.g., Nabil Bank)..."
            className="w-full text-white placeholder-gray-500 text-lg rounded-xl py-4 pl-12 pr-4 focus:outline-none transition-all duration-300"
            style={{ backgroundColor: 'rgba(10,10,10,0.22)', border: '1px solid rgba(80,80,80,0.18)', backdropFilter: 'blur(36px)' }}
          />
        </form>
        
        <div className="mt-6 text-sm text-gray-500">
          <span>Try:</span>
          <button
            onClick={() => handleSuggestionClick('NABIL')}
            className="ml-2 hover:text-teal-400 transition-colors"
          >
            NABIL
          </button>
          <span className="mx-1">·</span>
          <button
            onClick={() => handleSuggestionClick('SANIMA')}
            className="hover:text-teal-400 transition-colors"
          >
            SANIMA
          </button>
          <span className="mx-1">·</span>
          <button
            onClick={() => handleSuggestionClick('NIC')}
            className="hover:text-teal-400 transition-colors"
          >
            NIC
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
