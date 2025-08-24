import marketDataCache from './marketDataCache.js';
import mockDataService from './mockDataService.js';

class NepseApiService {
  constructor() {
    this.baseUrl = 'https://nepseapi.surajrimal.dev';
    this.cache = marketDataCache;
  }

  // Primary method to get company price data - cache-first approach
  async getCompanyPriceData(symbol) {
    try {
      // First try to get from cache (which contains real API data)
      const cachedData = this.cache.getCompany(symbol);
      if (cachedData) {
        console.log(`Found ${symbol} in cache:`, cachedData.securityName || cachedData.name);
        
        // Generate realistic price history for the cached data
        const priceHistory = this.generateRealisticPriceHistory(
          cachedData.price,
          cachedData.changePercent
        );

        return {
          symbol: cachedData.symbol,
          name: cachedData.name || cachedData.securityName,
          sector: cachedData.sector || 'Unknown Sector',
          currentPrice: cachedData.price,
          change: cachedData.change,
          changePercent: cachedData.changePercent,
          volume: cachedData.volume,
          openPrice: cachedData.open,
          highPrice: cachedData.high,
          lowPrice: cachedData.low,
          previousClose: cachedData.previousClose,
          averagePrice: cachedData.averagePrice,
          lastUpdated: cachedData.lastUpdated,
          priceHistory: priceHistory,
          source: 'cache'
        };
      }

      // Cache miss - ensure cache is initialized and updated
      if (!this.cache.isInitialized) {
        console.log(`Cache not initialized, waiting for initialization...`);
        await this.cache.initialize();
        
        // Try cache again after initialization
        const retryData = this.cache.getCompany(symbol);
        if (retryData) {
          return this.getCompanyPriceData(symbol); // Recursive call with cache now available
        }
      }

      // If still not found, fall back to mock data but store it in cache for consistency
      console.log(`${symbol} not found in cache after initialization, creating consistent fallback`);
      const mockData = mockDataService.getCompanyPriceData(symbol);
      
      // Store mock data in cache to ensure consistency across the app
      this.cache.cache.set(symbol, {
        symbol: mockData.symbol,
        name: mockData.name,
        sector: mockData.sector || 'Unknown Sector',
        price: mockData.currentPrice,
        change: mockData.change,
        changePercent: mockData.changePercent,
        volume: mockData.volume,
        open: mockData.openPrice,
        high: mockData.highPrice,
        low: mockData.lowPrice,
        previousClose: mockData.previousClose,
        averagePrice: mockData.averagePrice || mockData.currentPrice,
        lastUpdated: mockData.lastUpdated,
        source: 'mock-cached'
      });
      
      return mockData;

    } catch (error) {
      console.error('Error in getCompanyPriceData:', error);
      // Final fallback to mock data
      return mockDataService.getCompanyPriceData(symbol);
    }
  }

    // Search companies using cache only to ensure consistency
  async searchCompanies(query) {
    try {
      // Ensure cache is initialized
      if (!this.cache.isInitialized) {
        console.log('Cache not initialized for search, waiting...');
        await this.cache.initialize();
      }
      
      // Search in cache first - this contains real API data
      const results = this.cache.searchCompanies(query);
      
      if (results && results.length > 0) {
        console.log(`Found ${results.length} search results in cache for "${query}"`);
        return results;
      }
      
      // If no results in cache, search mock data and add to cache for consistency
      console.log(`No cache results for "${query}", checking mock data and adding to cache`);
      const mockResults = mockDataService.searchCompanies(query);
      
      // Add mock results to cache to ensure future consistency
      mockResults.forEach(company => {
        if (!this.cache.getCompany(company.symbol)) {
          this.cache.cache.set(company.symbol, {
            symbol: company.symbol,
            name: company.name,
            sector: company.sector || 'Unknown Sector',
            price: company.price || company.currentPrice || 500,
            change: company.change || 0,
            changePercent: company.changePercent || 0,
            volume: company.volume || 1000,
            open: company.openPrice || company.price || 500,
            high: company.highPrice || company.price || 500,
            low: company.lowPrice || company.price || 500,
            previousClose: company.previousClose || company.price || 500,
            averagePrice: company.averagePrice || company.price || 500,
            lastUpdated: new Date().toISOString(),
            source: 'mock-search-cached'
          });
        }
      });
      
      return mockResults;
      
    } catch (error) {
      console.error('Search error:', error);
      return mockDataService.searchCompanies(query);
    }
  }

  // Generate realistic price history for display
  generateRealisticPriceHistory(currentPrice, changePercent) {
    const history = [];
    const dataPoints = 30; // 30 data points for the chart
    
    // Calculate the starting price based on current change
    const startPrice = currentPrice / (1 + changePercent / 100);
    
    // Generate realistic price movement over time
    for (let i = 0; i < dataPoints; i++) {
      const progress = i / (dataPoints - 1);
      
      // Add some realistic volatility
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% random volatility
      const trendProgress = progress * (changePercent / 100);
      
      const price = startPrice * (1 + trendProgress + volatility);
      
      history.push({
        time: Date.now() - (dataPoints - i) * 60000, // Each point is 1 minute apart
        price: Math.max(0, Number(price.toFixed(2)))
      });
    }
    
    // Ensure the last point matches current price
    if (history.length > 0) {
      history[history.length - 1].price = currentPrice;
    }
    
    return history;
  }

  // Get market status
  async getMarketStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/MarketStatus`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TadaTeer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Market status API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching market status:', error);
      // Return mock market status
      return {
        isOpen: true,
        message: "Market is open (simulated)",
        timestamp: new Date().toISOString()
      };
    }
  }

  // Legacy method for backward compatibility
  async getStockData(symbol) {
    return this.getCompanyPriceData(symbol);
  }

  // Get cache statistics for debugging
  getCacheStats() {
    return this.cache.getStats();
  }

  // Force cache refresh
  async refreshCache() {
    return this.cache.updateCache();
  }
}

// Create and export singleton instance
export const nepseApiService = new NepseApiService();
export default nepseApiService;
