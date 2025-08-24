import React from 'react';
import ForecastCard from './ForecastCard';

const MLForecastModal = ({ isOpen, onClose, symbol, forecastData, enhancedForecastData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Just the ForecastCard */}
        <ForecastCard 
          symbol={symbol}
          companyName={symbol}
          currentPrice={null}
          forecastData={forecastData}
          enhancedForecastData={enhancedForecastData}
        />
      </div>
    </div>
  );
};

export default MLForecastModal;
