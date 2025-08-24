/**
 * ML Forecast Service
 * Handles communication with the Python ML model server
 */

const ML_SERVER_URL = 'http://localhost:5001';

class MLForecastService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // Extended to 30 minutes due to compute cost
  }

  async checkHealth() {
    try {
      const response = await fetch(`${ML_SERVER_URL}/health`);
      return await response.json();
    } catch (error) {
      console.warn('ML server health check failed:', error);
      return { status: 'unavailable', model_loaded: false };
    }
  }

  async getBasicForecast(symbol) {
    const cacheKey = `basic_${symbol}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${ML_SERVER_URL}/forecast/${symbol}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.warn(`ML forecast failed for ${symbol}:`, error);
      // Return mock data as fallback
      return this.getMockForecast(symbol);
    }
  }

  async getEnhancedForecast(symbol) {
    const cacheKey = `enhanced_${symbol}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${ML_SERVER_URL}/forecast/enhanced/${symbol}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.warn(`Enhanced ML forecast failed for ${symbol}:`, error);
      // Return mock data as fallback
      return this.getMockEnhancedForecast(symbol);
    }
  }

  getMockForecast(symbol) {
    // Generate consistent mock data based on symbol
    const hash = this.hashString(symbol);
    const probability = 0.3 + (hash % 1000) / 2500; // 0.3 to 0.7
    const direction = probability > 0.5 ? 'UP' : 'DOWN';
    const confidence = Math.abs(probability - 0.5) * 180 + 20; // 20-110, capped at 95
    
    return {
      direction,
      confidence: Math.min(Math.round(confidence), 95),
      probability: Math.round(probability * 1000) / 1000,
      signal_strength: confidence > 70 ? 'Strong' : confidence > 50 ? 'Moderate' : 'Weak',
      source: 'mock'
    };
  }

  getMockEnhancedForecast(symbol) {
    const basic = this.getMockForecast(symbol);
    const hash = this.hashString(symbol);
    
    return {
      ...basic,
      technical_indicators: {
        rsi: 30 + (hash % 400) / 10, // 30-70
        sma_signal: basic.direction === 'UP' ? 'Bullish' : 'Bearish',
        volume_trend: ['Increasing', 'Decreasing', 'Stable'][hash % 3]
      },
      risk_level: basic.direction === 'UP' 
        ? (basic.confidence > 70 ? 'Low' : 'Medium')
        : (basic.confidence > 70 ? 'High' : 'Medium'),
      recommendation: basic.confidence > 60 
        ? (basic.direction === 'UP' ? 'BUY' : 'SELL')
        : 'HOLD',
      timeframe: '1-3 days',
      last_updated: new Date().toISOString().split('T')[0],
      source: 'mock'
    };
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  clearCache() {
    this.cache.clear();
  }

  // Method to generate Gemini explanation prompt
  getExplanationPrompt(symbol, forecastData) {
    return `You are a financial AI assistant. Explain why a stock prediction shows "${forecastData.direction}" for ${symbol} with ${forecastData.confidence}% confidence.

Stock: ${symbol}
Prediction: ${forecastData.direction}
Confidence: ${forecastData.confidence}%
Signal Strength: ${forecastData.signal_strength}
${forecastData.technical_indicators ? `
Technical Indicators:
- RSI: ${forecastData.technical_indicators.rsi}
- SMA Signal: ${forecastData.technical_indicators.sma_signal}
- Volume Trend: ${forecastData.technical_indicators.volume_trend}
` : ''}
${forecastData.recommendation ? `Recommendation: ${forecastData.recommendation}` : ''}

Please provide a concise explanation (2-3 sentences) of why this prediction was made, focusing on the technical factors that influenced the decision. Keep it professional and mention this is AI-generated analysis, not financial advice.`;
  }
}

export default new MLForecastService();
