import { useState, useEffect, useCallback } from 'react';
import unifiedDataService from '../services/unifiedDataService';
import mockDataService from '../services/mockDataService';

export const useCompanyData = (symbol) => {
  const [companyData, setCompanyData] = useState(null);
  const [priceChartData, setPriceChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCompanyData = useCallback(async (stockSymbol) => {
    if (!stockSymbol) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching company data for:', stockSymbol);

      // Use unified data service for guaranteed consistency
      console.log(`[COMPANY_DATA] Fetching data for ${stockSymbol} using unified service`);
      
      try {
        // Get company data from unified service
        const companyPriceData = await unifiedDataService.getCompanyData(stockSymbol);
        
        console.log(`[COMPANY_DATA] Retrieved data for ${stockSymbol}:`, companyPriceData?.name);
        
        // Transform company data for the dashboard with proper number parsing
        const transformedCompanyData = {
          name: companyPriceData.name || stockSymbol,
          symbol: stockSymbol.toUpperCase(),
          sector: companyPriceData.sector || 'Unknown Sector',
          price: Number(companyPriceData.currentPrice || companyPriceData.price || 0),
          change: Number(companyPriceData.change || 0),
          changePercent: Number(companyPriceData.changePercent || 0),
          high: Number(companyPriceData.highPrice || companyPriceData.high || 0),
          low: Number(companyPriceData.lowPrice || companyPriceData.low || 0),
          open: Number(companyPriceData.openPrice || companyPriceData.open || 0),
          volume: companyPriceData.volume || 0,
          previousClose: Number(companyPriceData.previousClose || 0),
          marketCap: companyPriceData.marketCap,
          webUrl: companyPriceData.webUrl,
          email: companyPriceData.email,
          lastTradedTime: companyPriceData.lastUpdated,
          _source: companyPriceData.source || 'unified'
        };

        // Use price history from unified service or generate chart data
        let chartData;
        
        if (companyPriceData.priceHistory) {
          chartData = {
            labels: companyPriceData.priceHistory.map(point => point.date),
            datasets: [{
              label: stockSymbol,
              data: companyPriceData.priceHistory.map(point => point.price),
              borderColor: 'rgb(20, 184, 166)', // Teal color
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.1
            }]
          };
        } else {
          // Generate fallback chart data using mock service
          console.log(`[COMPANY_DATA] No price history available for ${stockSymbol}, using generated data`);
          const mockData = { 
            ...transformedCompanyData, 
            currentPrice: transformedCompanyData.price 
          };
          chartData = mockDataService.generatePriceChart(mockData);
        }

        setCompanyData(transformedCompanyData);
        setPriceChartData(chartData);
        
      } catch (apiError) {
        console.error(`[COMPANY_DATA] Error getting data for ${stockSymbol}:`, apiError.message);
        // Final fallback to mock data
        const mockData = mockDataService.getCompanyData(stockSymbol);
        setCompanyData(mockData);
        setPriceChartData(mockDataService.generatePriceChart(mockData));
      }
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (symbol) {
      fetchCompanyData(symbol);
    }
  }, [symbol, fetchCompanyData]);

  const refetch = useCallback(() => {
    if (symbol) {
      fetchCompanyData(symbol);
    }
  }, [symbol, fetchCompanyData]);

  return {
    companyData,
    priceChartData,
    loading,
    error,
    refetch
  };
};
