#!/usr/bin/env node

/**
 * COMPLETE CACHE CLEARING SCRIPT FOR TADATEER APP
 * This will clear EVERYTHING that's cached in the app
 */

console.log('🗑️  CLEARING ALL CACHE FOR TADATEER APP...\n');

// Browser Console Commands (copy-paste into DevTools Console)
const browserCommands = `
// ===== CLEAR ALL CACHE IN BROWSER CONSOLE =====
// Copy and paste this entire block into your browser's DevTools Console:

console.log('🗑️ Clearing ALL cache...');

// 1. Clear localStorage completely
localStorage.clear();
console.log('✅ localStorage cleared');

// 2. Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// 3. Clear specific app localStorage items
const appKeys = [
  'preGeneratedCharts',
  'tadateer_user', 
  'tadateer_search_history',
  'tadateer_notes'
];
appKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log('✅ Removed:', key);
});

// 4. Clear market data cache (in-memory)
if (window.marketDataCache) {
  window.marketDataCache.destroy();
  console.log('✅ Market data cache destroyed');
}

// 5. Clear ML forecast cache (if available)
if (window.mlForecastService) {
  window.mlForecastService.clearCache();
  console.log('✅ ML forecast cache cleared');
}

// 6. Clear forecaster service cache (if available)
if (window.forecasterService) {
  window.forecasterService.cache.clear();
  console.log('✅ Forecaster service cache cleared');
}

// 7. Clear any IndexedDB (if used)
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name.includes('tadateer') || db.name.includes('nepse')) {
        indexedDB.deleteDatabase(db.name);
        console.log('✅ Deleted IndexedDB:', db.name);
      }
    });
  });
}

console.log('🚀 ALL CACHE CLEARED! Refresh the page to start fresh.');
`;

console.log('📋 COPY AND PASTE THIS INTO YOUR BROWSER CONSOLE:');
console.log('=' * 60);
console.log(browserCommands);
console.log('=' * 60);

// Terminal commands for clearing any backend cache
console.log('\n🖥️  TERMINAL COMMANDS (if you have backend cache):');
console.log('cd /Users/ht/Documents/TadaTeer');
console.log('rm -rf node_modules/.cache');
console.log('rm -rf .next/cache');
console.log('rm -rf build');
console.log('rm -rf dist');
console.log('npm run clean || yarn clean (if available)');

console.log('\n✨ COMPLETE CACHE CLEARING INSTRUCTIONS:');
console.log('1. Open your app in browser');
console.log('2. Open DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy-paste the browser commands above');
console.log('5. Run the terminal commands if needed');
console.log('6. Refresh your browser');
console.log('7. Hard refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)');

console.log('\n🔥 NUCLEAR OPTION - Clear everything including browser cache:');
console.log('- Chrome: Settings > Privacy > Clear browsing data > All time');
console.log('- Firefox: Settings > Privacy > Clear Data');
console.log('- Safari: Develop > Empty Caches');
