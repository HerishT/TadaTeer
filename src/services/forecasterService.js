// Forecaster API Service
// Integrates with the Python ML forecasting backend

class ForecasterService {
  constructor() {
    this.baseURL = 'http://localhost:5001'; // Forecaster API URL
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Forecaster API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Check if forecaster API is healthy
  async healthCheck() {
    try {
      const result = await this.makeRequest('/health');
      return {
        isAvailable: true,
        modelAvailable: result.model_available,
        ...result
      };
    } catch (error) {
      return {
        isAvailable: false,
        modelAvailable: false,
        error: error.message
      };
    }
  }

  // Get forecast for a single stock
  async getForecast(symbol) {
    const cacheKey = `forecast_${symbol.toUpperCase()}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const result = await this.makeRequest(`/forecast/${symbol.toUpperCase()}`);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      // Return mock data if API is unavailable
      return this.getMockForecast(symbol);
    }
  }

  // Get forecasts for multiple stocks
  async getBatchForecast(symbols) {
    if (!symbols || symbols.length === 0) {
      return { results: [], total_processed: 0 };
    }

    // Check cache for all symbols
    const uncachedSymbols = [];
    const cachedResults = [];

    symbols.forEach(symbol => {
      const cacheKey = `forecast_${symbol.toUpperCase()}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          cachedResults.push(cached.data);
        } else {
          uncachedSymbols.push(symbol);
        }
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    let newResults = [];
    if (uncachedSymbols.length > 0) {
      try {
        const response = await this.makeRequest('/forecast/batch', {
          method: 'POST',
          body: JSON.stringify({ symbols: uncachedSymbols })
        });

        newResults = response.results || [];

        // Cache new results
        newResults.forEach(result => {
          if (result.symbol && !result.error) {
            const cacheKey = `forecast_${result.symbol}`;
            this.cache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
          }
        });
      } catch (error) {
        // Generate mock data for uncached symbols
        newResults = uncachedSymbols.map(symbol => this.getMockForecast(symbol));
      }
    }

    return {
      results: [...cachedResults, ...newResults],
      total_processed: cachedResults.length + newResults.length,
      cached_count: cachedResults.length,
      new_count: newResults.length
    };
  }

  // Get forecasts for all stocks in a sector
  async getSectorForecast(sector) {
    try {
      const result = await this.makeRequest(`/sectors/${encodeURIComponent(sector)}/forecast`);
      
      // Cache individual results
      result.results?.forEach(forecast => {
        if (forecast.symbol && !forecast.error) {
          const cacheKey = `forecast_${forecast.symbol}`;
          this.cache.set(cacheKey, {
            data: forecast,
            timestamp: Date.now()
          });
        }
      });

      return result;
    } catch (error) {
      // Return mock data if API is unavailable
      return {
        sector: sector,
        results: [],
        error: error.message,
        source: 'mock'
      };
    }
  }

  // Get all available sectors
  async getSectors() {
    try {
      return await this.makeRequest('/sectors');
    } catch (error) {
      // Return default sectors if API is unavailable
      return {
        sectors: {
          "Commercial Bank": ["NABIL", "EBL", "KBL", "NBL", "SANIMA"],
          "Development Bank Limited": ["KSBBL", "LBBL", "SHINE"],
          "Finance": ["BFC", "CFCL", "GUFL"],
          "Insurance": ["NLIC", "UNL", "IGI"],
          "Hydropower": ["HIDCL", "UPPER", "CHCL"]
        },
        total_sectors: 5,
        total_symbols: 18,
        source: 'fallback'
      };
    }
  }

  // Generate mock forecast for fallback
  getMockForecast(symbol) {
    const upperSymbol = symbol.toUpperCase();
    const hash = this.simpleHash(upperSymbol);
    
    return {
      symbol: upperSymbol,
      prediction: hash % 2 === 0 ? "UP" : "DOWN",
      confidence: 0.65 + (hash % 30) / 100,
      sector: this.guessSector(upperSymbol),
      timestamp: new Date().toISOString(),
      source: 'mock',
      message: 'Forecaster API unavailable - using mock prediction'
    };
  }

  // Simple hash function for consistent mock data
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Guess sector based on symbol patterns
  guessSector(symbol) {
    if (symbol.includes('BL') || symbol.includes('BANK')) return 'Commercial Bank';
    if (symbol.includes('HYD') || symbol.includes('PWR')) return 'Hydropower';
    if (symbol.includes('INS') || symbol.includes('LIC')) return 'Insurance';
    if (symbol.includes('FIN') || symbol.includes('FC')) return 'Finance';
    return 'Others';
  }

  // Enhanced forecast with additional analysis
  async getEnhancedForecast(symbol, includeHistory = false) {
    try {
      const basicForecast = await this.getForecast(symbol);
      
      const enhanced = {
        ...basicForecast,
        analysis: {
          trend: basicForecast.prediction,
          strength: this.interpretConfidence(basicForecast.confidence),
          recommendation: this.generateRecommendation(basicForecast),
          risk_level: this.assessRisk(basicForecast),
          time_horizon: '1-5 days'
        }
      };

      if (includeHistory) {
        // Add mock historical accuracy (in real implementation, this would come from tracking)
        enhanced.historical_accuracy = {
          last_30_days: 0.72 + (this.simpleHash(symbol) % 20) / 100,
          last_90_days: 0.68 + (this.simpleHash(symbol + 'history') % 25) / 100,
          sample_size: 45 + (this.simpleHash(symbol + 'count') % 30)
        };
      }

      return enhanced;
    } catch (error) {
      throw new Error(`Enhanced forecast failed: ${error.message}`);
    }
  }

  interpretConfidence(confidence) {
    if (confidence >= 0.8) return 'Very Strong';
    if (confidence >= 0.7) return 'Strong';
    if (confidence >= 0.6) return 'Moderate';
    return 'Weak';
  }

  generateRecommendation(forecast) {
    const { prediction, confidence } = forecast;
    
    if (confidence >= 0.75) {
      return prediction === 'UP' ? 'Strong Buy Signal' : 'Strong Sell Signal';
    } else if (confidence >= 0.65) {
      return prediction === 'UP' ? 'Buy Signal' : 'Sell Signal';
    } else {
      return 'Hold - Low Confidence';
    }
  }

  assessRisk(forecast) {
    const { confidence } = forecast;
    
    if (confidence >= 0.8) return 'Low';
    if (confidence >= 0.65) return 'Medium';
    return 'High';
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const forecasterService = new ForecasterService();

export default forecasterService;
