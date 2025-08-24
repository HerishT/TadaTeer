import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import ParticleCanvas from './components/ParticleCanvas';
import SmartSearchPage from './components/SmartSearchPage';
import DashboardPage from './components/DashboardPage';
import Navigation from './components/Navigation';
import MarketPage from './components/MarketPage';
import TopStocksPage from './components/TopStocksPage';
import SectorsPage from './components/SectorsPage';
import MarketDepthPage from './components/MarketDepthPage';
import AuthModal from './components/AuthModal';
import UserAccountPanel from './components/UserAccountPanel';
import { useAuth } from './hooks/useAuth';
import marketDataCache from './services/marketDataCache';

// Simple mock for chart pre-generation to stop the errors  
const chartPreGeneration = {
  getProgress: () => {
    const stats = marketDataCache.getStats();
    return { 
      isGenerating: !stats.isInitialized, 
      isComplete: stats.isInitialized, 
      chartCount: stats.totalCompanies 
    };
  },
  initializeCharts: () => Promise.resolve(),
  getChartData: (symbol) => marketDataCache.getChartData(symbol, '1M'),
  hasChartData: (symbol) => marketDataCache.hasChartData(symbol)
};

// Loading indicator component
function ChartGenerationIndicator() {
  const [progress, setProgress] = useState({ isGenerating: false, chartCount: 0 });

  useEffect(() => {
    const checkProgress = () => {
      const currentProgress = chartPreGeneration.getProgress();
      setProgress(currentProgress);
      
      if (!currentProgress.isComplete && currentProgress.isGenerating) {
        setTimeout(checkProgress, 2000); // Check every 2 seconds
      }
    };
    
    checkProgress();
  }, []);

  if (!progress.isGenerating) return null;

  return (
    <div className="fixed top-4 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 z-50">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-400 border-t-transparent"></div>
        <div className="text-sm text-gray-200">
          <div className="font-medium">Generating Charts...</div>
          <div className="text-xs text-gray-400">{progress.chartCount} companies processed</div>
        </div>
      </div>
    </div>
  );
}

// Component to handle the dashboard route with symbol parameter
function DashboardRoute() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  const handleBackToSearch = () => {
    navigate('/');
  };

  return (
    <DashboardPage 
      companySymbol={symbol} 
      onBack={handleBackToSearch} 
    />
  );
}

// Component to handle the search page
function SearchRoute() {
  const navigate = useNavigate();

  const handleSearch = (symbol) => {
    navigate(`/company/${symbol}`);
  };

  return <SmartSearchPage onSearch={handleSearch} />;
}

// Main app component
function AppContent() {
  const location = window.location;
  const isSearch = location.pathname === '/';
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleAuthClick = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="text-gray-200 bg-[#0a0a0a] min-h-screen">
      <ParticleCanvas view={isSearch ? 'search' : 'dashboard'} />
      <ChartGenerationIndicator />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Auth/Account Button */}
      <div className="fixed top-6 right-4 z-50">
        {isAuthenticated ? (
          <button
            onClick={() => setShowAccountPanel(true)}
            className="flex items-center space-x-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-full py-2 px-4 hover:bg-gray-800/80 transition-all shadow-lg"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-white font-medium hidden sm:block">{user.name}</span>
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={() => handleAuthClick('login')}
              className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 text-white px-4 py-2 rounded-lg hover:bg-gray-800/80 transition-all shadow-lg"
            >
              Sign In
            </button>
            <button
              onClick={() => handleAuthClick('register')}
              className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all shadow-lg"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<SearchRoute />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/top-stocks" element={<TopStocksPage />} />
          <Route path="/sectors" element={<SectorsPage />} />
          <Route path="/market-depth" element={<MarketDepthPage />} />
          <Route path="/company/:symbol" element={<DashboardRoute />} />
        </Routes>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      
      <UserAccountPanel 
        isOpen={showAccountPanel} 
        onClose={() => setShowAccountPanel(false)}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize chart pre-generation when app starts
    console.log('🚀 TadaTeer app starting - initializing services...');
    
    // Make services globally available
    window.chartPreGeneration = chartPreGeneration;
    window.marketDataCache = marketDataCache;
    
    // Initialize market data cache first
    marketDataCache.initialize().then(() => {
      console.log('✅ Market data cache initialized');
      
      // Then start chart generation (will use localStorage cache if available)
      chartPreGeneration.initializeCharts();
    });
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
