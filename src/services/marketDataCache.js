// Market Data Cache Service
// Fetches live market data once and updates periodically to reduce API calls
// Pre-generates deterministic chart data for all stocks to ensure consistency

import deterministicDataGenerator from './deterministicDataGenerator.js';

class MarketDataCache {
  constructor() {
    this.cache = new Map();
    this.chartCache = new Map();
    this.lastUpdate = null;
    this.updateInterval = 60 * 60 * 1000; // 1 hour in milliseconds
    this.isUpdating = false;
    this.updateTimer = null;
    this.isInitialized = false;
    
    // Start initial fetch
    this.initialize();
  }

  async initialize() {
    console.log('Initializing market data cache...');
    
    // Try to load existing caches first
    const hasMarketCache = this.loadFromLocalStorage();
    const hasChartCache = this.loadChartCacheFromLocalStorage();
    
    // Update market data if needed
    if (!hasMarketCache || this.isStale()) {
      await this.updateCache();
    }
    
    // Generate chart data if needed
    if (!hasChartCache || this.chartCache.size === 0) {
      await this.preGenerateAllChartData();
    }
    
    this.isInitialized = true;
    this.startPeriodicUpdates();
    
    console.log(`Market cache initialized with ${this.cache.size} companies and ${this.chartCache.size} chart items`);
  }

  async preGenerateAllChartData() {
    console.log('Pre-generating chart data for all stocks...');
    const startTime = Date.now();
    
    // Get all company symbols
    const allSymbols = Array.from(this.cache.keys());
    
    // If we don't have cached companies, generate for common NEPSE stocks
    if (allSymbols.length === 0) {
      console.log('No cached companies found, generating for common NEPSE stocks...');
      await this.generateFallbackCompanies();
    }
    
    // Pre-generate chart data for all companies
    let generatedCount = 0;
    for (const [symbol, companyData] of this.cache) {
      try {
        // Generate different time ranges
        const timeRanges = [
          { key: '1W', days: 7 },
          { key: '1M', days: 30 },
          { key: '3M', days: 90 },
          { key: '6M', days: 180 },
          { key: '1Y', days: 365 },
          { key: '2Y', days: 730 }
        ];

        for (const range of timeRanges) {
          const chartKey = `chart_${symbol}_${range.key}`;
          const chartData = deterministicDataGenerator.generateChartData(
            symbol, 
            companyData.price || 500, 
            range.days
          );
          this.chartCache.set(chartKey, chartData);
        }

        // Generate financial data
        const financialKey = `financial_${symbol}`;
        const financialData = deterministicDataGenerator.generateFinancialData(
          symbol, 
          companyData.price || 500
        );
        this.chartCache.set(financialKey, financialData);

        generatedCount++;
        
        // Log progress every 50 companies
        if (generatedCount % 50 === 0) {
          console.log(`Generated chart data for ${generatedCount} companies...`);
        }
      } catch (error) {
        console.error(`Error generating data for ${symbol}:`, error);
      }
    }
    
    const endTime = Date.now();
    console.log(`Pre-generated chart data for ${generatedCount} companies in ${endTime - startTime}ms`);
    
    // Save to localStorage
    this.saveChartCacheToLocalStorage();
  }

  async generateFallbackCompanies() {
    // Common NEPSE stock symbols for fallback
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

    for (const symbol of commonSymbols) {
      const companyData = deterministicDataGenerator.generateMarketData(symbol);
      this.cache.set(symbol, companyData);
    }

    console.log(`Generated fallback data for ${commonSymbols.length} companies`);
    this.saveToLocalStorage();
  }

  async updateCache() {
    if (this.isUpdating) {
      console.log('Cache update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;
    console.log('Updating market data cache from CSV...');

    try {
      // Load from CSV file instead of API
      const response = await fetch('/nepsealpha_export_price_2025-08-24.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      // Clear existing cache
      this.cache.clear();
      
      // Process each line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle quoted values)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add the last value
        
        if (values.length >= 7) { // Ensure we have minimum required fields
          const symbol = values[0].replace(/"/g, '');
          const close = parseFloat(values[5].replace(/"/g, '').replace(/,/g, ''));
          const open = parseFloat(values[2].replace(/"/g, '').replace(/,/g, ''));
          const high = parseFloat(values[3].replace(/"/g, '').replace(/,/g, ''));
          const low = parseFloat(values[4].replace(/"/g, '').replace(/,/g, ''));
          const volume = parseFloat(values[7].replace(/"/g, '').replace(/,/g, ''));
          const percentChange = values[6].replace(/"/g, '').replace(' %', '');
          
          // Calculate change from percentage
          const changePercent = parseFloat(percentChange) || 0;
          const change = (close * changePercent) / 100;
          const previousClose = close - change;
          
          // Determine sector based on symbol patterns (basic mapping)
          let sector = 'Unknown Sector';
          const symbolUpper = symbol.toUpperCase();
          
          // Banks
          if (symbolUpper.includes('BL') || symbolUpper.includes('BANK') || 
              ['NABIL', 'SCBL', 'HBL', 'EBL', 'BOKL', 'NICA', 'MBL', 'LBL', 'KBL', 'NBL', 'RBCL', 'SBL', 'ADBL', 'GBIME', 'CZBIL', 'SANIMA', 'MEGA', 'PCBL', 'CBBL', 'PRVU'].includes(symbolUpper)) {
            sector = 'Commercial Banks';
          }
          // Insurance
          else if (symbolUpper.includes('INS') || symbolUpper.includes('LIFE') || 
                   ['AHL', 'ALICL', 'NICL', 'NLICL', 'SICL', 'UIC', 'PICL'].includes(symbolUpper)) {
            sector = 'Non Life Insurance';
          }
          // Hydropower
          else if (symbolUpper.includes('HYD') || symbolUpper.includes('POW') || symbolUpper.includes('PC') || 
                   ['AKPL', 'UPPER', 'CHDC', 'SHPC', 'AKJCL', 'AHPC', 'NHPC', 'UNHPL', 'RHPL', 'SJCL'].includes(symbolUpper)) {
            sector = 'HydroPower';
          }
          // Microfinance
          else if (symbolUpper.includes('FIN') || symbolUpper.includes('MICRO') || symbolUpper.includes('BSL') || 
                   ['ACLBSL', 'ALBSL', 'CFCL', 'DDBL', 'FOWAD', 'GMFIL', 'JSLBB', 'KBBL', 'KRBL', 'LLBS', 'MFIL', 'NIFRA', 'NUBL', 'RLFL', 'RMDC', 'RSDC', 'SABSL', 'SAEF', 'SAHAS', 'SDLBL', 'SFCL', 'SHINE', 'SIFC', 'SLBS', 'SMFDB', 'SMFBS', 'SPDL', 'SWBBL', 'UPCL', 'VLBS', 'WOMI'].includes(symbolUpper)) {
            sector = 'Microfinance';
          }
          // Hotels and Tourism
          else if (symbolUpper.includes('HOT') || symbolUpper.includes('TRAV') || 
                   ['OHL', 'SHL', 'TRH', 'NHDL'].includes(symbolUpper)) {
            sector = 'Hotels And Tourism';
          }
          // Manufacturing
          else if (symbolUpper.includes('MFG') || symbolUpper.includes('IND') || 
                   ['BARUN', 'BNT', 'HURJA', 'JOSHI', 'MANDU', 'NTC', 'SHIVM', 'UNL'].includes(symbolUpper)) {
            sector = 'Manufacturing And Processing';
          }
          // Trading
          else if (symbolUpper.includes('TRAD') || 
                   ['API', 'BBC', 'GILB', 'GHL', 'HDHPC', 'ICFC', 'JBBL', 'KKHC', 'NRN', 'PFL', 'PROFL', 'RADHI', 'SKBBL', 'SLICL', 'UAIL'].includes(symbolUpper)) {
            sector = 'Trading';
          }
          
          this.cache.set(symbol.toUpperCase(), {
            symbol: symbol.toUpperCase(),
            name: this.generateCompanyName(symbol), // Generate proper company name
            securityName: this.generateCompanyName(symbol),
            price: close,
            change: change,
            changePercent: changePercent,
            high: high,
            low: low,
            open: open,
            volume: volume,
            turnover: volume * close,
            previousClose: previousClose,
            lastTradedVolume: volume,
            averagePrice: (high + low + close) / 3,
            lastUpdated: new Date().toISOString(),
            sector: sector,
            _source: 'csv_cache',
            _cachedAt: new Date().toISOString()
          });
        }
      }

      this.lastUpdate = new Date();
      console.log(`Market data cache updated with ${this.cache.size} companies from CSV at ${this.lastUpdate.toISOString()}`);
      
      // Store in localStorage as backup
      this.saveToLocalStorage();
      
    } catch (error) {
      console.error('Error updating market data cache from CSV:', error);
      this.loadFromLocalStorage(); // Fallback to localStorage
    } finally {
      this.isUpdating = false;
    }
  }

  calculateChange(currentPrice, previousClose) {
    if (!currentPrice || !previousClose) return 0;
    return parseFloat((currentPrice - previousClose).toFixed(2));
  }

  // Generate proper company names from symbols
  generateCompanyName(symbol) {
    const companyNames = {
      'NABIL': 'Nabil Bank Limited',
      'SCBL': 'Standard Chartered Bank Nepal Limited',
      'HBL': 'Himalayan Bank Limited',
      'EBL': 'Everest Bank Limited',
      'BOKL': 'Bank of Kathmandu Limited',
      'NICA': 'NIC Asia Bank Limited',
      'MBL': 'Machhapuchchhre Bank Limited',
      'LBL': 'Laxmi Bank Limited',
      'KBL': 'Kumari Bank Limited',
      'NBL': 'Nepal Bank Limited',
      'RBCL': 'Rastriya Banijya Bank Limited',
      'SBL': 'Siddhartha Bank Limited',
      'ADBL': 'Agriculture Development Bank Limited',
      'GBIME': 'Global IME Bank Limited',
      'CZBIL': 'Citizen Bank International Limited',
      'SANIMA': 'Sanima Bank Limited',
      'MEGA': 'Mega Bank Nepal Limited',
      'PCBL': 'Prime Commercial Bank Limited',
      'CBBL': 'Civil Bank Limited',
      'PRVU': 'Prabhu Bank Limited',
      'AKPL': 'Arun Kabeli Power Limited',
      'UPPER': 'Upper Tamakoshi Hydropower Limited',
      'CHDC': 'Chilime Hydropower Company Limited',
      'SHPC': 'Sanjen Hydropower Limited',
      'AKJCL': 'Arun Kabeli Power Limited',
      'AHPC': 'Arun Hydropower Company Limited',
      'NHPC': 'Nepal Hydropower Company Limited',
      'ACLBSL': 'Aarambha Chautari Laghubitta Bittiya Sanstha Limited',
      'AHL': 'Asian Life Insurance Limited',
      'ALBSL': 'Arun Laghubitta Bittiya Sanstha Limited',
      'ALICL': 'Asian Life Insurance Company Limited'
    };
    
    return companyNames[symbol] || `${symbol} Limited`;
  }

  startPeriodicUpdates() {
    // Clear any existing timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.updateCache();
    }, this.updateInterval);

    console.log(`Periodic cache updates scheduled every ${this.updateInterval / 1000 / 60} minutes`);
  }

  saveToLocalStorage() {
    try {
      const cacheData = {
        data: Array.from(this.cache.entries()),
        lastUpdate: this.lastUpdate?.toISOString(),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('nepse_market_cache', JSON.stringify(cacheData));
      console.log('Market data saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  saveChartCacheToLocalStorage() {
    try {
      const chartCacheData = {
        data: Array.from(this.chartCache.entries()),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('nepse_chart_cache', JSON.stringify(chartCacheData));
      console.log(`Chart cache saved to localStorage (${this.chartCache.size} items)`);
    } catch (error) {
      console.error('Error saving chart cache to localStorage:', error);
    }
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('nepse_market_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        const timestamp = new Date(cacheData.timestamp);
        
        // Check if data is not too old (max 24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - timestamp.getTime() < maxAge) {
          this.cache = new Map(cacheData.data);
          this.lastUpdate = new Date(cacheData.lastUpdate);
          console.log(`Loaded ${this.cache.size} companies from localStorage cache`);
          return true;
        } else {
          console.log('localStorage cache is too old, ignoring');
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return false;
  }

  loadChartCacheFromLocalStorage() {
    try {
      const stored = localStorage.getItem('nepse_chart_cache');
      if (stored) {
        const chartCacheData = JSON.parse(stored);
        const timestamp = new Date(chartCacheData.timestamp);
        
        // Chart cache can be older (max 7 days) since it's deterministic
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (Date.now() - timestamp.getTime() < maxAge) {
          this.chartCache = new Map(chartCacheData.data);
          console.log(`Loaded ${this.chartCache.size} chart items from localStorage cache`);
          return true;
        } else {
          console.log('Chart cache is too old, will regenerate');
        }
      }
    } catch (error) {
      console.error('Error loading chart cache from localStorage:', error);
    }
    return false;
  }

  // Get company data by symbol
  getCompany(symbol) {
    if (!symbol) return null;
    
    const upperSymbol = symbol.toUpperCase();
    const company = this.cache.get(upperSymbol);
    
    if (company) {
      return {
        ...company,
        _dataAge: this.getDataAge()
      };
    }
    
    return null;
  }

  // Search companies by symbol or name
  searchCompanies(query) {
    if (!query || query.length < 1) return [];
    
    const queryLower = query.toLowerCase();
    const results = [];
    
    for (const [symbol, company] of this.cache) {
      if (symbol.toLowerCase().includes(queryLower) || 
          company.name.toLowerCase().includes(queryLower)) {
        results.push({
          symbol: company.symbol,
          name: company.name,
          currentPrice: company.price,
          change: company.change,
          changePercent: company.changePercent,
          _source: 'live_market_cache'
        });
      }
      
      // Limit results to prevent UI lag
      if (results.length >= 20) break;
    }
    
    return results.sort((a, b) => {
      // Prioritize exact symbol matches
      if (a.symbol.toLowerCase() === queryLower) return -1;
      if (b.symbol.toLowerCase() === queryLower) return 1;
      
      // Then sort by symbol length (shorter first)
      return a.symbol.length - b.symbol.length;
    });
  }

  // Get all companies (for bulk operations)
  getAllCompanies() {
    return Array.from(this.cache.values());
  }

  // Get pre-generated chart data for a company
  getChartData(symbol, timeRange = '1M') {
    const chartKey = `chart_${symbol.toUpperCase()}_${timeRange}`;
    return this.chartCache.get(chartKey) || null;
  }

  // Get pre-generated financial data for a company
  getFinancialData(symbol) {
    const financialKey = `financial_${symbol.toUpperCase()}`;
    return this.chartCache.get(financialKey) || null;
  }

  // Check if chart data exists for a symbol
  hasChartData(symbol) {
    const chartKey = `chart_${symbol.toUpperCase()}_1M`;
    return this.chartCache.has(chartKey);
  }

  // Get all available symbols with chart data
  getAvailableSymbols() {
    return Array.from(this.cache.keys());
  }

  // Regenerate data for a specific symbol (if needed)
  async regenerateDataForSymbol(symbol) {
    const companyData = this.cache.get(symbol.toUpperCase());
    if (!companyData) return false;

    try {
      // Regenerate chart data for all time ranges
      const timeRanges = [
        { key: '1W', days: 7 },
        { key: '1M', days: 30 },
        { key: '3M', days: 90 },
        { key: '6M', days: 180 },
        { key: '1Y', days: 365 },
        { key: '2Y', days: 730 }
      ];

      for (const range of timeRanges) {
        const chartKey = `chart_${symbol}_${range.key}`;
        const chartData = deterministicDataGenerator.generateChartData(
          symbol, 
          companyData.price || 500, 
          range.days
        );
        this.chartCache.set(chartKey, chartData);
      }

      // Regenerate financial data
      const financialKey = `financial_${symbol}`;
      const financialData = deterministicDataGenerator.generateFinancialData(
        symbol, 
        companyData.price || 500
      );
      this.chartCache.set(financialKey, financialData);

      console.log(`Regenerated data for ${symbol}`);
      this.saveChartCacheToLocalStorage();
      return true;
    } catch (error) {
      console.error(`Error regenerating data for ${symbol}:`, error);
      return false;
    }
  }

  // Get top gainers
  getTopGainers(limit = 10) {
    return Array.from(this.cache.values())
      .filter(company => company.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit);
  }

  // Get top losers
  getTopLosers(limit = 10) {
    return Array.from(this.cache.values())
      .filter(company => company.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit);
  }

  // Get cache statistics
  getStats() {
    const companies = Array.from(this.cache.values());
    const gainers = companies.filter(c => c.changePercent > 0).length;
    const losers = companies.filter(c => c.changePercent < 0).length;
    const unchanged = companies.filter(c => c.changePercent === 0).length;
    
    return {
      totalCompanies: this.cache.size,
      gainers,
      losers,
      unchanged,
      lastUpdate: this.lastUpdate,
      dataAge: this.getDataAge(),
      isUpdating: this.isUpdating,
      nextUpdate: this.getNextUpdateTime(),
      chartCacheSize: this.chartCache.size,
      isInitialized: this.isInitialized,
      availableTimeRanges: ['1W', '1M', '3M', '6M', '1Y', '2Y']
    };
  }

  getDataAge() {
    if (!this.lastUpdate) return 'Never updated';
    
    const ageMs = Date.now() - this.lastUpdate.getTime();
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    
    if (ageMinutes < 1) return 'Just updated';
    if (ageMinutes === 1) return '1 minute ago';
    if (ageMinutes < 60) return `${ageMinutes} minutes ago`;
    
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours === 1) return '1 hour ago';
    return `${ageHours} hours ago`;
  }

  getNextUpdateTime() {
    if (!this.lastUpdate) return 'Unknown';
    
    const nextUpdate = new Date(this.lastUpdate.getTime() + this.updateInterval);
    const timeUntil = nextUpdate.getTime() - Date.now();
    
    if (timeUntil <= 0) return 'Updating now...';
    
    const minutesUntil = Math.floor(timeUntil / (1000 * 60));
    if (minutesUntil < 60) return `${minutesUntil} minutes`;
    
    const hoursUntil = Math.floor(minutesUntil / 60);
    return `${hoursUntil} hours ${minutesUntil % 60} minutes`;
  }

  // Force cache update
  async forceUpdate() {
    console.log('Forcing cache update...');
    await this.updateCache();
  }

  // Check if cache is stale
  isStale() {
    if (!this.lastUpdate) return true;
    
    const ageMs = Date.now() - this.lastUpdate.getTime();
    return ageMs > this.updateInterval;
  }

  // Cleanup
  destroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.cache.clear();
    console.log('Market data cache destroyed');
  }
}

// Create singleton instance
const marketDataCache = new MarketDataCache();

export default marketDataCache;
