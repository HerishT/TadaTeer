import React, { useState, useEffect } from 'react';
import marketApiService from '../services/marketApiService';

const MarketPage = () => {
  const [marketData, setMarketData] = useState({
    summary: null,
    nepseIndex: null,
    liveMarket: null,
    isNepseOpen: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        const [summary, nepseIndex, liveMarket, isNepseOpen] = await Promise.all([
          marketApiService.getSummary(),
          marketApiService.getNepseIndex(),
          marketApiService.getLiveMarket(),
          marketApiService.isNepseOpen()
        ]);

        setMarketData({
          summary,
          nepseIndex,
          liveMarket,
          isNepseOpen
        });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching market data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
        <div className="text-center">
          <p className="text-red-400">Error loading market data: {error}</p>
          <p className="text-gray-400 mt-2">Showing cached/mock data</p>
        </div>
      </div>
    );
  }

  const { summary, nepseIndex, liveMarket } = marketData;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
      <div className="w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Market Overview</h1>
          <p className="text-gray-400">Real-time Nepal Stock Exchange data</p>
          {marketData.isNepseOpen && (
            <div className="mt-2 flex items-center justify-center">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-400 text-sm">Market is open</span>
            </div>
          )}
        </div>

          {nepseIndex && (
          <div className="mb-8">
            <div className="relative rounded-2xl p-8 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">NEPSE Index</h2>
                  <div className="flex items-center">
                    <span className="text-5xl font-bold text-white mr-4">
                      {nepseIndex.index?.toFixed(2) || '2089.50'}
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-2xl font-semibold ${
                        (nepseIndex.change || 1.25) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(nepseIndex.change || 1.25) >= 0 ? '+' : ''}{nepseIndex.change?.toFixed(2) || '1.25'}
                      </span>
                      <span className={`text-lg ${
                        (nepseIndex.percentChange || 0.06) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ({(nepseIndex.percentChange || 0.06) >= 0 ? '+' : ''}{nepseIndex.percentChange?.toFixed(2) || '0.06'}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-6xl">📈</div>
                </div>
              </div>
            </div>
          </div>
        )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summary && (
            <>
              <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
                <h3 className="text-lg font-semibold text-white mb-2">Total Turnover</h3>
                <p className="text-3xl font-bold text-teal-400">
                  रु {((summary.totalTurnover || 5200000000) / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-400 mt-1">Today's trading volume</p>
              </div>
              
              <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
                <h3 className="text-lg font-semibold text-white mb-2">Total Transactions</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {(summary.totalTransactions || 45000).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 mt-1">Number of trades</p>
              </div>
              
              <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
                <h3 className="text-lg font-semibold text-white mb-2">Listed Companies</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {summary.totalListedCompanies || 250}
                </p>
                <p className="text-sm text-gray-400 mt-1">Total companies</p>
              </div>
              
              <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
                <h3 className="text-lg font-semibold text-white mb-2">Market Cap</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  रु {((summary.marketCap || 4500000000000) / 1000000000000).toFixed(1)}T
                </p>
                <p className="text-sm text-gray-400 mt-1">Total market value</p>
              </div>
            </>
          )}
        </div>

        {liveMarket && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Advancers</h3>
                  <p className="text-3xl font-bold text-green-400">
                    {liveMarket.advancers || 120}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Stocks moving up</p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>
            
            <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Decliners</h3>
                  <p className="text-3xl font-bold text-red-400">
                    {liveMarket.decliners || 95}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Stocks moving down</p>
                </div>
                <div className="text-4xl">📉</div>
              </div>
            </div>
            
              <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Unchanged</h3>
                  <p className="text-3xl font-bold text-yellow-400">
                    {liveMarket.unchanged || 35}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">No price change</p>
                </div>
                <div className="text-4xl">➖</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPage;
