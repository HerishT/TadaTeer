import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

import ChatbotCard from './ChatbotCard';
import Modal from './Modal';
import MLForecastModal from './MLForecastModal';
import { useCompanyData } from '../hooks/useCompanyData';
import { getMockData } from '../utils/mockData';
import marketDataCache from '../services/marketDataCache';
import deterministicDataGenerator from '../services/deterministicDataGenerator';
import mlForecastService from '../services/mlForecastService';
import geminiService from '../services/geminiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Utility function to generate deterministic "random" values based on symbol
const getDeterministicRandom = (symbol, seed = 1) => {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs((hash * seed) % 1000) / 1000;
};

const Header = ({ onBack, company, onCompareClick, loading }) => (
  <header className="mb-8 flex-shrink-0">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">
            {loading ? (
              <div className="h-8 lg:h-10 bg-gray-700 animate-pulse rounded w-80"></div>
            ) : (
              `${company.name} (${company.symbol})`
            )}
          </h1>
          <button
            onClick={onCompareClick}
            className="bg-teal-600/80 text-white text-xs font-medium py-1.5 px-3 rounded-md hover:bg-teal-700 transition-colors whitespace-nowrap"
            title="Compare with sector peers"
          >
            Compare with Peers
          </button>
        </div>
        <p className="text-gray-400 mb-2">
          {loading ? (
            <div className="h-4 bg-gray-700 animate-pulse rounded w-48"></div>
          ) : (
            company.sector || 'Unknown Sector'
          )}
        </p>
        
        {/* Additional market info */}
        {!loading && company.high && (
          <div className="flex flex-wrap gap-4 lg:gap-6 text-sm text-gray-500">
            <span>High: रु {Number(company.high).toFixed(2)}</span>
            <span>Low: रु {Number(company.low).toFixed(2)}</span>
            <span>Open: रु {Number(company.open).toFixed(2)}</span>
            {company.volume && <span>Volume: {company.volume.toLocaleString()}</span>}
          </div>
        )}
      </div>
      <div className="text-right">
        {loading ? (
          <div>
            <div className="h-10 bg-gray-700 animate-pulse rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-700 animate-pulse rounded w-24"></div>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-3xl lg:text-4xl font-bold text-white whitespace-nowrap">
              रु {Number(company.price).toFixed(2)}
            </p>
            <p className={`text-lg ${company.change >= 0 ? 'text-green-400' : 'text-red-400'} whitespace-nowrap`}>
              {company.change >= 0 ? '+' : ''}{Number(company.change).toFixed(2)} ({Number(company.changePercent).toFixed(2)}%)
            </p>
            {company.lastTradedTime && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(company.lastTradedTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  </header>
);

const InsightsCard = ({ onInsightClick, companyData, mlForecast, mlForecastLoading, mlEnhancedForecast }) => {
  // Generate deterministic insights data based on symbol (for valuation, risk, sentiment)
  const generateMockInsights = () => {
    const currentPrice = companyData?.currentPrice || companyData?.price || 500;
    const changePercent = companyData?.changePercent || companyData?.change || 0;
    const symbol = companyData?.symbol || 'STOCK';
    
    // Create deterministic values based on symbol
    const getSymbolHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    const symbolHash = getSymbolHash(symbol);
    const seed1 = (symbolHash % 1000) / 1000;
    const seed2 = ((symbolHash * 7) % 1000) / 1000;
    const seed3 = ((symbolHash * 13) % 1000) / 1000;
    const seed4 = ((symbolHash * 19) % 1000) / 1000;
    
    return {
      valuation: {
        peRatio: (15 + seed1 * 20).toFixed(1),
        rating: seed2 > 0.6 ? 'Undervalued' : seed2 > 0.3 ? 'Fair Value' : 'Overvalued',
        score: Math.round(60 + seed3 * 30)
      },
      risk: {
        volatility: (10 + seed1 * 25).toFixed(1),
        beta: (0.8 + seed2 * 0.8).toFixed(2),
        riskLevel: seed3 > 0.7 ? 'High' : seed3 > 0.4 ? 'Medium' : 'Low'
      },
      sentiment: {
        score: Math.round(40 + seed1 * 40),
        mood: seed4 > 0.6 ? 'Positive' : seed4 > 0.3 ? 'Neutral' : 'Negative',
        social: Math.round(60 + seed2 * 30)
      }
    };
  };

  const insights = generateMockInsights();

  // Get forecast display data
  const getForecastDisplay = () => {
    if (mlForecastLoading) {
      return {
        text: '...',
        subtext: 'Loading...',
        color: 'text-gray-400'
      };
    }

    if (!mlForecast) {
      return {
        text: 'N/A',
        subtext: 'Unavailable',
        color: 'text-gray-400'
      };
    }

    const isUp = mlForecast.direction === 'UP';
    return {
      text: mlForecast.direction,
      subtext: `${mlForecast.confidence}% Confidence`,
      color: isUp ? 'text-green-400' : mlForecast.direction === 'DOWN' ? 'text-red-400' : 'text-yellow-400'
    };
  };

  const forecastDisplay = getForecastDisplay();

  return (
  <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 className="text-2xl font-semibold text-white mb-4">AI-Powered Insights</h2>
      <p className="text-gray-300 mb-6 text-sm">
        Mock AI analysis based on current market data and trends.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div
          className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-4 rounded-lg border border-green-700/50 hover:from-green-800/60 hover:to-green-700/40 cursor-pointer transition-all duration-300"
          onClick={() => onInsightClick('forecast', { basic: mlForecast, enhanced: mlEnhancedForecast })}
        >
          <h3 className="font-semibold text-white">ML Forecast</h3>
          <p className={`text-2xl font-bold mt-2 ${forecastDisplay.color}`}>
            {forecastDisplay.text}
          </p>
          <p className="text-xs text-green-200 mt-1">{forecastDisplay.subtext}</p>
        </div>
        <div
          className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 p-4 rounded-lg border border-yellow-700/50 hover:from-yellow-800/60 hover:to-yellow-700/40 cursor-pointer transition-all duration-300"
          onClick={() => onInsightClick('valuation')}
        >
          <h3 className="font-semibold text-white">Valuation</h3>
          <p className="text-2xl font-bold text-white mt-2">{insights.valuation.peRatio}</p>
          <p className="text-xs text-yellow-200 mt-1">P/E Ratio</p>
        </div>
        <div
          className="bg-gradient-to-br from-red-900/50 to-red-800/30 p-4 rounded-lg border border-red-700/50 hover:from-red-800/60 hover:to-red-700/40 cursor-pointer transition-all duration-300"
          onClick={() => onInsightClick('risk')}
        >
          <h3 className="font-semibold text-white">Risk</h3>
          <p className="text-2xl font-bold text-white mt-2">{insights.risk.volatility}%</p>
          <p className="text-xs text-red-200 mt-1">Volatility</p>
        </div>
        <div
          className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-4 rounded-lg border border-blue-700/50 hover:from-blue-800/60 hover:to-blue-700/40 cursor-pointer transition-all duration-300"
          onClick={() => onInsightClick('sentiment')}
        >
          <h3 className="font-semibold text-white">Sentiment</h3>
          <p className="text-2xl font-bold text-white mt-2">{insights.sentiment.score}</p>
          <p className="text-xs text-blue-200 mt-1">Sentiment Score</p>
        </div>
      </div>
    </div>
  );
};

// Helper functions for realistic price generation (outside component to prevent re-creation)
const createGaussianRandom = () => {
  let hasSpareGaussian = false;
  let spareGaussian;
  
  return () => {
    if (hasSpareGaussian) {
      hasSpareGaussian = false;
      return spareGaussian;
    }
    
    hasSpareGaussian = true;
    
    const u = 0.999999 * Math.random();
    const v = 0.999999 * Math.random();
    
    const mag = Math.sqrt(-2.0 * Math.log(u));
    spareGaussian = mag * Math.cos(2.0 * Math.PI * v);
    
    return mag * Math.sin(2.0 * Math.PI * v);
  };
};

const generateGaussianRandom = createGaussianRandom();

const PriceChartCard = ({ chartData, chartOptions, isLoading, error, onRetry, companyData }) => {
  const [selectedTimeSpan, setSelectedTimeSpan] = useState('1M');
  const [masterChartData, setMasterChartData] = useState(null);

  // Get pre-generated chart data from cache
  const getChartDataFromCache = useCallback((companySymbol, timeRange) => {
    if (!companySymbol) return null;
    
    try {
      // Use the cached chart data
      const cached = marketDataCache.getChartData(companySymbol, timeRange);
      if (cached) {
        return cached;
      }
      
      // Fallback to generating if not in cache (but this should rarely happen)
      console.warn(`Chart data not found in cache for ${companySymbol}, generating fallback`);
      const currentPrice = companyData?.currentPrice || companyData?.price || 500;
      const dataPoints = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 
                        timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : 
                        timeRange === '1Y' ? 365 : 730;
      
      return deterministicDataGenerator.generateChartData(companySymbol, currentPrice, dataPoints);
    } catch (error) {
      console.error('Error getting chart data:', error);
      return null;
    }
  }, [companyData]);

  // Update chart data when company or time span changes
  useEffect(() => {
    if (companyData?.symbol) {
      const newChartData = getChartDataFromCache(companyData.symbol, selectedTimeSpan);
      setMasterChartData(newChartData);
    }
  }, [companyData?.symbol, selectedTimeSpan, getChartDataFromCache]);

  // Extract chart data for specific timespan from master data
  const getChartDataForTimeSpan = useCallback((timeSpan) => {
    if (!masterChartData || !companyData) return chartData;

    // The cached data is already filtered for the specific time range
    return masterChartData;
  }, [masterChartData, companyData, chartData]);

  // Enhanced chart options for different time spans
  const getChartOptionsForTimeSpan = (timeSpan) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          titleColor: '#f3f4f6',
          bodyColor: '#f3f4f6',
          borderColor: '#374151',
          borderWidth: 1,
          callbacks: {
            title: (context) => {
              const date = new Date(context[0].label);
              return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            },
            label: (context) => `Price: रु ${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            color: '#9ca3af',
            maxTicksLimit: timeSpan === 'ALL' ? 8 : timeSpan === '1Y' ? 10 : 12,
            maxRotation: 0,
            minRotation: 0,
            callback: function(value, index, values) {
              const date = new Date(this.getLabelForValue(value));
              const month = date.toLocaleDateString('en-US', { month: 'short' });
              const day = date.getDate();
              const year = date.getFullYear();
              
              // Format based on time span
              if (timeSpan === '1M') {
                return `${month} ${day}`;
              } else if (timeSpan === '6M' || timeSpan === '1Y') {
                return `${month} ${year}`;
              } else {
                return `${month} ${year}`;
              }
            }
          }
        },
        y: {
          grid: { color: '#374151' },
          ticks: { 
            color: '#9ca3af',
            callback: (value) => `रु ${value.toFixed(0)}`
          }
        }
      }
    };

    return baseOptions;
  };

  // Get chart data for the selected timespan from master data
  const displayChartData = useMemo(() => {
    return getChartDataForTimeSpan(selectedTimeSpan);
  }, [selectedTimeSpan, getChartDataForTimeSpan]);

  const handleTimeSpanChange = (timeSpan) => {
    setSelectedTimeSpan(timeSpan);
  };

  return (
  <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Price Chart
            {isLoading && <span className="text-sm text-teal-400 ml-2">(Loading...)</span>}
          </h2>
        </div>
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
          {['1M', '6M', '1Y', 'ALL'].map((timeSpan) => (
            <button
              key={timeSpan}
              onClick={() => handleTimeSpanChange(timeSpan)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedTimeSpan === timeSpan
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              {timeSpan}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-red-400 mb-2">
              Failed to load price data: {error}
            </div>
            <button 
              onClick={onRetry}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <Line 
            data={displayChartData || chartData} 
            options={getChartOptionsForTimeSpan(selectedTimeSpan)} 
          />
        )}
      </div>
    </div>
  );
};

const FinancialsCard = ({ chartData, companyData }) => {
  const [primaryTab, setPrimaryTab] = useState('income');
  const [secondaryTabs, setSecondaryTabs] = useState({
    income: 'revenue',
    balance: 'assetsLiabilities',
    cashflow: 'operating'
  });

  // Generate deterministic financial data based on company symbol
  const generateMockFinancials = () => {
    const symbol = companyData?.symbol || 'STOCK';
    
    // Create deterministic values based on symbol
    const getSymbolSeed = (str, multiplier = 1) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs((hash * multiplier) % 1000) / 1000;
    };
    
    const baseRevenue = 500000000 + getSymbolSeed(symbol, 1) * 2000000000; // 500M - 2.5B
    const years = ['2021', '2022', '2023', '2024'];
    
    const mockData = {
      income: {
        revenue: {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Total Revenue',
              data: years.map((_, i) => Math.round(baseRevenue * (1 + (i * 0.1) + (getSymbolSeed(symbol, i + 2) - 0.5) * 0.2))),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4
            }, {
              label: 'Cost of Revenue',
              data: years.map((_, i) => Math.round(baseRevenue * 0.6 * (1 + (i * 0.09) + (getSymbolSeed(symbol, i + 5) - 0.5) * 0.15))),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: { ...chartData?.revenue?.options || {} }
        },
        profit: {
          type: 'bar',
          data: {
            labels: years,
            datasets: [{
              label: 'Gross Profit',
              data: years.map((_, i) => Math.round(baseRevenue * 0.4 * (1 + (i * 0.12) + (getSymbolSeed(symbol, i + 8) - 0.5) * 0.2))),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1
            }, {
              label: 'Operating Profit',
              data: years.map((_, i) => Math.round(baseRevenue * 0.25 * (1 + (i * 0.1) + (getSymbolSeed(symbol, i + 11) - 0.5) * 0.25))),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            }, {
              label: 'Net Profit',
              data: years.map((_, i) => Math.round(baseRevenue * 0.15 * (1 + (i * 0.08) + (getSymbolSeed(symbol, i + 14) - 0.5) * 0.3))),
              backgroundColor: 'rgba(168, 85, 247, 0.8)',
              borderColor: 'rgb(168, 85, 247)',
              borderWidth: 1
            }]
          },
          options: { ...chartData?.profit?.options || {} }
        },
        margins: {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Gross Margin %',
              data: years.map((_, i) => Math.round(35 + getSymbolSeed(symbol, i + 17) * 15)),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: false,
              tension: 0.4
            }, {
              label: 'Operating Margin %',
              data: years.map((_, i) => Math.round(20 + getSymbolSeed(symbol, i + 20) * 15)),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: false,
              tension: 0.4
            }, {
              label: 'Net Margin %',
              data: years.map((_, i) => Math.round(10 + getSymbolSeed(symbol, i + 23) * 12)),
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: false,
              tension: 0.4
            }]
          },
          options: { ...chartData?.margins?.options || {} }
        },
        eps: {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Earnings Per Share (EPS)',
              data: years.map((_, i) => (15 + i * 2 + Math.random() * 5).toFixed(2)),
              borderColor: 'rgb(236, 72, 153)',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              fill: true,
              tension: 0.4
            }, {
              label: 'Book Value Per Share',
              data: years.map((_, i) => (120 + i * 15 + Math.random() * 20).toFixed(2)),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: false,
              tension: 0.4
            }]
          },
          options: { ...chartData?.eps?.options || {} }
        }
      },
      balance: {
        assetsLiabilities: {
          type: 'bar',
          data: {
            labels: years,
            datasets: [{
              label: 'Total Assets',
              data: years.map((_, i) => Math.round(baseRevenue * 2 * (1 + i * 0.12))),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1
            }, {
              label: 'Total Liabilities',
              data: years.map((_, i) => Math.round(baseRevenue * 1.2 * (1 + i * 0.1))),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 1
            }]
          },
          options: { 
            ...chartData?.assetsLiabilities?.options || {},
            scales: {
              x: { stacked: false },
              y: { stacked: false }
            }
          }
        },
        equity: {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Shareholders Equity',
              data: years.map((_, i) => Math.round(baseRevenue * 0.8 * (1 + i * 0.15))),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4
            }, {
              label: 'Return on Equity %',
              data: years.map(() => Math.round(12 + Math.random() * 8)),
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: false,
              tension: 0.4,
              yAxisID: 'y1'
            }]
          },
          options: { 
            ...chartData?.equity?.options || {},
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                  drawOnChartArea: false,
                },
              },
            }
          }
        },
        ratios: {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Debt-to-Equity Ratio',
              data: years.map(() => (0.3 + Math.random() * 0.8).toFixed(2)),
              backgroundColor: 'rgba(168, 85, 247, 0.8)',
              borderColor: 'rgb(168, 85, 247)',
              borderWidth: 2,
              fill: false,
              tension: 0.4
            }, {
              label: 'Current Ratio',
              data: years.map(() => (1.2 + Math.random() * 0.8).toFixed(2)),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              fill: false,
              tension: 0.4
            }, {
              label: 'Quick Ratio',
              data: years.map(() => (0.8 + Math.random() * 0.6).toFixed(2)),
              backgroundColor: 'rgba(236, 72, 153, 0.8)',
              borderColor: 'rgb(236, 72, 153)',
              borderWidth: 2,
              fill: false,
              tension: 0.4
            }]
          },
          options: { ...chartData?.ratios?.options || {} }
        }
      },
      cashflow: {
        operating: {
          type: 'bar',
          data: {
            labels: years,
            datasets: [{
              label: 'Operating Cash Flow',
              data: years.map((_, i) => Math.round(baseRevenue * 0.2 * (1 + (i * 0.08) + (Math.random() - 0.5) * 0.2))),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1
            }, {
              label: 'Investing Cash Flow',
              data: years.map(() => Math.round(-baseRevenue * 0.05 * (0.5 + Math.random()))),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 1
            }, {
              label: 'Financing Cash Flow',
              data: years.map(() => Math.round(baseRevenue * 0.02 * (Math.random() - 0.5) * 2)),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            }]
          },
          options: { ...chartData?.operating?.options || {} }
        },
        freeCashFlow: {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Free Cash Flow',
              data: years.map((_, i) => {
                const operating = baseRevenue * 0.2 * (1 + (i * 0.08) + (Math.random() - 0.5) * 0.2);
                const capex = baseRevenue * 0.06 * (0.8 + Math.random() * 0.4);
                return Math.round(operating - capex);
              }),
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              fill: true,
              tension: 0.4
            }, {
              label: 'Capital Expenditures',
              data: years.map(() => -Math.round(baseRevenue * 0.06 * (0.8 + Math.random() * 0.4))),
              borderColor: 'rgb(236, 72, 153)',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              fill: false,
              tension: 0.4
            }]
          },
          options: { 
            ...chartData?.freeCashFlow?.options || {},
            scales: {
              y: {
                beginAtZero: false,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { 
                  color: 'rgba(255, 255, 255, 0.8)',
                  callback: function(value) {
                    return '$' + (value / 1000000).toFixed(1) + 'M';
                  }
                }
              },
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.8)' }
              }
            }
          }
        }
      }
    };

    return mockData;
  };

  const mockFinancials = generateMockFinancials();

  const handleSecondaryTabClick = (primary, secondary) => {
    setSecondaryTabs(prev => ({ ...prev, [primary]: secondary }));
  };

  const renderChart = (chart) => {
    if (!chart) return <div className="text-gray-400 text-center py-8">No data available</div>;
    const ChartComponent = chart.type === 'line' ? Line : Bar;
    return (
      <div className="w-full h-full">
        <ChartComponent 
          data={chart.data} 
          options={{
            ...chart.options,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              ...chart.options?.plugins,
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#e5e7eb',
                  usePointStyle: true,
                  padding: 20
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(55, 65, 81, 0.5)' },
                ticks: { color: '#9ca3af' }
              },
              y: {
                grid: { color: 'rgba(55, 65, 81, 0.5)' },
                ticks: {
                  color: '#9ca3af',
                  callback: (value) => `रु ${new Intl.NumberFormat('en-NP', { notation: 'compact' }).format(value)}`
                }
              }
            }
          }} 
        />
      </div>
    );
  };

  const getSecondaryTabsForPrimary = (primary) => {
    switch (primary) {
      case 'income':
        return [
          { key: 'revenue', label: 'Revenue' },
          { key: 'profit', label: 'Profit' },
          { key: 'margins', label: 'Margins' }
        ];
      case 'balance':
        return [
          { key: 'assetsLiabilities', label: 'Assets & Liabilities' },
          { key: 'equity', label: 'Equity' },
          { key: 'ratios', label: 'Ratios' }
        ];
      case 'cashflow':
        return [
          { key: 'operating', label: 'Operating' },
          { key: 'investing', label: 'Investing' },
          { key: 'financing', label: 'Financing' }
        ];
      default:
        return [];
    }
  };

  return (
  <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(36px)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-4">
        <h2 className="text-xl font-semibold text-white">Financial Statements (Annual)</h2>
        <div className="text-xs text-gray-400">Mock Data - Real statements coming soon</div>
      </div>
      
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg mb-4">
        <button 
          onClick={() => setPrimaryTab('income')} 
          className={`tab-button px-3 py-1 text-xs rounded-md ${primaryTab === 'income' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
          Income
        </button>
        <button 
          onClick={() => setPrimaryTab('balance')} 
          className={`tab-button px-3 py-1 text-xs rounded-md ${primaryTab === 'balance' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
          Balance Sheet
        </button>
        <button 
          onClick={() => setPrimaryTab('cashflow')} 
          className={`tab-button px-3 py-1 text-xs rounded-md ${primaryTab === 'cashflow' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
          Cash Flow
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-800/30 p-1 rounded-lg mb-6">
        {getSecondaryTabsForPrimary(primaryTab).map(tab => (
          <button
            key={tab.key}
            onClick={() => handleSecondaryTabClick(primaryTab, tab.key)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              secondaryTabs[primaryTab] === tab.key 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-80 w-full">
        {renderChart(mockFinancials[primaryTab]?.[secondaryTabs[primaryTab]])}
      </div>
    </div>
  );
};

const OwnershipDividendCard = ({ pieData, pieOptions, historyData }) => {
  const [activeTab, setActiveTab] = useState('structure');

  return (
  <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(36px)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex space-x-4 border-b border-white/20 mb-4">
        <button 
          onClick={() => setActiveTab('structure')} 
          className={`secondary-tab-button text-sm pb-2 border-b-2 border-transparent ${activeTab === 'structure' ? 'active' : 'text-gray-400'}`}
        >
          Ownership Structure
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`secondary-tab-button text-sm pb-2 border-b-2 border-transparent ${activeTab === 'history' ? 'active' : 'text-gray-400'}`}
        >
          Dividend History
        </button>
      </div>
      <div style={{ display: activeTab === 'structure' ? 'block' : 'none' }}>
        <div className="h-80">
          <Doughnut data={pieData} options={pieOptions} />
        </div>
      </div>
      <div style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
        <ul className="space-y-3 text-gray-300">
          {historyData.map(item => (
            <li key={item.year} className="flex justify-between items-center p-2 rounded-lg bg-gray-800/50">
              <span><strong className="text-white">{item.year}:</strong> {item.details}</span>
              <span className="text-xs text-gray-500">Ex-Date: {item.exDate}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const NewsFeedCard = ({ newsItems }) => (
  <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(36px)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <h2 className="text-xl font-semibold text-white mb-4">Key Events & News Feed</h2>
    <div className="space-y-4">
      {newsItems.map((item, index) => (
        <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-gray-800/50">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              item.sentiment === 'Positive'
                ? 'bg-green-500/20 text-green-400'
                : item.sentiment === 'Alert'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {item.sentiment}
          </span>
          <div>
            <p className="font-medium text-white">{item.title}</p>
            <p className="text-xs text-gray-500">
              Source: {item.source} | {item.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DashboardPage = ({ companySymbol, onBack }) => {
  const [modal, setModal] = useState({ isOpen: false, type: null });
  const [mlForecastData, setMlForecastData] = useState(null);
  const [mlForecastLoading, setMlForecastLoading] = useState(true);
  const [marketTab, setMarketTab] = useState('overview');
  
  // Scroll to top when component mounts or companySymbol changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [companySymbol]);
  
  // Get real company data using the custom hook
  const { companyData, priceChartData, loading, error, refetch } = useCompanyData(companySymbol);

  // Fetch ML forecast once when component loads or symbol changes
  useEffect(() => {
    const fetchMLForecast = async () => {
      if (!companySymbol) return;
      
      setMlForecastLoading(true);
      try {
        // Get both basic and enhanced forecast data
        const [basicForecast, enhancedForecast] = await Promise.all([
          mlForecastService.getBasicForecast(companySymbol),
          mlForecastService.getEnhancedForecast(companySymbol)
        ]);
        
        setMlForecastData({
          basic: basicForecast,
          enhanced: enhancedForecast
        });
      } catch (error) {
        console.error('Failed to fetch ML forecast:', error);
        // Set fallback mock data
        setMlForecastData({
          basic: mlForecastService.getMockForecast(companySymbol),
          enhanced: mlForecastService.getMockEnhancedForecast(companySymbol)
        });
      }
      setMlForecastLoading(false);
    };

    fetchMLForecast();
  }, [companySymbol]);

  // Fallback to mock data if real data is not available
  const fallbackCompanyData = {
    name: "Nabil Bank Limited",
    symbol: "NABIL",
    sector: "Commercial Bank - NEPSE",
    price: 545.50,
    change: 2.50,
    changePercent: 0.46
  };

  // Use real data if available, otherwise use fallback
  const displayCompanyData = companyData || fallbackCompanyData;

  const { chartOptions, allChartData, peerChart, ownershipData } = getMockData();

  // Helper function for deterministic random generation
  const getSymbolHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
    }
    return Math.abs(hash);
  };

  // Market data functions
  const getMarketData = () => {
    const hash = getSymbolHash(companySymbol + 'market');
    return {
      nepseIndex: 2156.45 + (hash % 200) - 100,
      nepseChange: ((hash % 600) - 300) / 100,
      marketCap: (4.2 + ((hash % 100) - 50) / 100).toFixed(1),
      volume: (15.2 + ((hash % 50) - 25) / 10).toFixed(1) + 'M',
      turnover: (2850 + (hash % 500) - 250).toString()
    };
  };

  const getSectorPerformance = () => {
    const sectors = [
      { name: 'Commercial Banks', companies: 18 },
      { name: 'Hydropower', companies: 45 },
      { name: 'Finance', companies: 25 },
      { name: 'Life Insurance', companies: 12 },
      { name: 'Non-Life Insurance', companies: 18 },
      { name: 'Hotels & Tourism', companies: 10 }
    ];

    return sectors.map((sector, index) => {
      const hash = getSymbolHash(companySymbol + sector.name);
      return {
        ...sector,
        change: ((hash % 1000) - 500) / 100,
        marketCap: (0.5 + ((hash % 30) / 10)).toFixed(1),
        volume: (5 + (hash % 15)).toString(),
        top: ['NABIL', 'ADBL', 'EBL', 'HBL', 'NICA'][hash % 5]
      };
    });
  };

  const getMarketOverviewChart = () => {
    const hash = getSymbolHash(companySymbol + 'overview');
    const baseIndex = 2000;
    const labels = [];
    const data = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toISOString().split('T')[0]);
      
      const dayHash = getSymbolHash(companySymbol + date.toDateString());
      const volatility = 20;
      const trend = i < 15 ? 1.002 : 0.998; // Recent uptrend
      const randomFactor = ((dayHash % 100) - 50) / 100 * volatility;
      
      const value = i === 30 ? baseIndex : data[data.length - 1] * trend + randomFactor;
      data.push(Math.max(1800, Math.min(2400, value)));
    }

    return {
      labels,
      datasets: [{
        label: 'NEPSE Index',
        data,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: true,
        tension: 0.1
      }]
    };
  };

  const getSectorChart = () => {
    const sectorData = getSectorPerformance();
    
    return {
      labels: sectorData.map(s => s.name),
      datasets: [{
        label: 'Performance (%)',
        data: sectorData.map(s => s.change),
        backgroundColor: sectorData.map(s => 
          s.change > 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
        ),
        borderColor: sectorData.map(s => 
          s.change > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1
      }]
    };
  };

  const getPeerComparisonChart = () => {
    const peers = ['NABIL', 'ADBL', 'EBL', 'HBL', 'NICA'];
    const colors = ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];
    
    return {
      labels: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      }),
      datasets: peers.map((peer, index) => {
        const peerData = Array.from({ length: 30 }, (_, i) => {
          const hash = getSymbolHash(peer + i);
          return 100 + ((hash % 40) - 20);
        });

        return {
          label: peer,
          data: peerData,
          borderColor: colors[index],
          backgroundColor: `${colors[index]}20`,
          fill: false,
          tension: 0.1
        };
      })
    };
  };

  const getMarketChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9ca3af' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#9ca3af' }
      }
    }
  });

  const getSectorChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#9ca3af' }
      }
    }
  });

  const getPeerChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9ca3af' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#9ca3af' }
      },
      y: {
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { color: '#9ca3af' }
      }
    }
  });

  // Generate dynamic modal content based on company data
  const generateModalContent = () => {
    const currentPrice = Number(displayCompanyData?.currentPrice || displayCompanyData?.price || 500);
    const changePercent = Number(displayCompanyData?.changePercent || displayCompanyData?.change || 0);
    const symbol = displayCompanyData?.symbol || 'STOCK';
    const sector = displayCompanyData?.sector || displayCompanyData?.category || 'Commercial Banks';
    
    // Create deterministic "random" values based on symbol
    const getSymbolHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const symbolHash = getSymbolHash(symbol);
    const seed1 = (symbolHash % 1000) / 1000; // 0-1 based on symbol
    const seed2 = ((symbolHash * 7) % 1000) / 1000;
    const seed3 = ((symbolHash * 13) % 1000) / 1000;
    const seed4 = ((symbolHash * 19) % 1000) / 1000;
    const seed5 = ((symbolHash * 23) % 1000) / 1000;
    
    // Get peer companies from the same sector
    const getPeerCompanies = () => {
      try {
        const allCompanies = marketDataCache.getAllCompanies();
        const peers = allCompanies
          .filter(company => 
            company.sector === sector && 
            company.symbol !== symbol
          )
          .slice(0, 5) // Get top 5 peers
          .map(peer => ({
            symbol: peer.symbol,
            name: peer.name,
            price: Number(peer.currentPrice || peer.price || 0),
            change: Number(peer.changePercent || peer.change || (Math.random() - 0.5) * 4),
            marketCap: Number(peer.marketCap || (peer.price * 1000000 * (50 + Math.random() * 200)))
          }));
        
        return peers.length > 0 ? peers : [
          // Fallback mock data if no peers found
          { symbol: 'NABIL', name: 'Nabil Bank Limited', price: 1200, change: 2.5, marketCap: 25000000000 },
          { symbol: 'SCBL', name: 'Standard Chartered Bank Nepal', price: 450, change: -1.2, marketCap: 18000000000 },
          { symbol: 'HBL', name: 'Himalayan Bank Limited', price: 520, change: 1.8, marketCap: 22000000000 },
          { symbol: 'NBL', name: 'Nepal Bank Limited', price: 380, change: 0.5, marketCap: 15000000000 },
          { symbol: 'RBCL', name: 'Rastriya Banijya Bank', price: 290, change: -0.8, marketCap: 12000000000 }
        ].filter(peer => peer.symbol !== symbol);
      } catch (error) {
        console.log('Error getting peer companies:', error);
        // Return mock data as fallback
        return [
          { symbol: 'NABIL', name: 'Nabil Bank Limited', price: 1200, change: 2.5, marketCap: 25000000000 },
          { symbol: 'SCBL', name: 'Standard Chartered Bank Nepal', price: 450, change: -1.2, marketCap: 18000000000 },
          { symbol: 'HBL', name: 'Himalayan Bank Limited', price: 520, change: 1.8, marketCap: 22000000000 },
          { symbol: 'NBL', name: 'Nepal Bank Limited', price: 380, change: 0.5, marketCap: 15000000000 },
          { symbol: 'RBCL', name: 'Rastriya Banijya Bank', price: 290, change: -0.8, marketCap: 12000000000 }
        ].filter(peer => peer.symbol !== symbol);
      }
    };

    const insights = {
      forecast: {
        targetPrice: Math.round(currentPrice * (1 + (0.05 + seed1 * 0.15))),
        confidence: Math.round(65 + seed2 * 25),
        timeframe: seed3 > 0.5 ? '6-Month' : '12-Month',
        trend: changePercent > 2 ? 'Strong Bullish' : changePercent > 0 ? 'Bullish' : changePercent < -2 ? 'Bearish' : 'Neutral'
      },
      valuation: {
        peRatio: (15 + seed1 * 20).toFixed(1),
        pbRatio: (1.2 + seed2 * 2.5).toFixed(1),
        rating: seed3 > 0.6 ? 'Undervalued' : seed3 > 0.3 ? 'Fair Value' : 'Overvalued',
        fairValue: Math.round(currentPrice * (0.9 + seed4 * 0.2))
      },
      risk: {
        volatility: (15 + seed2 * 25).toFixed(1),
        beta: (0.8 + seed3 * 0.8).toFixed(2),
        riskLevel: seed4 > 0.7 ? 'High' : seed4 > 0.4 ? 'Medium' : 'Low',
        maxDrawdown: (5 + seed5 * 15).toFixed(1)
      },
      sentiment: {
        score: Math.round(40 + seed1 * 40),
        newsCount: Math.round(5 + seed2 * 15),
        positiveRatio: Math.round(50 + seed3 * 40),
        socialMentions: Math.round(100 + seed4 * 500)
      }
    };

    return {
      'forecast': {
        title: 'AI Forecast Analysis',
        content: (
          <div className="space-y-4">
            <div>
              <strong className="text-white">{insights.forecast.timeframe} Price Target:</strong>{' '}
              <span className="text-green-400">रु {insights.forecast.targetPrice}</span>
              <div className="text-sm text-gray-400 mt-1">
                Confidence: {insights.forecast.confidence}% | Trend: {insights.forecast.trend}
              </div>
            </div>
            <div>
              <strong className="text-white">Technical Analysis:</strong>{' '}
              <span className="text-blue-400">
                {changePercent > 0 ? 'Positive momentum with bullish indicators' : 'Consolidation phase with mixed signals'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              *AI-generated forecast based on technical and market analysis. Not financial advice.
            </div>
          </div>
        )
      },
      'valuation': {
        title: 'Valuation Analysis',
        content: (
          <div className="space-y-4">
            <div>
              <strong className="text-white">P/E Ratio:</strong>{' '}
              <span className="text-yellow-400">{insights.valuation.peRatio}</span>
              <div className="text-sm text-gray-400">vs Industry Average: 18.5</div>
            </div>
            <div>
              <strong className="text-white">P/B Ratio:</strong>{' '}
              <span className="text-yellow-400">{insights.valuation.pbRatio}</span>
            </div>
            <div>
              <strong className="text-white">Fair Value Estimate:</strong>{' '}
              <span className="text-green-400">रु {insights.valuation.fairValue}</span>
            </div>
            <div>
              <strong className="text-white">Rating:</strong>{' '}
              <span className={`font-medium ${
                insights.valuation.rating === 'Undervalued' ? 'text-green-400' : 
                insights.valuation.rating === 'Fair Value' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {insights.valuation.rating}
              </span>
            </div>
          </div>
        )
      },
      'risk': {
        title: 'Risk Analysis',
        content: (
          <div className="space-y-4">
            <div>
              <strong className="text-white">30-Day Volatility:</strong>{' '}
              <span className="text-red-400">{insights.risk.volatility}%</span>
            </div>
            <div>
              <strong className="text-white">Beta (Market Risk):</strong>{' '}
              <span className="text-blue-400">{insights.risk.beta}</span>
              <div className="text-sm text-gray-400">
                {parseFloat(insights.risk.beta) > 1 ? 'More volatile than market' : 'Less volatile than market'}
              </div>
            </div>
            <div>
              <strong className="text-white">Risk Level:</strong>{' '}
              <span className={`font-medium ${
                insights.risk.riskLevel === 'High' ? 'text-red-400' : 
                insights.risk.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {insights.risk.riskLevel}
              </span>
            </div>
            <div>
              <strong className="text-white">Max Drawdown (1Y):</strong>{' '}
              <span className="text-red-400">-{insights.risk.maxDrawdown}%</span>
            </div>
          </div>
        )
      },
      'sentiment': {
        title: 'Market Sentiment Analysis',
        content: (
          <div className="space-y-4">
            <div>
              <strong className="text-white">Sentiment Score:</strong>{' '}
              <span className="text-blue-400">{insights.sentiment.score}/100</span>
              <div className="text-sm text-gray-400">
                Based on {insights.sentiment.newsCount} recent news articles
              </div>
            </div>
            <div>
              <strong className="text-white">Positive Coverage:</strong>{' '}
              <span className="text-green-400">{insights.sentiment.positiveRatio}%</span>
            </div>
            <div>
              <strong className="text-white">Social Media Mentions:</strong>{' '}
              <span className="text-purple-400">{insights.sentiment.socialMentions}</span>
              <div className="text-sm text-gray-400">Past 7 days</div>
            </div>
            <div>
              <strong className="text-white">Overall Sentiment:</strong>{' '}
              <span className={`font-medium ${
                insights.sentiment.score > 70 ? 'text-green-400' : 
                insights.sentiment.score > 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {insights.sentiment.score > 70 ? 'Positive' : insights.sentiment.score > 50 ? 'Neutral' : 'Negative'}
              </span>
            </div>
          </div>
        )
      },
      'compare': {
        title: `Peer Comparison - ${sector}`,
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center p-3 bg-teal-900/30 rounded-lg border border-teal-500/30">
                <div>
                  <div className="font-medium text-white">{symbol}</div>
                  <div className="text-xs text-gray-400">{displayCompanyData?.name || 'Current Company'}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">रु {Number(currentPrice || 0).toLocaleString()}</div>
                  <div className={`text-xs ${Number(changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(changePercent || 0) >= 0 ? '+' : ''}{Number(changePercent || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
              {getPeerCompanies().map((peer, index) => (
                <div key={peer.symbol} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <div className="font-medium text-white">{peer.symbol}</div>
                    <div className="text-xs text-gray-400">{peer.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">रु {Number(peer.price || 0).toLocaleString()}</div>
                    <div className={`text-xs ${Number(peer.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(peer.change || 0) >= 0 ? '+' : ''}{Number(peer.change || 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <h4 className="text-sm font-medium text-blue-400 mb-2">Sector Performance</h4>
              <div className="text-xs text-gray-300">
                Average sector return: <span className="text-blue-400">+1.2%</span> (last 30 days)
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {symbol} vs sector: <span className={changePercent > 1.2 ? 'text-green-400' : 'text-red-400'}>
                  {changePercent > 1.2 ? 'Outperforming' : 'Underperforming'}
                </span>
              </div>
            </div>
          </div>
        )
      },
    };
  };

  const modalContent = generateModalContent();

  const handleInsightClick = async (insightType, mlForecastData = null) => {
    if (insightType === 'forecast' && mlForecastData) {
      // Handle ML forecast modal - mlForecastData now contains both basic and enhanced
      setModal({ 
        isOpen: true, 
        type: 'ml_forecast',
        data: mlForecastData
      });
    } else if (modalContent[insightType]) {
      setModal({ isOpen: true, type: insightType });
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: null });

  const newsItems = [
    {
      sentiment: 'Positive',
      title: 'Nabil Bank reports 15% YoY profit growth in Q4 report.',
      source: 'Merolagani',
      date: '2025-08-20'
    },
    {
      sentiment: 'Alert',
      title: 'Unusual trading volume detected (2.5x 30-day average).',
      source: 'TadaTeer Anomaly Detection',
      date: '2025-08-18'
    },
    {
      sentiment: 'Neutral',
      title: 'NRB issues new circular on lending rates.',
      source: 'Nepal Rastra Bank',
      date: '2025-08-15'
    },
  ];

  return (
    <div className="relative z-10 pt-32 p-4 md:p-8 min-h-screen">
      {/* Back to Search Button */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="text-white/70 hover:text-white/90 transition-all duration-300 inline-flex items-center space-x-1.5 border border-white/5 rounded-full px-3 py-1.5 hover:border-white/10 text-xs font-medium"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(28px)' }}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Header
              onBack={onBack}
              company={displayCompanyData}
              onCompareClick={() => handleInsightClick('compare')}
              loading={loading}
            />
            <InsightsCard 
              onInsightClick={handleInsightClick} 
              companyData={displayCompanyData}
              mlForecast={mlForecastData?.basic}
              mlForecastLoading={mlForecastLoading}
              mlEnhancedForecast={mlForecastData?.enhanced}
            />
            <PriceChartCard
              chartData={priceChartData || chartOptions.priceChart.data}
              chartOptions={chartOptions.priceChart.options}
              isLoading={loading}
              error={error}
              onRetry={refetch}
              companyData={displayCompanyData}
            />
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(36px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-xl font-semibold text-white mb-4">Market Overview & Sector Analysis</h2>
              
              {/* Tabs for different views */}
              <div className="flex space-x-4 mb-6">
                <button 
                  onClick={() => setMarketTab('overview')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    marketTab === 'overview' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Market Overview
                </button>
                <button 
                  onClick={() => setMarketTab('sectors')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    marketTab === 'sectors' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Sector Analysis
                </button>
                <button 
                  onClick={() => setMarketTab('peers')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    marketTab === 'peers' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Peer Comparison
                </button>
              </div>

              {/* Market Overview Tab */}
              {marketTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">NEPSE Index</div>
                      <div className="text-white font-semibold">{getMarketData().nepseIndex.toLocaleString()}</div>
                      <div className={`text-xs ${getMarketData().nepseChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {getMarketData().nepseChange > 0 ? '+' : ''}{getMarketData().nepseChange.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Market Cap</div>
                      <div className="text-white font-semibold">रु {getMarketData().marketCap}</div>
                      <div className="text-xs text-gray-400">NPR Trillion</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Volume</div>
                      <div className="text-white font-semibold">{getMarketData().volume}</div>
                      <div className="text-xs text-gray-400">Shares</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Turnover</div>
                      <div className="text-white font-semibold">रु {getMarketData().turnover}M</div>
                      <div className="text-xs text-gray-400">NPR Million</div>
                    </div>
                  </div>
                  <div className="h-80">
                    <Line data={getMarketOverviewChart()} options={getMarketChartOptions()} />
                  </div>
                </div>
              )}

              {/* Sector Analysis Tab */}
              {marketTab === 'sectors' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {getSectorPerformance().map((sector, index) => (
                      <div key={sector.name} className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-white font-medium">{sector.name}</div>
                          <div className={`text-sm ${sector.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {sector.companies} companies | Market Cap: रु {sector.marketCap}T
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          Top: {sector.top} | Volume: {sector.volume}M
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-80">
                    <Bar data={getSectorChart()} options={getSectorChartOptions()} />
                  </div>
                </div>
              )}

              {/* Peer Comparison Tab */}
              {marketTab === 'peers' && (
                <div className="h-80">
                  <Line data={getPeerComparisonChart()} options={getPeerChartOptions()} />
                </div>
              )}
            </div>
            <FinancialsCard chartData={allChartData} companyData={displayCompanyData} />
            <OwnershipDividendCard 
              pieData={ownershipData.pieData} 
              pieOptions={ownershipData.pieOptions} 
              historyData={ownershipData.historyData} 
            />
            <NewsFeedCard newsItems={newsItems} />
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-20 z-20 space-y-6">
              <ChatbotCard companyData={displayCompanyData} />
            </div>
          </div>
        </main>
      </div>
      <Modal
        isOpen={modal.isOpen && modal.type !== 'ml_forecast'}
        onClose={closeModal}
        title={modal.isOpen && modal.type !== 'ml_forecast' ? modalContent[modal.type]?.title : ''}
      >
        {modal.isOpen && modal.type !== 'ml_forecast' ? modalContent[modal.type]?.content : null}
      </Modal>

      <MLForecastModal
        isOpen={modal.isOpen && modal.type === 'ml_forecast'}
        onClose={closeModal}
        symbol={displayCompanyData?.symbol}
        forecastData={modal.data?.basic}
        enhancedForecastData={modal.data?.enhanced}
      />
    </div>
  );
};

export default DashboardPage;
