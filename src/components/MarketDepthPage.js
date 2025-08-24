import React, { useState, useEffect } from 'react';
import marketApiService from '../services/marketApiService';
import unifiedDataService from '../services/unifiedDataService';
import deterministicDataGenerator from '../services/deterministicDataGenerator';
import { BatchForecastCard } from './ForecastCard';

// Helper function to generate sector breakdown from market overview
const generateSectorBreakdown = (marketOverview) => {
  const allStocks = [...marketOverview.topGainers, ...marketOverview.topLosers, ...marketOverview.volumeLeaders];
  const sectors = [...new Set(allStocks.map(stock => stock.sector).filter(Boolean))];
  
  return sectors.map(sector => {
    const sectorStocks = allStocks.filter(stock => stock.sector === sector);
    const avgChange = sectorStocks.reduce((sum, stock) => sum + (stock.changePercent || 0), 0) / sectorStocks.length;
    
    return {
      name: sector,
      companies: sectorStocks.length,
      avgChange: avgChange,
      performance: avgChange > 0 ? 'positive' : avgChange < 0 ? 'negative' : 'neutral'
    };
  });
};

// Helper function to generate market trends from market overview
const generateMarketTrends = (marketOverview) => {
  const allStocks = [...marketOverview.topGainers, ...marketOverview.topLosers, ...marketOverview.volumeLeaders];
  const totalChange = allStocks.reduce((sum, stock) => sum + (stock.changePercent || 0), 0);
  const avgChange = totalChange / allStocks.length;
  
  return {
    overall: avgChange > 0 ? 'bullish' : avgChange < 0 ? 'bearish' : 'neutral',
    avgChange: avgChange,
    momentum: Math.abs(avgChange) > 2 ? 'high' : Math.abs(avgChange) > 1 ? 'medium' : 'low'
  };
};

const MarketDepthPage = () => {
  const [marketData, setMarketData] = useState({
    allStocks: [],
    marketStats: null,
    sectorBreakdown: [],
    volumeLeaders: [],
    priceMovers: [],
    marketTrends: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [filterSector, setFilterSector] = useState('all');

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[MARKET_DEPTH] Fetching market overview using unified service');
        
        // Get market overview from unified service for consistency
        const marketOverview = await unifiedDataService.getMarketOverview();
        
        console.log('[MARKET_DEPTH] Market overview received:', {
          totalCompanies: marketOverview.totalCompanies,
          gainersCount: marketOverview.topGainers?.length,
          losersCount: marketOverview.topLosers?.length,
          volumeLeadersCount: marketOverview.volumeLeaders?.length
        });

        // Try to get additional live market stats if available
        let liveStats = null;
        try {
          const [summary, liveMarket] = await Promise.all([
            marketApiService.getSummary(),
            marketApiService.getLiveMarket()
          ]);
          
          if (summary || liveMarket) {
            liveStats = {
              totalCompanies: summary?.totalListedCompanies || marketOverview.totalCompanies,
              gainers: liveMarket?.advancers || marketOverview.topGainers?.length,
              losers: liveMarket?.decliners || marketOverview.topLosers?.length,
            };
          }
        } catch (liveError) {
          console.log('[MARKET_DEPTH] Live stats not available:', liveError.message);
        }

        // Process the unified data
        const processedData = {
          allStocks: [...marketOverview.topGainers, ...marketOverview.topLosers, ...marketOverview.volumeLeaders],
          marketStats: liveStats || {
            totalCompanies: marketOverview.totalCompanies,
            gainers: marketOverview.topGainers?.length || 0,
            losers: marketOverview.topLosers?.length || 0,
          },
          sectorBreakdown: generateSectorBreakdown(marketOverview),
          volumeLeaders: marketOverview.volumeLeaders,
          priceMovers: { 
            gainers: marketOverview.topGainers, 
            losers: marketOverview.topLosers 
          },
          marketTrends: generateMarketTrends(marketOverview),
          _source: 'unified_market_overview'
        };

        setMarketData(processedData);
        
      } catch (err) {
        setError(err.message);
        console.error('[MARKET_DEPTH] Error fetching market data:', err);
        // Even on error, show mock data
        const mockData = generateComprehensiveMarketData();
        setMarketData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Process real market data
  const processMarketData = (companies) => {
    const sectors = [...new Set(companies.map(c => c.sector).filter(Boolean))];
    
    // Calculate market statistics
    const totalMarketCap = companies.reduce((sum, c) => sum + (c.marketCap || (c.price || 100) * 1000000), 0);
    const avgPrice = companies.reduce((sum, c) => sum + (c.price || 100), 0) / companies.length;
    const gainers = companies.filter(c => (c.changePercent || c.change || 0) > 0);
    const losers = companies.filter(c => (c.changePercent || c.change || 0) < 0);
    
    // Volume leaders (top 20)
    const volumeLeaders = companies
      .filter(c => c.volume || c.totalTradeQuantity)
      .sort((a, b) => (b.volume || b.totalTradeQuantity || 0) - (a.volume || a.totalTradeQuantity || 0))
      .slice(0, 20);
    
    // Price movers (top gainers and losers)
    const topGainers = companies
      .filter(c => (c.changePercent || c.change || 0) > 0)
      .sort((a, b) => (b.changePercent || b.change || 0) - (a.changePercent || a.change || 0))
      .slice(0, 15);
    
    const topLosers = companies
      .filter(c => (c.changePercent || c.change || 0) < 0)
      .sort((a, b) => (a.changePercent || a.change || 0) - (b.changePercent || b.change || 0))
      .slice(0, 15);
    
    // Sector breakdown
    const sectorBreakdown = sectors.map(sector => {
      const sectorStocks = companies.filter(c => c.sector === sector);
      const sectorMarketCap = sectorStocks.reduce((sum, c) => sum + (c.marketCap || (c.price || 100) * 1000000), 0);
      const avgChange = sectorStocks.reduce((sum, c) => sum + (c.changePercent || c.change || 0), 0) / sectorStocks.length;
      
      return {
        name: sector,
        companies: sectorStocks.length,
        marketCap: sectorMarketCap,
        avgChange: avgChange,
        weight: (sectorMarketCap / totalMarketCap) * 100
      };
    }).sort((a, b) => b.marketCap - a.marketCap);

    return {
      allStocks: companies,
      marketStats: {
        totalCompanies: companies.length,
        totalMarketCap: totalMarketCap,
        avgPrice: avgPrice,
        gainers: gainers.length,
        losers: losers.length,
        unchanged: companies.length - gainers.length - losers.length,
        volume: companies.reduce((sum, c) => sum + (c.volume || c.totalTradeQuantity || 0), 0)
      },
      sectorBreakdown: sectorBreakdown,
      volumeLeaders: volumeLeaders,
      priceMovers: { gainers: topGainers, losers: topLosers },
      marketTrends: calculateMarketTrends(companies)
    };
  };

  // Calculate market trends
  const calculateMarketTrends = (companies) => {
    const prices = companies.map(c => c.price || 100);
    const changes = companies.map(c => c.changePercent || c.change || 0);
    
    return {
      marketMomentum: changes.reduce((sum, c) => sum + c, 0) / changes.length,
      volatility: Math.sqrt(changes.reduce((sum, c) => sum + Math.pow(c, 2), 0) / changes.length),
      breadth: (companies.filter(c => (c.changePercent || c.change || 0) > 0).length / companies.length) * 100,
      avgVolume: companies.reduce((sum, c) => sum + (c.volume || c.totalTradeQuantity || 0), 0) / companies.length
    };
  };

  // Generate comprehensive mock data if no real data available
  const generateComprehensiveMarketData = () => {
    console.log('[MARKET_DEPTH] Generating comprehensive mock data as fallback');
    
    // Fallback: generate deterministic data for common NEPSE symbols
    const commonSymbols = [
      'NABIL', 'ADBL', 'EBL', 'KBL', 'NBL', 'NCCB', 'SBI', 'BOK', 'NICA', 'MBL',
      'LBL', 'CBL', 'KSBBL', 'NMB', 'PCBL', 'LBBL', 'SANIMA', 'NIC', 'MEGA', 'KUMARI',
      'HIDCL', 'UPPER', 'CHCL', 'NHPC', 'AKPL', 'HURJA', 'API', 'UMHL', 'LEMF', 'RHPL',
      'NLIC', 'NLG', 'UNL', 'IGI', 'PICL', 'SICL', 'EIC', 'PIC', 'RLFL', 'HGI',
      'NIFRA', 'UIC', 'PRIN', 'SIC', 'SLICL', 'GLICL', 'LGIL', 'NICL', 'RBCL', 'SLBSL',
      'GUFL', 'CFCL', 'BNHC', 'CORBL', 'GBLBS', 'ILBS', 'JBBL', 'KLBS', 'MLBS', 'NLBS',
      'RMDC', 'RSDC', 'SABSL', 'SIFC', 'SMBS', 'SWBBL', 'VLBS', 'ALBSL', 'CBBL', 'DDBL',
      'EDBL', 'FMDBL', 'GBBL', 'JSLBB', 'KMDBL', 'MFIL', 'NMBMF', 'ODBL', 'SHINE', 'SMFDB',
      'SPDL', 'SDLBS', 'WDBL', 'MBBL', 'FOWAD', 'MSMBS', 'NUBL', 'GGBSL', 'SMATA', 'NESDO',
      'TCL', 'ACLBSL', 'NIMB', 'SDESI', 'ANVIL', 'BARUN', 'BFC', 'CCBL', 'CEDB', 'CGH'
    ];
    
    const companies = commonSymbols.map(symbol => 
      deterministicDataGenerator.generateMarketData(symbol)
    );
    
    console.log(`Generated deterministic data for ${companies.length} companies`);
    return processMarketData(companies);
  };

  // Filter and sort stocks based on current selections
  const getFilteredStocks = () => {
    let filtered = marketData.allStocks;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sector filter
    if (filterSector !== 'all') {
      filtered = filtered.filter(stock => stock.sector === filterSector);
    }

    // Apply sorting
    switch (sortBy) {
      case 'volume':
        return filtered.sort((a, b) => (b.volume || b.totalTradeQuantity || 0) - (a.volume || a.totalTradeQuantity || 0));
      case 'change':
        return filtered.sort((a, b) => (b.changePercent || b.change || 0) - (a.changePercent || a.change || 0));
      case 'price':
        return filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'marketCap':
        return filtered.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
      default:
        return filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
  };

  const tabs = [
    { id: 'overview', name: 'Market Overview', icon: '📊' },
    { id: 'sectors', name: 'Sector Analysis', icon: '🏢' },
    { id: 'movers', name: 'Price Movers', icon: '📈' },
    { id: 'volume', name: 'Volume Leaders', icon: '📊' },
    { id: 'all', name: 'All Stocks', icon: '📋' }
  ];

  const sectors = [...new Set(marketData.allStocks.map(s => s.sector).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading comprehensive market data...</p>
        </div>
      </div>
    );
  }

  const { marketStats, sectorBreakdown, volumeLeaders, priceMovers, marketTrends } = marketData;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Market Analysis</h1>
          <p className="text-gray-400">Comprehensive market data and sector insights for all NEPSE stocks</p>
        </div>

        {/* Market Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="rounded-xl p-4 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{marketStats?.totalCompanies || 0}</div>
              <div className="text-sm text-gray-400">Total Companies</div>
            </div>
          </div>
          <div className="rounded-xl p-4 border border-green-400/30" style={{ backgroundColor: 'rgba(0,40,0,0.15)', backdropFilter: 'blur(28px)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{marketStats?.gainers || 0}</div>
              <div className="text-sm text-gray-400">Gainers</div>
            </div>
          </div>
          <div className="rounded-xl p-4 border border-red-400/30" style={{ backgroundColor: 'rgba(40,0,0,0.15)', backdropFilter: 'blur(28px)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{marketStats?.losers || 0}</div>
              <div className="text-sm text-gray-400">Losers</div>
            </div>
          </div>
          <div className="rounded-xl p-4 border border-yellow-400/30" style={{ backgroundColor: 'rgba(40,40,0,0.15)', backdropFilter: 'blur(28px)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{marketStats?.unchanged || 0}</div>
              <div className="text-sm text-gray-400">Unchanged</div>
            </div>
          </div>
          <div className="rounded-xl p-4 border border-purple-400/30" style={{ backgroundColor: 'rgba(40,0,40,0.15)', backdropFilter: 'blur(28px)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                रु {marketStats?.totalMarketCap ? (marketStats.totalMarketCap / 1000000000000).toFixed(1) + 'T' : '0'}
              </div>
              <div className="text-sm text-gray-400">Market Cap</div>
            </div>
          </div>
          <div className="rounded-xl p-4 border border-teal-400/30" style={{ backgroundColor: 'rgba(0,40,40,0.15)', backdropFilter: 'blur(28px)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-400">
                {marketTrends?.breadth ? marketTrends.breadth.toFixed(1) + '%' : '0%'}
              </div>
              <div className="text-sm text-gray-400">Market Breadth</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-gray-800/30 rounded-lg p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Market Trends */}
            <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <h3 className="text-xl font-semibold text-white mb-4">Market Trends</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {marketTrends?.marketMomentum ? 
                      (marketTrends.marketMomentum > 0 ? '+' : '') + Number(marketTrends.marketMomentum || 0).toFixed(2) + '%' 
                      : '0%'}
                  </div>
                  <div className="text-sm text-gray-400">Market Momentum</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {marketTrends?.volatility ? marketTrends.volatility.toFixed(2) + '%' : '0%'}
                  </div>
                  <div className="text-sm text-gray-400">Volatility</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {marketStats?.volume ? (marketStats.volume / 1000000).toFixed(1) + 'M' : '0'}
                  </div>
                  <div className="text-sm text-gray-400">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    रु {marketStats?.avgPrice ? marketStats.avgPrice.toFixed(0) : '0'}
                  </div>
                  <div className="text-sm text-gray-400">Avg Price</div>
                </div>
              </div>
            </div>

            {/* Top Sectors by Market Cap */}
            <div className="rounded-xl p-6 border border-green-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <h3 className="text-xl font-semibold text-white mb-4">Top Sectors by Market Cap</h3>
              <div className="space-y-3">
                {sectorBreakdown.slice(0, 5).map((sector, index) => (
                  <div key={sector.name} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : index === 2 ? 'bg-orange-500' : 'bg-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{sector.name}</div>
                        <div className="text-sm text-gray-400">{sector.companies} companies</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        रु {Number(sector.marketCap / 1000000000 || 0).toFixed(1)}B
                      </div>
                      <div className={`text-sm ${sector.avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {sector.avgChange >= 0 ? '+' : ''}{Number(sector.avgChange || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Market Forecast */}
            <div className="rounded-xl p-6 border border-purple-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <h3 className="text-xl font-semibold text-white mb-4">AI Market Forecast</h3>
              <BatchForecastCard 
                symbols={volumeLeaders.slice(0, 6).map(stock => stock.symbol)}
                showTitle={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'sectors' && (
          <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
            <h3 className="text-xl font-semibold text-white mb-6">Sector Analysis</h3>
            <div className="space-y-4">
              {sectorBreakdown.map((sector, index) => (
                <div key={sector.name} className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-white">{sector.name}</h4>
                      <span className="text-sm text-gray-400">({sector.companies} companies)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        रु {Number(sector.marketCap / 1000000000 || 0).toFixed(1)}B
                      </div>
                      <div className={`text-sm ${sector.avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {sector.avgChange >= 0 ? '+' : ''}{Number(sector.avgChange || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(Number(sector.weight) || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{Number(sector.weight || 0).toFixed(1)}% of total market cap</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'movers' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div className="rounded-xl p-6 border border-green-400/30" style={{ backgroundColor: 'rgba(0,40,0,0.15)', backdropFilter: 'blur(28px)' }}>
              <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center">
                <span className="text-2xl mr-2">📈</span>
                Top Gainers
              </h3>
              <div className="space-y-3">
                {priceMovers.gainers.slice(0, 10).map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-green-500/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{stock.symbol}</div>
                        <div className="text-xs text-gray-400">{stock.sector}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">रु {Number(stock.price || 0).toFixed(2)}</div>
                      <div className="text-green-400 text-sm">
                        +{Number(stock.changePercent || stock.change || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="rounded-xl p-6 border border-red-400/30" style={{ backgroundColor: 'rgba(40,0,0,0.15)', backdropFilter: 'blur(28px)' }}>
              <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
                <span className="text-2xl mr-2">📉</span>
                Top Losers
              </h3>
              <div className="space-y-3">
                {priceMovers.losers.slice(0, 10).map((stock, index) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-red-500/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{stock.symbol}</div>
                        <div className="text-xs text-gray-400">{stock.sector}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">रु {Number(stock.price || 0).toFixed(2)}</div>
                      <div className="text-red-400 text-sm">
                        {Number(stock.changePercent || stock.change || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volume' && (
          <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
            <h3 className="text-xl font-semibold text-white mb-6">Volume Leaders</h3>
            <div className="space-y-3">
              {volumeLeaders.slice(0, 20).map((stock, index) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-blue-500/10 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{stock.symbol}</div>
                      <div className="text-sm text-gray-400">{stock.name}</div>
                      <div className="text-xs text-gray-500">{stock.sector}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {(stock.volume || stock.totalTradeQuantity || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Volume</div>
                    <div className="text-sm text-gray-400">
                      रु {((stock.turnover || stock.volume * stock.price || 0) / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search stocks by symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Sectors</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="symbol">Symbol</option>
                  <option value="volume">Volume</option>
                  <option value="change">Change %</option>
                  <option value="price">Price</option>
                  <option value="marketCap">Market Cap</option>
                </select>
              </div>
            </div>

            {/* All Stocks Table */}
            <div className="rounded-xl border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
              <div className="p-6 border-b border-gray-700/50">
                <h3 className="text-xl font-semibold text-white">
                  All Stocks ({getFilteredStocks().length} companies)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left p-4 text-gray-400 font-medium">Symbol</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Sector</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Price</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Change</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Volume</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Market Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStocks().slice(0, 50).map((stock) => (
                      <tr key={stock.symbol} className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors">
                        <td className="p-4">
                          <div className="text-white font-medium">{stock.symbol}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-300 text-sm">{stock.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-400 text-sm">{stock.sector}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-white font-medium">रु {Number(stock.price || 0).toFixed(2)}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-medium ${
                            (stock.changePercent || stock.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(stock.changePercent || stock.change || 0) >= 0 ? '+' : ''}
                            {Number(stock.changePercent || stock.change || 0).toFixed(2)}%
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-gray-300">{(stock.volume || stock.totalTradeQuantity || 0).toLocaleString()}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-gray-300">
                            रु {((stock.marketCap || 0) / 1000000000).toFixed(1)}B
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {getFilteredStocks().length > 50 && (
                <div className="p-4 text-center text-gray-400">
                  Showing first 50 results. Use filters to narrow down the list.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDepthPage;
