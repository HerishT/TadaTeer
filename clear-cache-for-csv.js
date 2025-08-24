// Clear cache and reload from CSV
console.log('Clearing existing cache...');

// Clear localStorage cache
localStorage.removeItem('nepse_market_cache');
localStorage.removeItem('nepse_chart_cache');
localStorage.removeItem('preGeneratedCharts');

console.log('Cache cleared! Refresh the page to load from CSV.');

// If market cache is available, destroy it
if (window.marketDataCache) {
  window.marketDataCache.destroy();
  console.log('Market data cache destroyed');
}

console.log('✅ All cache cleared. Please refresh the page.');
