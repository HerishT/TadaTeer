import nepseApiService from '../services/nepseApiService';

// Common NEPSE stock symbols for testing
const testSymbols = [
  'NABIL',     // Nabil Bank Limited
  'SANIMA',    // Sanima Bank Limited
  'NIC',       // NIC Asia Bank Limited
  'NICA',      // NIC Asia Bank
  'SBI',       // Nepal SBI Bank Limited
  'EBL',       // Everest Bank Limited
  'BOK',       // Bank of Kathmandu Limited
  'NCCB',      // Nepal Credit and Commerce Bank Limited
  'ADBL',      // Agriculture Development Bank Limited
  'GBIME',     // Global IME Bank Limited
];

export const validateCommonStocks = async () => {
  console.log('Testing common NEPSE stock symbols...');
  
  const validSymbols = [];
  const invalidSymbols = [];
  
  for (const symbol of testSymbols) {
    try {
      console.log(`Testing ${symbol}...`);
      const validation = await nepseApiService.validateStock(symbol);
      
      if (validation.valid) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol} is valid`);
      } else {
        invalidSymbols.push({ symbol, error: validation.error });
        console.log(`❌ ${symbol} is invalid: ${validation.error}`);
      }
    } catch (error) {
      invalidSymbols.push({ symbol, error: error.message });
      console.log(`❌ ${symbol} failed: ${error.message}`);
    }
  }
  
  console.log('\n📊 Validation Results:');
  console.log(`Valid symbols (${validSymbols.length}):`, validSymbols);
  console.log(`Invalid symbols (${invalidSymbols.length}):`, invalidSymbols);
  
  return { validSymbols, invalidSymbols };
};

export const testStockData = async (symbol) => {
  try {
    console.log(`\n🔍 Testing data fetch for ${symbol}:`);
    
    // Test company details
    console.log('Fetching company details...');
    const companyData = await nepseApiService.getCompanyPriceData(symbol);
    console.log('Company data:', companyData);
    
    // Test price chart data
    console.log('Fetching price chart data...');
    const priceData = await nepseApiService.getDailyPriceGraph(symbol);
    console.log('Price data:', priceData);
    
    // Test formatted chart data
    console.log('Formatting chart data...');
    const chartData = nepseApiService.formatPriceGraphData(priceData, symbol);
    console.log('Chart data:', chartData);
    
    return { companyData, priceData, chartData };
    
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${symbol}:`, error);
    throw error;
  }
};

// Export the test functions
export default {
  validateCommonStocks,
  testStockData
};
