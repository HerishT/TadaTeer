import React, { useState, useEffect } from 'react';
import marketApiService from '../services/marketApiService';

const SectorsPage = () => {
  const [sectorsData, setSectorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);

  useEffect(() => {
    const fetchSectorsData = async () => {
      setLoading(true);
      try {
        const subIndices = await marketApiService.getNepseSubIndices();
        setSectorsData(Array.isArray(subIndices) ? subIndices : []);
      } catch (err) {
        console.error('Error fetching sectors data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSectorsData();
  }, []);

  const getSectorIcon = (sectorName) => {
    const name = sectorName.toLowerCase();
    if (name.includes('bank')) return '🏦';
    if (name.includes('development')) return '🏗️';
    if (name.includes('finance')) return '💳';
    if (name.includes('hotel') || name.includes('tourism')) return '🏨';
    if (name.includes('hydro') || name.includes('power')) return '⚡';
    if (name.includes('investment')) return '📈';
    if (name.includes('life insurance')) return '🛡️';
    if (name.includes('manufacturing') || name.includes('processing')) return '🏭';
    if (name.includes('microfinance')) return '💰';
    if (name.includes('non life insurance')) return '🚗';
    if (name.includes('trading')) return '🛒';
    if (name.includes('mutual fund')) return '📊';
    return '📋';
  };

  const getSectorColor = (change) => {
    if (change > 0) return 'green';
    if (change < 0) return 'red';
    return 'yellow';
  };

  const formatSectorName = (name) => {
    return name.replace(' Sub-Index', '').replace('Sub-Index', '');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading sectors data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-32 relative z-10">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Sector Performance</h1>
          <p className="text-gray-400">NEPSE sub-indices and sector analysis</p>
        </div>

        {/* Sectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectorsData.length > 0 ? (
            sectorsData.map((sector, index) => {
              const change = sector.change || sector.percentChange || 0;
              const colorClass = getSectorColor(change);
              
              return (
                <div
                  key={sector.indexName || index}
                  className="rounded-xl p-6 border border-blue-400/30 hover:border-blue-300/40 transition-all cursor-pointer"
                  onClick={() => setSelectedSector(sector)}
                  style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">
                        {getSectorIcon(sector.indexName || '')}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {formatSectorName(sector.indexName || `Sector ${index + 1}`)}
                        </h3>
                      </div>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      colorClass === 'green' ? 'bg-green-500/20 text-green-400' :
                      colorClass === 'red' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={
                          change > 0 
                            ? "M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z"
                            : change < 0
                            ? "M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z"
                            : "M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        } clipRule="evenodd" />
                      </svg>
                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Index Value</span>
                      <span className="text-white font-semibold">
                        {(sector.value || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Change</span>
                      <span className={`font-medium ${
                        change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {change >= 0 ? '+' : ''}{(sector.change || 0).toFixed(2)} points
                      </span>
                    </div>

                    {/* Progress bar showing relative performance */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Performance</span>
                        <span>{change >= 0 ? 'Positive' : 'Negative'}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            change >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.abs(change) * 20, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-lg">No sectors data available</div>
              <p className="text-gray-500 text-sm mt-2">Data will be displayed when the market is open</p>
            </div>
          )}
        </div>

        {/* Sector Performance Summary */}
        {sectorsData.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Sector Performance Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(4, 70, 32, 0.14)', backdropFilter: 'blur(28px)', border: '1px solid rgba(34,197,94,0.08)' }}>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Best Performing</h3>
                {sectorsData
                  .filter(s => (s.change || s.percentChange || 0) > 0)
                  .sort((a, b) => (b.change || b.percentChange || 0) - (a.change || a.percentChange || 0))
                  .slice(0, 3)
                  .map((sector, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="text-green-300 text-sm">
                        {formatSectorName(sector.indexName || '')}
                      </span>
                      <span className="text-green-400 font-medium text-sm">
                        +{(sector.change || sector.percentChange || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))
                }
              </div>

              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(88,28,20,0.14)', backdropFilter: 'blur(28px)', border: '1px solid rgba(239,68,68,0.08)' }}>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Worst Performing</h3>
                {sectorsData
                  .filter(s => (s.change || s.percentChange || 0) < 0)
                  .sort((a, b) => (a.change || a.percentChange || 0) - (b.change || b.percentChange || 0))
                  .slice(0, 3)
                  .map((sector, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="text-red-300 text-sm">
                        {formatSectorName(sector.indexName || '')}
                      </span>
                      <span className="text-red-400 font-medium text-sm">
                        {(sector.change || sector.percentChange || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))
                }
              </div>

              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(13, 42, 148, 0.14)', backdropFilter: 'blur(28px)', border: '1px solid rgba(59,130,246,0.08)' }}>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Market Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-300">Total Sectors</span>
                    <span className="text-white font-medium">{sectorsData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300">Gaining</span>
                    <span className="text-green-400 font-medium">
                      {sectorsData.filter(s => (s.change || s.percentChange || 0) > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-300">Declining</span>
                    <span className="text-red-400 font-medium">
                      {sectorsData.filter(s => (s.change || s.percentChange || 0) < 0).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectorsPage;
