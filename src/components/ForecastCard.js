import React, { useState, useEffect } from 'react';
import forecasterService from '../services/forecasterService';

const ForecastCard = ({ symbol, companyName, currentPrice, onForecastUpdate, forecastData = null, enhancedForecastData = null }) => {
  const [forecast, setForecast] = useState(forecastData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);

  // Convert ML service data format to ForecastCard expected format
  const adaptMLDataToForecastFormat = (mlData) => {
    if (!mlData) return null;
    
    return {
      prediction: mlData.direction, // 'UP' or 'DOWN'
      confidence: mlData.confidence / 100, // Backend returns 0-100, UI expects 0-1
      analysis: {
        strength: mlData.signal_strength || 'Unknown',
        risk_level: mlData.risk_level || 'Medium',
        recommendation: mlData.recommendation || 'HOLD'
      },
      historical_accuracy: {
        last_30_days: 0.90, // Mock data - could be enhanced later
        last_90_days: 0.73
      },
      source: mlData.source === 'mock' ? 'mock_data' : 'ml_model',
      timestamp: mlData.last_updated || new Date().toISOString(),
      message: mlData.source === 'mock' ? 'Forecaster API unavailable - using mock prediction' : null
    };
  };

  // Use provided forecast data or fetch if none provided
  useEffect(() => {
    if (forecastData || enhancedForecastData) {
      // Use pre-generated data and adapt format
      const mlData = enhancedForecastData || forecastData;
      const adaptedData = adaptMLDataToForecastFormat(mlData);
      setForecast(adaptedData);
      setLoading(false);
      
      // Set API health based on data source
      setApiHealth({
        isAvailable: true,
        modelAvailable: mlData.source !== 'mock'
      });
    } else if (symbol) {
      // Only fetch if no pre-generated data provided
      fetchForecast();
      checkApiHealth();
    }
  }, [symbol, forecastData, enhancedForecastData]);

  const checkApiHealth = async () => {
    try {
      const health = await forecasterService.healthCheck();
      setApiHealth(health);
    } catch (err) {
      setApiHealth({ isAvailable: false, error: err.message });
    }
  };

  const fetchForecast = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await forecasterService.getEnhancedForecast(symbol, true);
      setForecast(result);
      
      // Notify parent component if callback provided
      if (onForecastUpdate) {
        onForecastUpdate(symbol, result);
      }
    } catch (err) {
      setError(err.message);
      console.error('Forecast error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPredictionColor = (prediction) => {
    return prediction === 'UP' ? 'text-green-400' : 'text-red-400';
  };

  const getPredictionIcon = (prediction) => {
    return prediction === 'UP' ? '📈' : '📉';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.65) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk) => {
    if (risk === 'Low') return 'text-green-400';
    if (risk === 'Medium') return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          <span className="ml-3 text-gray-400">Generating forecast...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-6 border border-red-400/30" style={{ backgroundColor: 'rgba(40,0,0,0.15)', backdropFilter: 'blur(28px)' }}>
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️ Forecast Error</div>
          <div className="text-gray-400 text-sm">{error}</div>
          <button
            onClick={fetchForecast}
            className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="rounded-xl p-6 border border-gray-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
        <div className="text-center text-gray-400">
          No forecast available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Status Indicator */}
      {apiHealth && (
        <div className="text-xs text-gray-500 flex items-center justify-end">
          <div className={`w-2 h-2 rounded-full mr-2 ${apiHealth.isAvailable ? 'bg-green-400' : 'bg-red-400'}`}></div>
          {apiHealth.isAvailable ? 
            (apiHealth.modelAvailable ? 'ML Model Active' : 'Mock Predictions') : 
            'API Offline'
          }
        </div>
      )}

      {/* Main Forecast Card */}
      <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">AI Forecast</h3>
          <div className="text-2xl">{getPredictionIcon(forecast.prediction)}</div>
        </div>

        {/* Prediction and Confidence */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-400">Prediction</div>
            <div className={`text-2xl font-bold ${getPredictionColor(forecast.prediction)}`}>
              {forecast.prediction}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Confidence</div>
            <div className={`text-2xl font-bold ${getConfidenceColor(forecast.confidence)}`}>
              {(forecast.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Analysis Details */}
        {forecast.analysis && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <div className="text-gray-400">Strength</div>
              <div className="text-white">{forecast.analysis.strength}</div>
            </div>
            <div>
              <div className="text-gray-400">Risk Level</div>
              <div className={getRiskColor(forecast.analysis.risk_level)}>
                {forecast.analysis.risk_level}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-400">Recommendation</div>
              <div className="text-white font-medium">{forecast.analysis.recommendation}</div>
            </div>
          </div>
        )}

        {/* Historical Accuracy */}
        {forecast.historical_accuracy && (
          <div className="border-t border-gray-700/50 pt-4">
            <div className="text-sm text-gray-400 mb-2">Historical Accuracy</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Last 30 days</div>
                <div className="text-white">
                  {(forecast.historical_accuracy.last_30_days * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500">Last 90 days</div>
                <div className="text-white">
                  {(forecast.historical_accuracy.last_90_days * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source and Timestamp */}
        <div className="border-t border-gray-700/50 pt-3 mt-4">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>
              Source: {forecast.source === 'ml_model' ? '🤖 ML Model' : '🎲 Mock Data'}
            </div>
            <div>
              {new Date(forecast.timestamp).toLocaleTimeString()}
            </div>
          </div>
          {forecast.message && (
            <div className="text-xs text-gray-400 mt-1">{forecast.message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Batch Forecast Component for multiple stocks
const BatchForecastCard = ({ symbols, title = "Market Forecast" }) => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbols && symbols.length > 0) {
      fetchBatchForecast();
    }
  }, [symbols]);

  const fetchBatchForecast = async () => {
    if (!symbols || symbols.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await forecasterService.getBatchForecast(symbols);
      setForecasts(result.results || []);
    } catch (err) {
      setError(err.message);
      console.error('Batch forecast error:', err);
    } finally {
      setLoading(false);
    }
  };

  const upPredictions = forecasts.filter(f => f.prediction === 'UP').length;
  const downPredictions = forecasts.filter(f => f.prediction === 'DOWN').length;
  const averageConfidence = forecasts.length > 0 ? 
    forecasts.reduce((sum, f) => sum + (f.confidence || 0), 0) / forecasts.length : 0;

  if (loading) {
    return (
      <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          <span className="ml-3 text-gray-400">Generating batch forecasts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6 border border-blue-400/30" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(28px)' }}>
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      
      {error ? (
        <div className="text-red-400 text-center">
          <div>Error: {error}</div>
          <button
            onClick={fetchBatchForecast}
            className="mt-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{upPredictions}</div>
              <div className="text-sm text-gray-400">Bullish</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{downPredictions}</div>
              <div className="text-sm text-gray-400">Bearish</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{(averageConfidence * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-400">Avg Confidence</div>
            </div>
          </div>

          {/* Individual Forecasts */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {forecasts.map((forecast, index) => (
              <div key={forecast.symbol || index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">
                    {forecast.prediction === 'UP' ? '📈' : '📉'}
                  </div>
                  <div>
                    <div className="text-white font-medium">{forecast.symbol}</div>
                    <div className="text-xs text-gray-400">{forecast.sector}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${forecast.prediction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                    {forecast.prediction}
                  </div>
                  <div className="text-xs text-gray-400">
                    {(forecast.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ForecastCard;
export { BatchForecastCard };
