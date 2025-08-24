// Comprehensive Mock Data Service for TadaTeer
const mockDataService = {
  // Mock company database
  companies: {
    'NABIL': {
      name: 'Nabil Bank Limited',
      symbol: 'NABIL',
      sector: 'Commercial Banks',
      price: 545.50,
      change: 12.50,
      changePercent: 2.34,
      high: 552.00,
      low: 535.00,
      open: 540.00,
      volume: 45230,
      previousClose: 533.00,
      marketCap: 14700000000,
      webUrl: 'www.nabilbank.com',
      email: 'info@nabilbank.com'
    },
    'SANIMA': {
      name: 'Sanima Bank Limited',
      symbol: 'SANIMA',
      sector: 'Commercial Banks',
      price: 425.80,
      change: -8.20,
      changePercent: -1.89,
      high: 435.00,
      low: 420.00,
      open: 432.00,
      volume: 32150,
      previousClose: 434.00,
      marketCap: 8500000000,
      webUrl: 'www.sanimabank.com',
      email: 'info@sanimabank.com'
    },
    'NIC': {
      name: 'NIC Asia Bank Limited',
      symbol: 'NIC',
      sector: 'Commercial Banks',
      price: 1245.00,
      change: 25.00,
      changePercent: 2.05,
      high: 1250.00,
      low: 1220.00,
      open: 1225.00,
      volume: 18750,
      previousClose: 1220.00,
      marketCap: 18200000000,
      webUrl: 'www.nicasiabank.com',
      email: 'info@nicasiabank.com'
    },
    'EBL': {
      name: 'Everest Bank Limited',
      symbol: 'EBL',
      sector: 'Commercial Banks',
      price: 680.50,
      change: 5.50,
      changePercent: 0.81,
      high: 685.00,
      low: 675.00,
      open: 678.00,
      volume: 28900,
      previousClose: 675.00,
      marketCap: 12300000000,
      webUrl: 'www.everestbankltd.com',
      email: 'info@everestbankltd.com'
    },
    'SBI': {
      name: 'Nepal SBI Bank Limited',
      symbol: 'SBI',
      sector: 'Commercial Banks',
      price: 385.25,
      change: -2.75,
      changePercent: -0.71,
      high: 390.00,
      low: 382.00,
      open: 388.00,
      volume: 15600,
      previousClose: 388.00,
      marketCap: 6800000000,
      webUrl: 'www.nepalsbi.com.np',
      email: 'info@nepalsbi.com.np'
    },
    'BOK': {
      name: 'Bank of Kathmandu Limited',
      symbol: 'BOK',
      sector: 'Commercial Banks',
      price: 275.40,
      change: 3.40,
      changePercent: 1.25,
      high: 278.00,
      low: 272.00,
      open: 274.00,
      volume: 22100,
      previousClose: 272.00,
      marketCap: 5200000000,
      webUrl: 'www.bok.com.np',
      email: 'info@bok.com.np'
    },
    'GBIME': {
      name: 'Global IME Bank Limited',
      symbol: 'GBIME',
      sector: 'Commercial Banks',
      price: 295.80,
      change: 1.80,
      changePercent: 0.61,
      high: 298.00,
      low: 293.00,
      open: 296.00,
      volume: 35400,
      previousClose: 294.00,
      marketCap: 7100000000,
      webUrl: 'www.globalimebank.com',
      email: 'info@globalimebank.com'
    },
    'ADBL': {
      name: 'Agriculture Development Bank Limited',
      symbol: 'ADBL',
      sector: 'Development Banks',
      price: 425.60,
      change: 8.60,
      changePercent: 2.06,
      high: 430.00,
      low: 420.00,
      open: 422.00,
      volume: 19800,
      previousClose: 417.00,
      marketCap: 9600000000,
      webUrl: 'www.adbl.gov.np',
      email: 'info@adbl.gov.np'
    },
    'NEPSE': {
      name: 'Nepal Stock Exchange',
      symbol: 'NEPSE',
      sector: 'Exchange',
      price: 1850.25,
      change: 45.75,
      changePercent: 2.54,
      high: 1865.00,
      low: 1820.00,
      open: 1830.00,
      volume: 12500,
      previousClose: 1804.50,
      marketCap: 15000000000,
      webUrl: 'www.nepalstock.com',
      email: 'info@nepalstock.com'
    },
    'HIDCL': {
      name: 'Hydroelectricity Investment and Development Company Limited',
      symbol: 'HIDCL',
      sector: 'Investment',
      price: 285.75,
      change: -3.25,
      changePercent: -1.12,
      high: 292.00,
      low: 282.00,
      open: 289.00,
      volume: 8750,
      previousClose: 289.00,
      marketCap: 4200000000,
      webUrl: 'www.hidcl.org.np',
      email: 'info@hidcl.org.np'
    },
    'NRN': {
      name: 'NRN Infrastructure and Development Company Limited',
      symbol: 'NRN',
      sector: 'Investment',
      price: 450.80,
      change: 12.30,
      changePercent: 2.81,
      high: 455.00,
      low: 442.00,
      open: 445.00,
      volume: 16200,
      previousClose: 438.50,
      marketCap: 6800000000,
      webUrl: 'www.nrn.com.np',
      email: 'info@nrn.com.np'
    },
    'PCBL': {
      name: 'Prime Commercial Bank Limited',
      symbol: 'PCBL',
      sector: 'Commercial Banks',
      price: 375.60,
      change: 8.90,
      changePercent: 2.43,
      high: 380.00,
      low: 370.00,
      open: 372.00,
      volume: 24800,
      previousClose: 366.70,
      marketCap: 7500000000,
      webUrl: 'www.primebank.com.np',
      email: 'info@primebank.com.np'
    }
  },

  // Get company data with fallback
  getCompanyData(symbol) {
    const upperSymbol = symbol.toUpperCase();
    
    // Return known company data
    if (this.companies[upperSymbol]) {
      return {
        ...this.companies[upperSymbol],
        _source: 'mock_data',
        lastTradedTime: new Date().toISOString()
      };
    }

    // Generate mock data for unknown symbols
    return this.generateRandomCompanyData(upperSymbol);
  },

  // Generate realistic random data for any symbol
  generateRandomCompanyData(symbol) {
    const sectors = ['Commercial Banks', 'Development Banks', 'Insurance', 'Hotels & Tourism', 'Hydropower'];
    const basePrice = 200 + Math.random() * 800; // Price between 200-1000
    const change = (Math.random() - 0.5) * 40; // Change between -20 to +20
    const changePercent = (change / (basePrice - change)) * 100;

    return {
      name: `${symbol} Limited`,
      symbol: symbol,
      sector: sectors[Math.floor(Math.random() * sectors.length)],
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      high: parseFloat((basePrice + Math.random() * 20).toFixed(2)),
      low: parseFloat((basePrice - Math.random() * 20).toFixed(2)),
      open: parseFloat((basePrice + (Math.random() - 0.5) * 10).toFixed(2)),
      volume: Math.floor(Math.random() * 50000) + 5000,
      previousClose: parseFloat((basePrice - change).toFixed(2)),
      marketCap: Math.floor((basePrice * 1000000) + Math.random() * 10000000000),
      webUrl: `www.${symbol.toLowerCase()}.com.np`,
      email: `info@${symbol.toLowerCase()}.com.np`,
      _source: 'generated_mock_data',
      lastTradedTime: new Date().toISOString()
    };
  },

  // Generate price chart data
  generatePriceChart(companyData, days = 30) {
    const { price, high, low } = companyData;
    const labels = [];
    const prices = [];

    // Generate realistic price history
    let currentPrice = price;
    const volatility = (high - low) * 0.3; // Daily volatility

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      if (i === 0) {
        prices.push(price); // Today's actual price
      } else {
        // Generate historical price with realistic movement
        const change = (Math.random() - 0.5) * volatility;
        const trend = Math.sin(i * 0.1) * volatility * 0.2;
        currentPrice = currentPrice - change - trend;
        
        // Keep within reasonable bounds
        currentPrice = Math.max(currentPrice, low * 0.9);
        currentPrice = Math.min(currentPrice, high * 1.1);
        
        prices.push(parseFloat(currentPrice.toFixed(2)));
      }
    }

    return {
      labels,
      datasets: [
        {
          label: `${companyData.symbol} Price`,
          data: prices,
          borderColor: 'rgb(20, 184, 166)',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
      metadata: {
        type: 'mock',
        disclaimer: 'Mock data for demonstration purposes',
        realDataPoints: 0,
        totalDataPoints: days
      }
    };
  },

  // Main method for getting company price data (used by nepseApiService)
  getCompanyPriceData(symbol) {
    const companyData = this.getCompanyData(symbol);
    
    return {
      symbol: companyData.symbol,
      name: companyData.name,
      sector: companyData.sector,
      currentPrice: companyData.price,
      change: companyData.change,
      changePercent: companyData.changePercent,
      volume: companyData.volume,
      openPrice: companyData.open,
      highPrice: companyData.high,
      lowPrice: companyData.low,
      previousClose: companyData.previousClose,
      averagePrice: companyData.price, // Use current price as average
      lastUpdated: companyData.lastTradedTime,
      source: companyData._source
    };
  },

  // Search companies
  searchCompanies(query) {
    const queryLower = query.toLowerCase();
    const matches = [];

    // Search through known companies
    Object.values(this.companies).forEach(company => {
      if (company.symbol.toLowerCase().includes(queryLower) || 
          company.name.toLowerCase().includes(queryLower)) {
        matches.push({
          symbol: company.symbol,
          name: company.name,
          currentPrice: company.price,
          change: company.change,
          changePercent: company.changePercent
        });
      }
    });

    // If no matches and query looks like a symbol, generate one
    if (matches.length === 0 && query.length <= 6) {
      const mockCompany = this.generateRandomCompanyData(query.toUpperCase());
      matches.push({
        symbol: mockCompany.symbol,
        name: mockCompany.name,
        currentPrice: mockCompany.price,
        change: mockCompany.change,
        changePercent: mockCompany.changePercent
      });
    }

    return matches.slice(0, 10);
  }
};

export default mockDataService;
