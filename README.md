# TadaTeer 📈

A comprehensive financial dashboard for the Nepal Stock Exchange (NEPSE) built with React. TadaTeer provides real-time market data, advanced analytics, AI-powered insights, and interactive visualizations for Nepalese stocks.

![TadaTeer Dashboard](https://img.shields.io/badge/Version-0.1.0-blue) ![React](https://img.shields.io/badge/React-18.2.0-61dafb) ![Chart.js](https://img.shields.io/badge/Chart.js-4.4.0-ff6384)

## ✨ Features

### 🎯 Core Dashboard
- **Company Analysis**: Detailed financial metrics, ratios, and performance indicators
- **Interactive Charts**: Real-time price charts with multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y)
- **Market Overview**: NEPSE index tracking, sector performance, and market trends
- **Peer Comparison**: Side-by-side analysis of companies within the same sector

### 🤖 AI-Powered Insights
- **ML Forecast**: Machine learning predictions for stock price movements
- **Smart Chatbot**: AI assistant for investment queries and market analysis
- **Gemini Integration**: Advanced AI insights powered by Google's Gemini API
- **Sentiment Analysis**: Market sentiment tracking and analysis

### 📊 Advanced Analytics
- **Financial Statements**: Income statement, balance sheet, and cash flow analysis
- **Technical Indicators**: RSI, MACD, moving averages, and more
- **Risk Assessment**: Volatility analysis and risk metrics
- **Portfolio Tracking**: Personal portfolio management and performance tracking

### 🔍 Market Intelligence
- **Smart Search**: Intelligent company and stock search with filters
- **Sector Analysis**: Comprehensive sector-wise market breakdown
- **Top Performers**: Real-time tracking of gainers, losers, and volume leaders
- **Market Depth**: Detailed market microstructure analysis

### 📱 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Modern glassmorphism UI with particle effects
- **Real-time Updates**: Live market data with automatic refresh
- **Offline Support**: Cached data for offline viewing

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tadateer.git
   cd tadateer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
   REACT_APP_NEPSE_API_BASE_URL=https://api.nepse.com.np
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📂 Project Structure

```
TadaTeer/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── DashboardPage.js       # Main company dashboard
│   │   ├── MarketPage.js          # Market overview
│   │   ├── MarketDepthPage.js     # Detailed market analysis
│   │   ├── SmartSearchPage.js     # Intelligent search
│   │   ├── ChatbotCard.js         # AI chatbot interface
│   │   ├── ForecastCard.js        # ML predictions
│   │   └── ...
│   ├── services/           # API and data services
│   │   ├── marketDataCache.js     # Data caching layer
│   │   ├── mlForecastService.js   # ML predictions
│   │   ├── geminiService.js       # AI integration
│   │   ├── nepseApiService.js     # NEPSE API client
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── ...
├── backend/                # Backend services (if applicable)
├── nepsealpha_export_price_2025-08-24.csv  # Historical data
├── package.json
└── README.md
```

## 🔧 Configuration

### API Integration
TadaTeer supports multiple data sources:

1. **NEPSE Official API**: Real-time market data
2. **CSV Data Import**: Historical price data backup
3. **Gemini AI**: For intelligent insights and predictions

## 📈 Key Components

### Dashboard Features
- **Real-time Price Tracking**: Live price updates with WebSocket connections
- **Financial Ratios**: P/E, P/B, ROE, ROA, and more
- **Chart Overlays**: Support for technical indicators and drawing tools
- **News Integration**: Latest market news and company updates

### Market Analysis Tools
- **Sector Heatmaps**: Visual representation of sector performance
- **Correlation Analysis**: Inter-stock relationship mapping
- **Volume Analysis**: Trading volume patterns and trends
- **Market Breadth**: Advance/decline ratios and market health metrics

### AI & ML Features
- **Price Prediction**: Short and long-term price forecasts
- **Pattern Recognition**: Technical pattern identification
- **Anomaly Detection**: Unusual market behavior alerts
- **Natural Language Queries**: Ask questions about stocks in plain English

## 🎨 UI/UX Design

### Design Philosophy
- **Glassmorphism**: Modern translucent design with backdrop filters
- **Dark Theme**: Eye-friendly interface for extended use
- **Responsive Layout**: Seamless experience across all devices
- **Accessibility**: WCAG 2.1 compliant design

### Color Scheme
- **Primary**: Teal (#14b8a6) - For positive values and highlights
- **Secondary**: Purple (#8b5cf6) - For AI and advanced features
- **Success**: Green (#22c55e) - For gains and positive metrics
- **Danger**: Red (#ef4444) - For losses and negative metrics
- **Background**: Dark gradient with particle effects

## 🔒 Security & Performance

### Security Features
- **API Key Protection**: Environment variable-based configuration
- **Rate Limiting**: Built-in API call throttling
- **Data Validation**: Input sanitization and validation
- **Secure Headers**: CSP and security headers implementation

### Performance Optimizations
- **Lazy Loading**: Component-based code splitting
- **Data Caching**: Intelligent caching with TTL
- **Image Optimization**: Compressed and optimized assets
- **Bundle Optimization**: Tree shaking and minification

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm run build
   # Upload build/ folder to Netlify
   ```

3. **Traditional Hosting**
   ```bash
   npm run build
   # Upload build/ folder to your web server
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- ESLint configuration included
- Prettier for code formatting
- Conventional commit messages
- Component-based architecture

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NEPSE**: For providing market data and APIs
- **Google Gemini**: For AI-powered insights
- **Chart.js**: For beautiful and responsive charts
- **React Community**: For the amazing ecosystem

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-username/tadateer/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/tadateer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/tadateer/discussions)
- **Email**: support@tadateer.com

## 🗺️ Roadmap

### Upcoming Features
- [ ] **Mobile App**: React Native mobile application
- [ ] **Real-time Alerts**: Push notifications for price movements
- [ ] **Social Trading**: Community features and social trading
- [ ] **Advanced Charting**: Professional-grade charting tools
- [ ] **API Access**: Public API for third-party integrations
- [ ] **Multi-language**: Support for Nepali language interface

### Future Enhancements
- [ ] **Options Trading**: Support for derivatives and options
- [ ] **Mutual Funds**: Analysis of mutual fund performance
- [ ] **Bond Market**: Government and corporate bond tracking
- [ ] **International Markets**: Global market integration
- [ ] **Crypto Integration**: Cryptocurrency market data

---

**Made with ❤️ for the Nepalese Investment Community**

*TadaTeer - Your gateway to smart investing in Nepal* 🇳🇵

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatbotCard.js   # AI chat interface
│   ├── DashboardPage.js # Main dashboard
│   ├── SearchPage.js    # Company search page
│   ├── ParticleCanvas.js # Background animation
│   └── Modal.js         # Modal dialogs
├── hooks/               # Custom React hooks
│   └── useChat.js       # Chat functionality
├── services/            # External services
│   └── geminiService.js # Gemini AI integration
├── utils/               # Utility functions
│   └── mockData.js      # Mock financial data
├── App.js               # Main app component
├── index.js             # Entry point
└── index.css            # Global styles
```

## Usage

1. **Search for a Company**: Enter a company name (e.g., "Nabil Bank", "NTC") on the search page
2. **Explore Dashboard**: View comprehensive financial data, charts, and AI insights
3. **Chat with AI**: Ask questions like:
   - "What was the net profit growth this quarter?"
   - "Compare revenue with similar companies"
   - "What are the key risks for this investment?"
   - "Analyze the financial ratios"

## Technologies Used

- **React**: Frontend framework
- **Chart.js**: Interactive charts
- **Tailwind CSS**: Styling
- **Google Gemini AI**: Natural language processing
- **Canvas API**: Particle background animation

## Roadmap

This is the frontend foundation. The backend will include:
- Real-time NEPSE data integration
- PDF document parsing (OCR)
- Sentiment analysis from news and reports
- Advanced financial forecasting models
- Vector database for semantic search
- Real market data APIs

## Contributing

This project is in active development. Backend integration and real data sources are coming soon.

## License

Private project - All rights reserved.
