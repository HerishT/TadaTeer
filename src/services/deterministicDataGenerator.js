// Deterministic Data Generator Service
// Uses seeded random number generation to ensure consistent data across refreshes

class DeterministicDataGenerator {
  constructor() {
    this.cache = new Map();
  }

  // Seeded random number generator (uses simple LCG algorithm)
  createSeededRandom(seed) {
    let current = this.hashString(seed);
    
    return function() {
      current = (current * 1664525 + 1013904223) % 4294967296;
      return current / 4294967296;
    };
  }

  // Convert string to number for seeding
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  // Generate deterministic chart data for a company
  generateChartData(companySymbol, currentPrice = 500, dataPoints = 730) {
    const cacheKey = `chart_${companySymbol}_${dataPoints}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const random = this.createSeededRandom(companySymbol);
    
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);

    const labels = [];
    const prices = [];
    
    // Deterministic parameters based on symbol
    const baseVolatility = 0.08 + random() * 0.08; // 8-16% volatility
    const dailyVolatility = baseVolatility / Math.sqrt(252);
    
    const startingPrice = currentPrice * (0.7 + random() * 0.6); // 70%-130% range
    let currentPricePoint = Math.log(startingPrice);
    
    // Deterministic patterns
    let trendDirection = random() > 0.5 ? 1 : -1;
    let cyclePeriod = 30 + random() * 60; // 30-90 days
    let noiseLevel = 0.5 + random() * 1.0;
    let momentum = 0;
    let marketRegime = random() > 0.7 ? 'volatile' : 'stable';
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      labels.push(date);
      
      if (i === dataPoints - 1) {
        prices.push(currentPrice);
      } else {
        const progressToEnd = i / (dataPoints - 1);
        const expectedLogPrice = Math.log(startingPrice) + (Math.log(currentPrice) - Math.log(startingPrice)) * progressToEnd;
        
        // Change patterns deterministically
        if (i % Math.floor(cyclePeriod) === 0) {
          trendDirection = random() > 0.5 ? 1 : -1;
          cyclePeriod = 30 + random() * 60;
          noiseLevel = 0.5 + random() * 1.0;
          marketRegime = random() > 0.7 ? 'volatile' : 'stable';
        }
        
        // Calculate price movements
        const volatilityMultiplier = marketRegime === 'volatile' ? 2.0 : 1.0;
        const adjustedVolatility = dailyVolatility * volatilityMultiplier;
        
        // Trend component
        const trendStrength = 0.001 + random() * 0.002;
        const trendComponent = trendDirection * trendStrength;
        
        // Cyclical component
        const cyclePhase = (i % cyclePeriod) / cyclePeriod * 2 * Math.PI;
        const cycleComponent = Math.sin(cyclePhase) * 0.002 * noiseLevel;
        
        // Random component (Box-Muller transform for normal distribution)
        const u1 = random();
        const u2 = random();
        const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomComponent = normalRandom * adjustedVolatility;
        
        // Momentum component
        momentum = momentum * 0.95 + randomComponent * 0.1;
        const momentumComponent = momentum * 0.3;
        
        // Mean reversion to expected price
        const deviation = currentPricePoint - expectedLogPrice;
        const meanReversionComponent = -deviation * 0.01;
        
        // Combine all components
        const totalChange = trendComponent + cycleComponent + randomComponent + 
                          momentumComponent + meanReversionComponent;
        
        currentPricePoint += totalChange;
        const price = Math.exp(currentPricePoint);
        prices.push(Math.max(price, 1)); // Ensure positive price
      }
    }

    const chartData = {
      labels: labels,
      datasets: [{
        label: companySymbol,
        data: prices,
        borderColor: this.getCompanyColor(companySymbol),
        backgroundColor: this.getCompanyColor(companySymbol, 0.1),
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4
      }]
    };

    this.cache.set(cacheKey, chartData);
    return chartData;
  }

  // Generate consistent teal color for charts
  getCompanyColor(symbol, alpha = 1) {
    // Always use teal color for consistency
    const tealHue = 180; // Teal hue
    const saturation = 75; // Good saturation for teal
    const lightness = 55; // Good lightness for visibility
    
    if (alpha === 1) {
      return `hsl(${tealHue}, ${saturation}%, ${lightness}%)`;
    } else {
      return `hsla(${tealHue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }
  }

  // Generate deterministic market data for a company
  generateMarketData(symbol, baseCachedData = null) {
    const random = this.createSeededRandom(symbol);
    
    const basePrice = baseCachedData?.price || (200 + random() * 800);
    const change = (random() - 0.5) * 40; // -20 to +20
    const changePercent = (change / basePrice) * 100;

    const sectors = [
      'Banking', 'Finance', 'Insurance', 'Hotels and Tourism', 'Trading',
      'Manufacturing and Processing', 'Hydropower', 'Mutual Fund',
      'Development Bank', 'Microfinance', 'Non Life Insurance', 'Life Insurance'
    ];

    return {
      symbol: symbol,
      name: baseCachedData?.name || `${symbol} Company Limited`,
      price: basePrice,
      change: change,
      changePercent: changePercent,
      sector: sectors[Math.floor(random() * sectors.length)],
      high: parseFloat((basePrice + random() * 20).toFixed(2)),
      low: parseFloat((basePrice - random() * 20).toFixed(2)),
      open: parseFloat((basePrice + (random() - 0.5) * 10).toFixed(2)),
      volume: Math.floor(random() * 50000) + 5000,
      turnover: 0,
      marketCap: Math.floor((basePrice * 1000000) + random() * 10000000000),
      previousClose: basePrice - change,
      lastTradedVolume: Math.floor(random() * 1000) + 100,
      averagePrice: parseFloat((basePrice + (random() - 0.5) * 5).toFixed(2)),
      lastUpdated: new Date().toISOString(),
      securityId: Math.floor(random() * 10000),
      indexId: Math.floor(random() * 100),
      _source: 'deterministic_generated',
      _generatedAt: new Date().toISOString()
    };
  }

  // Generate financial data
  generateFinancialData(symbol, currentPrice = 500) {
    const random = this.createSeededRandom(symbol + '_financials');
    
    const baseRevenue = 500000000 + random() * 2000000000;
    const years = ['2020', '2021', '2022', '2023', '2024'];
    
    const revenue = years.map((_, i) => Math.round(baseRevenue * (1 + (i * 0.1) + (random() - 0.5) * 0.2)));
    const netProfit = years.map((_, i) => Math.round(baseRevenue * 0.15 * (1 + (i * 0.08) + (random() - 0.5) * 0.3)));
    const assets = years.map((_, i) => Math.round(baseRevenue * 3 * (1 + i * 0.12 + (random() - 0.5) * 0.25)));
    const operatingCashFlow = years.map((_, i) => Math.round(baseRevenue * 0.2 * (1 + i * 0.1 + (random() - 0.5) * 0.3)));

    return {
      forecast: {
        targetPrice: Math.round(currentPrice * (1 + (0.05 + random() * 0.15))),
        confidence: Math.round(65 + random() * 25),
        timeframe: '12 months'
      },
      valuation: {
        peRatio: (15 + random() * 20).toFixed(1),
        pbRatio: (1.2 + random() * 2.5).toFixed(1),
        rating: random() > 0.6 ? 'Undervalued' : random() > 0.3 ? 'Fair Value' : 'Overvalued'
      },
      risk: {
        volatility: (10 + random() * 25).toFixed(1),
        beta: (0.8 + random() * 0.8).toFixed(2),
        riskLevel: random() > 0.7 ? 'High' : random() > 0.4 ? 'Medium' : 'Low'
      },
      sentiment: {
        score: Math.round(40 + random() * 40),
        mood: random() > 0.6 ? 'Positive' : random() > 0.3 ? 'Neutral' : 'Negative',
        social: Math.round(60 + random() * 30)
      },
      financials: {
        years,
        revenue,
        netProfit,
        assets,
        operatingCashFlow
      }
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const deterministicDataGenerator = new DeterministicDataGenerator();

export default deterministicDataGenerator;
