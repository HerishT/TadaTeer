// Chart Pre-Generation Service
// Generates realistic charts for all companies at startup and stores them

// Helper functions for chart generation (same as DashboardPage.js)
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

class ChartPreGeneration {
  constructor() {
    this.charts = new Map();
    this.isGenerating = false;
    this.generationComplete = false;
  }

  async initializeCharts() {
    if (this.isGenerating || this.generationComplete) {
      console.log(`📊 Chart generation status: generating=${this.isGenerating}, complete=${this.generationComplete}`);
      return;
    }

    console.log('🚀 Starting chart pre-generation for all companies...');
    this.isGenerating = true;

    try {
      // Get all companies from the market cache
      const marketCache = window.marketDataCache;
      if (!marketCache) {
        console.error('Market data cache not available');
        this.isGenerating = false;
        return;
      }

      await marketCache.initialize();
      const allCompanies = marketCache.getAllCompanies();
      
      console.log(`📊 Generating charts for ${allCompanies.length} companies...`);
      
      // Generate charts for all companies
      let processed = 0;
      const batchSize = 10; // Process in batches to avoid blocking UI
      
      for (let i = 0; i < allCompanies.length; i += batchSize) {
        const batch = allCompanies.slice(i, i + batchSize);
        
        // Process batch
        for (const company of batch) {
          try {
            const chartData = this.generateMasterChartForCompany(company);
            this.charts.set(company.symbol, chartData);
            processed++;
          } catch (error) {
            console.error(`Error generating chart for ${company.symbol}:`, error);
          }
        }
        
        // Update progress
        const progress = Math.round((processed / allCompanies.length) * 100);
        console.log(`📈 Chart generation progress: ${progress}% (${processed}/${allCompanies.length})`);
        
        // Yield to UI thread
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      this.generationComplete = true;
      console.log(`✅ Chart pre-generation complete! Generated ${this.charts.size} charts.`);
      
      // Store in localStorage for persistence
      this.saveToLocalStorage();

    } catch (error) {
      console.error('Error during chart pre-generation:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  generateMasterChartForCompany(companyData) {
    const currentPrice = companyData.price || 500;
    const changePercent = companyData.changePercent || 0;
    
    // Generate 2 years of daily data as the master dataset
    const dataPoints = 730;
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);

    // Generate realistic stock price using enhanced model with better convergence
    const labels = [];
    const prices = [];
    
    // Enhanced parameters for more realistic movement with smaller, frequent changes
    const baseVolatility = 0.12; // Reduced from 0.20 to 12% for smaller movements
    const meanReversion = 0.015; // Slightly reduced mean reversion
    const trendStrength = 0.05; // Reduced trend influence for more frequent direction changes
    
    // Calculate a more realistic drift with smaller impact
    const annualDrift = changePercent / 100 / 3; // Spread over 3 years instead of 2
    const dailyDrift = annualDrift / 365;
    
    // Start from a price that allows for natural evolution to current price
    const priceRange = currentPrice * 0.4; // Allow 40% range around current price
    const minStartPrice = currentPrice - priceRange;
    const maxStartPrice = currentPrice + priceRange;
    const startingPrice = minStartPrice + Math.random() * (maxStartPrice - minStartPrice);
    
    // Generate price path with multiple sources of randomness
    let currentPricePoint = Math.log(startingPrice);
    let longTermTrend = 0; // Slow-moving trend component
    let momentum = 0; // Short-term momentum
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      labels.push(date);
      
      // Calculate how close we are to the end (for gradual convergence)
      const progressToEnd = i / (dataPoints - 1);
      const convergenceFactor = Math.pow(progressToEnd, 2); // Quadratic convergence
      
      // Dynamic volatility with more frequent but smaller variations
      const volatilityMultiplier = 0.9 + 0.2 * Math.sin(i / 30) + 0.1 * Math.random(); // Smaller range, more frequent changes
      const currentVolatility = baseVolatility * volatilityMultiplier / Math.sqrt(252);
      
      // Update trend and momentum more frequently for smaller movements
      if (i % 10 === 0) { // Update every 10 days instead of 20
        longTermTrend += (Math.random() - 0.5) * 0.0005; // Smaller trend changes
        longTermTrend *= 0.98; // Stronger decay
      }
      
      if (i % 3 === 0) { // Update every 3 days instead of 5
        momentum += (Math.random() - 0.5) * 0.001; // Smaller momentum changes
        momentum *= 0.85; // Stronger decay
      }
      
      if (i === dataPoints - 1) {
        // Final point should be exactly the current price
        prices.push(currentPrice);
      } else {
        // Calculate expected price at this point for convergence
        const expectedLogPrice = Math.log(startingPrice) + (Math.log(currentPrice) - Math.log(startingPrice)) * progressToEnd;
        
        // Multiple components of price movement
        const randomWalk = generateGaussianRandom() * currentVolatility;
        const trendComponent = longTermTrend + dailyDrift * trendStrength;
        const momentumComponent = momentum;
        
        // Strong convergence force that increases quadratically toward the end
        const convergenceStrength = Math.pow(progressToEnd, 2) * 0.15; // Quadratic increase
        const convergenceForce = (expectedLogPrice - currentPricePoint) * convergenceStrength;
        
        // Combine all components with convergence force
        const totalChange = randomWalk + trendComponent + momentumComponent + convergenceForce;
        
        // Update log price
        currentPricePoint += totalChange;
        
        // Convert to actual price
        const price = Math.exp(currentPricePoint);
        const intradayNoise = (Math.random() - 0.5) * 0.001 * price; // Reduced from 0.003 to 0.001
        const finalPrice = price + intradayNoise;
        
        // Tighter bounds to prevent extreme movements
        const minPrice = startingPrice * 0.5; // Less extreme downside
        const maxPrice = startingPrice * 2.0; // Less extreme upside
        const boundedPrice = Math.max(minPrice, Math.min(maxPrice, finalPrice));
        
        prices.push(boundedPrice);
      }
    }
    
    // Add more frequent but smaller market events
    const numEvents = Math.floor(dataPoints / 60); // More frequent events (every ~2 months instead of 3)
    for (let e = 0; e < numEvents; e++) {
      const eventDay = Math.floor(Math.random() * (dataPoints - 30)) + 15;
      const eventMagnitude = (Math.random() - 0.5) * 0.08; // Smaller events (±4% instead of ±7.5%)
      const eventDuration = Math.floor(Math.random() * 3) + 1; // Shorter duration (1-3 days instead of 1-5)
      
      for (let d = 0; d < eventDuration && eventDay + d < dataPoints - 1; d++) {
        const dayEffect = eventMagnitude * Math.exp(-d / 1.5); // Faster decay
        prices[eventDay + d] *= (1 + dayEffect);
      }
    }
    
    // Light smoothing to remove unrealistic spikes while preserving volatility
    for (let i = 2; i < prices.length - 2; i++) {
      const window = [prices[i-2], prices[i-1], prices[i], prices[i+1], prices[i+2]];
      const median = window.sort((a, b) => a - b)[2];
      const deviation = Math.abs(prices[i] - median) / median;
      
      // Only smooth if deviation is extreme (>10%)
      if (deviation > 0.1) {
        prices[i] = prices[i] * 0.7 + median * 0.3;
      }
    }

    return {
      symbol: companyData.symbol,
      labels,
      prices: prices.map(p => parseFloat(p.toFixed(2))),
      generatedAt: new Date().toISOString()
    };
  }

  getChartData(symbol) {
    return this.charts.get(symbol?.toUpperCase());
  }

  hasChartData(symbol) {
    return this.charts.has(symbol?.toUpperCase());
  }

  saveToLocalStorage() {
    try {
      const chartArray = Array.from(this.charts.entries());
      localStorage.setItem('preGeneratedCharts', JSON.stringify({
        charts: chartArray,
        generatedAt: new Date().toISOString(),
        version: '1.1' // Updated version for new smaller movement parameters
      }));
      console.log('💾 Pre-generated charts saved to localStorage');
    } catch (error) {
      console.error('Error saving charts to localStorage:', error);
    }
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('preGeneratedCharts');
      if (stored) {
        const data = JSON.parse(stored);
        // Check version to invalidate old charts with different parameters
        if (data.charts && Array.isArray(data.charts) && data.version === '1.1') {
          this.charts = new Map(data.charts);
          this.generationComplete = true;
          console.log(`📁 Loaded ${this.charts.size} pre-generated charts from localStorage`);
          return true;
        } else {
          console.log('🔄 Clearing old chart cache due to version update');
          localStorage.removeItem('preGeneratedCharts');
        }
      }
    } catch (error) {
      console.error('Error loading charts from localStorage:', error);
    }
    return false;
  }

  getProgress() {
    return {
      isGenerating: this.isGenerating,
      isComplete: this.generationComplete,
      chartCount: this.charts.size
    };
  }
}

// Create and export singleton instance
const instance = new ChartPreGeneration();

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  // Try to load from localStorage first
  if (!instance.loadFromLocalStorage()) {
    // If not in localStorage, start generation
    setTimeout(() => instance.initializeCharts(), 1000);
  }
}

// Create explicit wrapper functions to avoid any binding issues
function initializeCharts() {
  return instance.initializeCharts();
}

function getProgress() {
  return instance.getProgress();
}

function getChartData(symbol) {
  return instance.getChartData(symbol);
}

function hasChartData(symbol) {
  return instance.hasChartData(symbol);
}

function generateMasterChartForCompany(companyData) {
  return instance.generateMasterChartForCompany(companyData);
}

function saveToLocalStorage() {
  return instance.saveToLocalStorage();
}

function loadFromLocalStorage() {
  return instance.loadFromLocalStorage();
}

// Export the functions
const chartPreGeneration = {
  initializeCharts,
  getProgress,
  getChartData,
  hasChartData,
  generateMasterChartForCompany,
  saveToLocalStorage,
  loadFromLocalStorage
};

export default chartPreGeneration;
