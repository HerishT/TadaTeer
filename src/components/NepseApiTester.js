import React, { useState } from 'react';
import { validateCommonStocks, testStockData } from '../utils/nepseApiTester';

const NepseApiTester = () => {
  const [testResults, setTestResults] = useState(null);
  const [stockTestResults, setStockTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testSymbol, setTestSymbol] = useState('NABIL');

  const runValidationTest = async () => {
    setLoading(true);
    try {
      const results = await validateCommonStocks();
      setTestResults(results);
    } catch (error) {
      console.error('Validation test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runStockTest = async () => {
    setLoading(true);
    try {
      const results = await testStockData(testSymbol);
      setStockTestResults(results);
    } catch (error) {
      console.error('Stock test failed:', error);
      setStockTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md z-50">
      <h3 className="text-white font-bold mb-4">NEPSE API Tester</h3>
      
      <div className="mb-4">
        <button
          onClick={runValidationTest}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm mr-2"
        >
          {loading ? 'Testing...' : 'Test Common Symbols'}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={testSymbol}
          onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
          placeholder="Stock Symbol"
          className="bg-gray-800 text-white px-2 py-1 rounded text-sm mr-2 w-20"
        />
        <button
          onClick={runStockTest}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
        >
          Test Stock Data
        </button>
      </div>

      {testResults && (
        <div className="mb-4 text-xs text-gray-300">
          <div className="text-green-400">Valid: {testResults.validSymbols.join(', ')}</div>
          <div className="text-red-400">Invalid: {testResults.invalidSymbols.length}</div>
        </div>
      )}

      {stockTestResults && (
        <div className="text-xs text-gray-300">
          {stockTestResults.error ? (
            <div className="text-red-400">Error: {stockTestResults.error}</div>
          ) : (
            <div className="text-green-400">
              ✅ Data fetched for {testSymbol}
              <br />Company: {stockTestResults.companyData?.company?.companyName || 'N/A'}
              <br />Price: रु {stockTestResults.companyData?.currentPrice || 'N/A'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NepseApiTester;
