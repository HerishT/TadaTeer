import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('Initializing GeminiService...');
    console.log('API Key length:', this.apiKey ? this.apiKey.length : 0);
    console.log('API Key first 10 chars:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'undefined');
    
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your environment variables.');
    }
    
    try {
      this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
      this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;
      console.log('Model initialized successfully:', !!this.model);
    } catch (error) {
      console.error('Error initializing Gemini AI:', error);
      this.genAI = null;
      this.model = null;
    }
  }

  async sendMessage(message, companyContext = null) {
    console.log('GeminiService.sendMessage called with:', message);
    console.log('API Key present:', !!this.apiKey);
    console.log('Model initialized:', !!this.model);
    
    if (!this.model) {
      console.log('No model available, returning error');
      return {
        success: false,
        message: "Gemini AI is not configured. Please add your API key to the environment variables."
      };
    }

    try {
      // Generate comprehensive financial context
      const financialContext = this.generateFinancialContext(companyContext);
      
      const systemPrompt = `You are TadaTeer AI, an expert financial analyst specializing in Nepal Stock Exchange (NEPSE) companies.

${financialContext}

IMPORTANT GUIDELINES:
- Always mention this is mock/simulated data for demonstration
- Provide detailed financial analysis using the data above
- Include specific numbers and percentages from the context
- Compare trends across years when relevant
- Highlight key financial health indicators
- Always end with "This analysis is based on simulated data and should not be considered as financial advice"

User Question: ${message}

Provide a comprehensive financial analysis response:`;

      console.log('Sending enhanced prompt to Gemini API...');
      console.log('Prompt length:', systemPrompt.length);
      
      const result = await this.model.generateContent(systemPrompt);
      console.log('Raw result from API:', result);
      
      const response = await result.response;
      console.log('Response object:', response);
      
      const text = response.text();
      console.log('Gemini API responded successfully, text length:', text.length);

      return {
        success: true,
        message: text
      };
    } catch (error) {
      console.error('Detailed error calling Gemini API:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = "Sorry, I'm having trouble connecting to the AI service. Please try again in a moment.";
      
      if (error.message && error.message.includes('API_KEY')) {
        errorMessage = "API key issue detected. Please check your Gemini API key configuration.";
      } else if (error.message && error.message.includes('quota')) {
        errorMessage = "API quota exceeded. Please try again later.";
      } else if (error.message && error.message.includes('blocked')) {
        errorMessage = "Content was blocked. Please try rephrasing your question.";
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  generateFinancialContext(companyData) {
    if (!companyData) {
      return "COMPANY CONTEXT: General NEPSE market analysis requested.";
    }

    // Generate mock financial data similar to what's shown in dashboard
    const currentPrice = companyData.currentPrice || companyData.price || 500;
    const changePercent = companyData.changePercent || companyData.change || 0;
    const symbol = companyData.symbol || 'STOCK';
    const name = companyData.name || `${symbol} Limited`;
    const sector = companyData.sector || 'Financial Services';

    // Generate consistent mock financial data
    const baseRevenue = 500000000 + Math.random() * 2000000000;
    const years = ['2021', '2022', '2023', '2024'];
    
    // Financial data generation (same logic as dashboard)
    const revenue = years.map((_, i) => Math.round(baseRevenue * (1 + (i * 0.1) + (Math.random() - 0.5) * 0.2)));
    const netProfit = years.map((_, i) => Math.round(baseRevenue * 0.15 * (1 + (i * 0.08) + (Math.random() - 0.5) * 0.3)));
    const totalAssets = years.map((_, i) => Math.round(baseRevenue * 2 * (1 + i * 0.12)));
    const totalLiabilities = years.map((_, i) => Math.round(baseRevenue * 1.2 * (1 + i * 0.1)));
    const operatingCashFlow = years.map((_, i) => Math.round(baseRevenue * 0.2 * (1 + i * 0.1 + (Math.random() - 0.5) * 0.3)));

    // AI Insights
    const insights = {
      forecast: {
        targetPrice: Math.round(currentPrice * (1 + (0.05 + Math.random() * 0.15))),
        confidence: Math.round(65 + Math.random() * 25),
        trend: changePercent > 2 ? 'Strong Bullish' : changePercent > 0 ? 'Bullish' : changePercent < -2 ? 'Bearish' : 'Neutral'
      },
      valuation: {
        peRatio: (15 + Math.random() * 20).toFixed(1),
        pbRatio: (1.2 + Math.random() * 2.5).toFixed(1),
        rating: Math.random() > 0.6 ? 'Undervalued' : Math.random() > 0.3 ? 'Fair Value' : 'Overvalued'
      },
      risk: {
        volatility: (15 + Math.random() * 25).toFixed(1),
        beta: (0.8 + Math.random() * 0.8).toFixed(2),
        riskLevel: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low'
      },
      sentiment: {
        score: Math.round(40 + Math.random() * 40),
        mood: Math.random() > 0.6 ? 'Positive' : Math.random() > 0.3 ? 'Neutral' : 'Negative'
      }
    };

    return `COMPREHENSIVE COMPANY ANALYSIS:

COMPANY OVERVIEW:
- Name: ${name}
- Symbol: ${symbol}
- Sector: ${sector}
- Current Stock Price: रु ${currentPrice}
- Price Change: ${changePercent > 0 ? '+' : ''}${changePercent}%

FINANCIAL PERFORMANCE (4-Year Analysis):
Revenue Trend:
- 2021: रु ${(revenue[0] / 1000000).toFixed(0)}M
- 2022: रु ${(revenue[1] / 1000000).toFixed(0)}M
- 2023: रु ${(revenue[2] / 1000000).toFixed(0)}M
- 2024: रु ${(revenue[3] / 1000000).toFixed(0)}M
- Revenue Growth Rate: ${(((revenue[3] - revenue[0]) / revenue[0]) * 100 / 3).toFixed(1)}% annually

Net Profit Analysis:
- 2021: रु ${(netProfit[0] / 1000000).toFixed(0)}M
- 2022: रु ${(netProfit[1] / 1000000).toFixed(0)}M
- 2023: रु ${(netProfit[2] / 1000000).toFixed(0)}M
- 2024: रु ${(netProfit[3] / 1000000).toFixed(0)}M
- Profit Margin 2024: ${((netProfit[3] / revenue[3]) * 100).toFixed(1)}%

Balance Sheet Strength:
- Total Assets 2024: रु ${(totalAssets[3] / 1000000).toFixed(0)}M
- Total Liabilities 2024: रु ${(totalLiabilities[3] / 1000000).toFixed(0)}M
- Shareholders Equity 2024: रु ${((totalAssets[3] - totalLiabilities[3]) / 1000000).toFixed(0)}M
- Debt-to-Equity Ratio: ${(totalLiabilities[3] / (totalAssets[3] - totalLiabilities[3])).toFixed(2)}

Cash Flow Performance:
- Operating Cash Flow 2024: रु ${(operatingCashFlow[3] / 1000000).toFixed(0)}M
- Cash Flow Trend: ${operatingCashFlow[3] > operatingCashFlow[0] ? 'Improving' : 'Declining'}

AI-POWERED INSIGHTS:
Price Forecast:
- Target Price: रु ${insights.forecast.targetPrice}
- Confidence Level: ${insights.forecast.confidence}%
- Market Trend: ${insights.forecast.trend}

Valuation Metrics:
- P/E Ratio: ${insights.valuation.peRatio}
- P/B Ratio: ${insights.valuation.pbRatio}
- Valuation Rating: ${insights.valuation.rating}

Risk Assessment:
- Volatility: ${insights.risk.volatility}%
- Beta Coefficient: ${insights.risk.beta}
- Risk Classification: ${insights.risk.riskLevel}

Market Sentiment:
- Sentiment Score: ${insights.sentiment.score}/100
- Overall Mood: ${insights.sentiment.mood}

TECHNICAL INDICATORS:
- Recent Price Movement: ${changePercent > 0 ? 'Upward momentum' : changePercent < 0 ? 'Downward pressure' : 'Sideways movement'}
- Volume Trend: ${Math.random() > 0.5 ? 'Above average' : 'Below average'}
- Support Level: रु ${Math.round(currentPrice * 0.95)}
- Resistance Level: रु ${Math.round(currentPrice * 1.05)}`;
  }

  async testConnection() {
    console.log('Testing Gemini API connection...');
    if (!this.model) {
      return { success: false, message: 'Model not initialized' };
    }
    
    try {
      const result = await this.model.generateContent('Hello, please respond with "API connection successful"');
      const response = await result.response;
      const text = response.text();
      console.log('Test response:', text);
      return { success: true, message: text };
    } catch (error) {
      console.error('Test connection failed:', error);
      return { success: false, message: error.message };
    }
  }

  async analyzeCompany(companyData) {
    const analysisPrompt = `Analyze this NEPSE company data and provide key insights:

Company: ${companyData.name} (${companyData.symbol})
Sector: ${companyData.sector}
Current Price: रु ${companyData.price}
Price Change: ${companyData.change > 0 ? '+' : ''}${companyData.change} (${companyData.changePercent}%)

Please provide:
1. Brief company overview
2. Current market position
3. Key strengths and risks
4. Investment outlook (bullish/bearish/neutral)

Keep the response concise and focused on actionable insights.`;

    return await this.sendMessage(analysisPrompt, companyData);
  }
}

const geminiService = new GeminiService();
export default geminiService;
