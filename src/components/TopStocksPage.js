import React, { useState, useEffect } from 'react';
import marketApiService from '../services/marketApiService';

const TopStocksPage = () => {
  const [topStocksData, setTopStocksData] = useState({
    topGainers: [],
    topLosers: [],
    topTrade: [],
    topTurnover: [],
    topTransaction: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gainers');

  useEffect(() => {
    const fetchTopStocksData = async () => {
      setLoading(true);
      try {
        const [topGainers, topLosers, topTrade, topTurnover, topTransaction] = await Promise.all([
          marketApiService.getTopGainers(),
          marketApiService.getTopLosers(),
          marketApiService.getTopTenTradeScrips(),
          marketApiService.getTopTenTurnoverScrips(),
          marketApiService.getTopTenTransactionScrips()
        ]);

        setTopStocksData({
          topGainers: Array.isArray(topGainers) ? topGainers : [],
          topLosers: Array.isArray(topLosers) ? topLosers : [],
          topTrade: Array.isArray(topTrade) ? topTrade : [],
          topTurnover: Array.isArray(topTurnover) ? topTurnover : [],
          topTransaction: Array.isArray(topTransaction) ? topTransaction : []
        });
      } catch (err) {
        console.error('Error fetching top stocks data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopStocksData();
  }, []);

  const tabs = [
    { id: 'gainers', name: 'Top Gainers', icon: '📈', color: 'green' },
    { id: 'losers', name: 'Top Losers', icon: '📉', color: 'red' },
    { id: 'trade', name: 'Most Traded', icon: '🔄', color: 'blue' },
    { id: 'turnover', name: 'Top Turnover', icon: '💰', color: 'yellow' },
    { id: 'transaction', name: 'Most Transactions', icon: '📊', color: 'purple' }
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'gainers': return topStocksData.topGainers;
      case 'losers': return topStocksData.topLosers;
      case 'trade': return topStocksData.topTrade;
      case 'turnover': return topStocksData.topTurnover;
      case 'transaction': return topStocksData.topTransaction;
      default: return [];
    }
  };

  const renderStockCard = (stock, index) => {
    const isGainer = activeTab === 'gainers';
    const isLoser = activeTab === 'losers';
    
    return (
  <div key={stock.symbol || index}
       className="rounded-xl p-6 border border-blue-400/30 hover:border-blue-300/40 transition-all"
       style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
              index === 1 ? 'bg-gray-500/20 text-gray-400' :
              index === 2 ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-700/50 text-gray-300'
            }`}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{stock.symbol}</h3>
              <p className="text-sm text-gray-400">{stock.name || stock.companyName || 'N/A'}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-white mb-1">
              रु {(stock.ltp || stock.price || stock.lastTradedPrice || 0).toLocaleString()}
            </div>
            
            {(isGainer || isLoser) && (
              <div className={`flex items-center justify-end space-x-2 ${
                isGainer ? 'text-green-400' : 'text-red-400'
              }`}>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={
                    isGainer 
                      ? "M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z"
                      : "M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z"
                  } clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  {isGainer ? '+' : ''}{(stock.change || 0).toFixed(2)} 
                  ({isGainer ? '+' : ''}{(stock.percentChange || 0).toFixed(2)}%)
                </span>
              </div>
            )}
            
            {activeTab === 'turnover' && (
              <div className="text-sm text-gray-400">
                Turnover: रु {((stock.turnover || 0) / 1000000).toFixed(2)}M
              </div>
            )}
            
            {activeTab === 'transaction' && (
              <div className="text-sm text-gray-400">
                Transactions: {(stock.totalTrades || 0).toLocaleString()}
              </div>
            )}
            
            {activeTab === 'trade' && (
              <div className="text-sm text-gray-400">
                Volume: {(stock.totalTradeQuantity || stock.volume || 0).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading top stocks data...</p>
        </div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Top Performing Stocks</h1>
          <p className="text-gray-400">Best and worst performers in NEPSE</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/50`
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stock List */}
        <div className="space-y-4">
          {currentData.length > 0 ? (
            currentData.slice(0, 10).map((stock, index) => renderStockCard(stock, index))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No data available for {tabs.find(t => t.id === activeTab)?.name}</div>
              <p className="text-gray-500 text-sm mt-2">Data will be displayed when the market is open</p>
            </div>
          )}
        </div>

        {/* Refresh Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Data updates every 5 minutes during market hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopStocksPage;
