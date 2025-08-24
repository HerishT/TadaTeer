class MarketApiService {
  constructor() {
    this.baseUrl = 'http://localhost:8000'; // Adjust based on your backend port
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async fetchWithCache(endpoint) {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      // Return mock data as fallback
      return this.getMockData(endpoint);
    }
  }

  getMockData(endpoint) {
    const mockData = {
      '/Summary': {
        totalListedCompanies: 250,
        totalTradedCompanies: 180,
        totalTurnover: 5200000000,
        totalVolume: 12500000,
        totalTransactions: 45000,
        marketCap: 4500000000000
      },
      '/NepseIndex': {
        index: 2089.5,
        change: 25.8,
        percentChange: 1.25,
        date: new Date().toISOString().split('T')[0]
      },
      '/LiveMarket': {
        totalTurnover: 5200000000,
        totalVolume: 12500000,
        totalTransactions: 45000,
        advancers: 120,
        decliners: 95,
        unchanged: 35
      },
      '/TopGainers': [
        { symbol: 'NABIL', name: 'Nabil Bank Limited', ltp: 1200, change: 45, percentChange: 3.89 },
        { symbol: 'SANIMA', name: 'Sanima Bank Limited', ltp: 545, change: 18, percentChange: 3.42 },
        { symbol: 'EBL', name: 'Everest Bank Limited', ltp: 680, change: 22, percentChange: 3.34 },
        { symbol: 'SCBL', name: 'Standard Chartered Bank Nepal', ltp: 450, change: 14, percentChange: 3.21 },
        { symbol: 'HBL', name: 'Himalayan Bank Limited', ltp: 520, change: 15, percentChange: 2.97 }
      ],
      '/TopLosers': [
        { symbol: 'NTC', name: 'Nepal Telecom Company Limited', ltp: 890, change: -28, percentChange: -3.05 },
        { symbol: 'NHPC', name: 'NHPC Limited', ltp: 350, change: -12, percentChange: -3.31 },
        { symbol: 'NLIC', name: 'Nepal Life Insurance Company Limited', ltp: 1450, change: -48, percentChange: -3.20 },
        { symbol: 'UIC', name: 'United Insurance Company Limited', ltp: 680, change: -20, percentChange: -2.86 },
        { symbol: 'PICL', name: 'Premier Insurance Company Limited', ltp: 820, change: -22, percentChange: -2.61 }
      ],
      '/NepseSubIndices': [
        { indexName: 'Banking Sub-Index', value: 1850.5, change: 18.2, percentChange: 0.99 },
        { indexName: 'Development Bank Sub-Index', value: 2150.8, change: -12.5, percentChange: -0.58 },
        { indexName: 'Finance Sub-Index', value: 1920.3, change: 25.6, percentChange: 1.35 },
        { indexName: 'Hotels And Tourism Sub-Index', value: 2890.1, change: 35.2, percentChange: 1.23 },
        { indexName: 'Hydropower Sub-Index', value: 1750.9, change: -8.9, percentChange: -0.51 },
        { indexName: 'Investment Sub-Index', value: 950.2, change: 12.1, percentChange: 1.29 },
        { indexName: 'Life Insurance Sub-Index', value: 8950.6, change: 89.3, percentChange: 1.01 },
        { indexName: 'Manufacturing And Processing Sub-Index', value: 4250.8, change: -25.6, percentChange: -0.60 },
        { indexName: 'Microfinance Sub-Index', value: 2950.4, change: 18.9, percentChange: 0.64 },
        { indexName: 'Non Life Insurance Sub-Index', value: 7850.3, change: 45.2, percentChange: 0.58 }
      ]
    };

    return mockData[endpoint] || {};
  }

  // Market Overview APIs
  async getSummary() {
    return this.fetchWithCache('/Summary');
  }

  async getNepseIndex() {
    return this.fetchWithCache('/NepseIndex');
  }

  async getLiveMarket() {
    return this.fetchWithCache('/LiveMarket');
  }

  async isNepseOpen() {
    return this.fetchWithCache('/IsNepseOpen');
  }

  // Top Performers APIs
  async getTopGainers() {
    return this.fetchWithCache('/TopGainers');
  }

  async getTopLosers() {
    return this.fetchWithCache('/TopLosers');
  }

  async getTopTenTradeScrips() {
    return this.fetchWithCache('/TopTenTradeScrips');
  }

  async getTopTenTurnoverScrips() {
    return this.fetchWithCache('/TopTenTurnoverScrips');
  }

  async getTopTenTransactionScrips() {
    return this.fetchWithCache('/TopTenTransactionScrips');
  }

  // Market Depth APIs
  async getMarketDepth() {
    return this.fetchWithCache('/MarketDepth');
  }

  async getSupplyDemand() {
    return this.fetchWithCache('/SupplyDemand');
  }

  // Sector APIs
  async getNepseSubIndices() {
    return this.fetchWithCache('/NepseSubIndices');
  }

  async getSectorScrips(sector) {
    return this.fetchWithCache(`/SectorScrips?sector=${encodeURIComponent(sector)}`);
  }

  async getCompanyList() {
    return this.fetchWithCache('/CompanyList');
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

const marketApiService = new MarketApiService();
export default marketApiService;
