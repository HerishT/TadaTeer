// Unified Data Service - Single Source of Truth for All App Data
// Ensures consistency across search, dashboard, ML forecasts, and other components

import marketDataCache from './marketDataCache.js';
import nepseApiService from './nepseApiService.js';
import mockDataService from './mockDataService.js';

class UnifiedDataService {
  constructor() {
    this.cache = marketDataCache;
    this.isInitialized = false;
    this.initPromise = null;
  }

  // Initialize the service and ensure cache is loaded
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    await this.initPromise;
  }

  async _doInitialize() {
    console.log('Initializing unified data service...');
    
    // Ensure market cache is initialized
    await this.cache.initialize();
    
    this.isInitialized = true;
    console.log('Unified data service initialized with', this.cache.cache.size, 'companies');
  }

  // Get company data - single source of truth
  async getCompanyData(symbol) {
    await this.initialize();
    
    // Try cache first (contains real API data when available)
    let cachedData = this.cache.getCompany(symbol);
    
    if (cachedData) {
      console.log(`[UNIFIED] Found ${symbol} in cache:`, cachedData.name || cachedData.securityName);
      return this._formatCompanyData(cachedData, 'cache');
    }

    // If not in cache, try to get from API and cache it
    try {
      console.log(`[UNIFIED] ${symbol} not in cache, fetching from API...`);
      const apiData = await nepseApiService.getCompanyPriceData(symbol);
      
      // Store in cache for future consistency
      this._addToCache(symbol, apiData);
      
      return apiData;
    } catch (error) {
      console.error(`[UNIFIED] API failed for ${symbol}:`, error.message);
      
      // Final fallback to mock data, but cache it for consistency
      const mockData = mockDataService.getCompanyPriceData(symbol);
      this._addToCache(symbol, mockData);
      
      return mockData;
    }
  }

  // Search companies - single source of truth
  async searchCompanies(query) {
    await this.initialize();
    
    console.log(`[UNIFIED] Searching for "${query}"`);
    
    // Search in cache first
    const cacheResults = this.cache.searchCompanies(query);
    
    if (cacheResults && cacheResults.length > 0) {
      console.log(`[UNIFIED] Found ${cacheResults.length} cache results for "${query}"`);
      return cacheResults.map(result => this._formatSearchResult(result, 'cache'));
    }

    // If no cache results, search mock data and add to cache
    console.log(`[UNIFIED] No cache results for "${query}", searching mock data`);
    const mockResults = mockDataService.searchCompanies(query);
    
    // Add mock results to cache for future consistency
    mockResults.forEach(company => {
      this._addToCache(company.symbol, company);
    });
    
    return mockResults.map(result => this._formatSearchResult(result, 'mock'));
  }

  // Get all market data - for market depth page
  async getMarketOverview() {
    await this.initialize();
    
    console.log('[UNIFIED] Getting market overview from cache');
    
    const allCompanies = Array.from(this.cache.cache.values());
    
    if (allCompanies.length === 0) {
      console.log('[UNIFIED] No companies in cache, using mock market data');
      return mockDataService.getMarketOverview();
    }

    // Format cached data for market overview
    const topGainers = allCompanies
      .filter(c => c.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10)
      .map(c => this._formatSearchResult(c, 'cache'));

    const topLosers = allCompanies
      .filter(c => c.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10)
      .map(c => this._formatSearchResult(c, 'cache'));

    const volumeLeaders = allCompanies
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10)
      .map(c => this._formatSearchResult(c, 'cache'));

    return {
      topGainers,
      topLosers,
      volumeLeaders,
      totalCompanies: allCompanies.length,
      source: 'unified_cache'
    };
  }

  // Add data to cache for consistency with proper formatting
  _addToCache(symbol, data) {
    const cacheEntry = {
      symbol: data.symbol || symbol,
      name: data.name || data.securityName,
      sector: data.sector || 'Unknown Sector',
      price: Number(data.currentPrice || data.price || 0).toFixed(2),
      change: Number(data.change || 0).toFixed(2),
      changePercent: Number(data.changePercent || 0).toFixed(2),
      volume: data.volume,
      open: Number(data.openPrice || data.open || 0).toFixed(2),
      high: Number(data.highPrice || data.high || 0).toFixed(2),
      low: Number(data.lowPrice || data.low || 0).toFixed(2),
      previousClose: Number(data.previousClose || 0).toFixed(2),
      averagePrice: Number(data.averagePrice || data.currentPrice || data.price || 0).toFixed(2),
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      source: data.source || 'unified_cached'
    };

    this.cache.cache.set(symbol, cacheEntry);
    console.log(`[UNIFIED] Added ${symbol} to cache for consistency`);
  }

  // Format company data consistently with proper decimal places
  _formatCompanyData(data, source) {
    return {
      symbol: data.symbol,
      name: data.name || data.securityName,
      sector: data.sector || 'Unknown Sector',
      currentPrice: Number(data.price || data.currentPrice || 0).toFixed(2),
      change: Number(data.change || 0).toFixed(2),
      changePercent: Number(data.changePercent || 0).toFixed(2),
      volume: data.volume,
      openPrice: Number(data.open || data.openPrice || 0).toFixed(2),
      highPrice: Number(data.high || data.highPrice || 0).toFixed(2),
      lowPrice: Number(data.low || data.lowPrice || 0).toFixed(2),
      previousClose: Number(data.previousClose || 0).toFixed(2),
      averagePrice: Number(data.averagePrice || 0).toFixed(2),
      lastUpdated: data.lastUpdated,
      source: source + '_unified'
    };
  }

  // Format search results consistently with proper decimal places
  _formatSearchResult(data, source) {
    return {
      symbol: data.symbol,
      name: data.name || data.securityName,
      price: Number(data.price || data.currentPrice || 0).toFixed(2),
      currentPrice: Number(data.price || data.currentPrice || 0).toFixed(2),
      change: Number(data.change || 0).toFixed(2),
      changePercent: Number(data.changePercent || 0).toFixed(2),
      volume: data.volume,
      sector: data.sector,
      source: source + '_unified'
    };
  }

  // Verify data consistency across the app
  async verifyConsistency(symbol) {
    console.log(`[UNIFIED] Verifying data consistency for ${symbol}`);
    
    const cacheData = this.cache.getCompany(symbol);
    const searchResults = await this.searchCompanies(symbol);
    const companyData = await this.getCompanyData(symbol);

    const report = {
      symbol,
      cacheExists: !!cacheData,
      searchFound: searchResults.length > 0,
      companyDataExists: !!companyData,
      priceConsistency: true,
      issues: []
    };

    // Check price consistency
    if (cacheData && companyData) {
      const priceDiff = Math.abs(cacheData.price - companyData.currentPrice);
      if (priceDiff > 0.01) {
        report.priceConsistency = false;
        report.issues.push(`Price mismatch: cache=${cacheData.price}, company=${companyData.currentPrice}`);
      }
    }

    console.log(`[UNIFIED] Consistency report for ${symbol}:`, report);
    return report;
  }
}

// Export singleton instance
const unifiedDataService = new UnifiedDataService();
export default unifiedDataService;
