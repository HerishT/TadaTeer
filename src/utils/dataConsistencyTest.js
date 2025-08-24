// Data Consistency Test Script
// Run this in the browser console to verify unified data service

window.testDataConsistency = async function() {
  console.log('🔍 Testing Data Consistency Across App...');
  
  const testSymbols = ['NABIL', 'SANIMA', 'NIC', 'EBL'];
  const results = [];
  
  for (const symbol of testSymbols) {
    console.log(`\n📊 Testing ${symbol}...`);
    
    try {
      // Import the unified service (adjust path as needed)
      const unifiedDataService = await import('../services/unifiedDataService.js');
      
      // Test search
      const searchResults = await unifiedDataService.default.searchCompanies(symbol);
      const searchMatch = searchResults.find(r => r.symbol === symbol);
      
      // Test company data
      const companyData = await unifiedDataService.default.getCompanyData(symbol);
      
      // Test consistency verification
      const consistencyReport = await unifiedDataService.default.verifyConsistency(symbol);
      
      const result = {
        symbol,
        searchFound: !!searchMatch,
        searchPrice: searchMatch?.price,
        companyPrice: companyData?.currentPrice || companyData?.price,
        consistency: consistencyReport,
        pricesMatch: Math.abs((searchMatch?.price || 0) - (companyData?.currentPrice || companyData?.price || 0)) < 0.01
      };
      
      results.push(result);
      
      console.log(`✅ ${symbol} Results:`, {
        'Search Found': result.searchFound,
        'Search Price': result.searchPrice,
        'Company Price': result.companyPrice,
        'Prices Match': result.pricesMatch,
        'Source': companyData?.source
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error);
      results.push({
        symbol,
        error: error.message
      });
    }
  }
  
  console.log('\n📋 Summary Report:');
  console.table(results);
  
  const consistentCount = results.filter(r => r.pricesMatch && !r.error).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 Data Consistency Score: ${consistentCount}/${totalCount} (${Math.round(consistentCount/totalCount*100)}%)`);
  
  if (consistentCount === totalCount) {
    console.log('🎉 All data sources are consistent!');
  } else {
    console.log('⚠️  Some inconsistencies found. Check the results above.');
  }
  
  return results;
};

console.log('✅ Data consistency test function loaded. Run window.testDataConsistency() to test.');
