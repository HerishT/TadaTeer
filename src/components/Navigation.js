import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    {
      name: 'Search',
      path: '/',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      name: 'Market',
      path: '/market',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Top Stocks',
      path: '/top-stocks',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      name: 'Sectors',
      path: '/sectors',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      name: 'Market Depth',
      path: '/market-depth',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
      <div className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="text-lg font-bold text-white/80 hover:text-white transition-colors mr-3 border-r border-white/20 pr-3"
            >
              TadaTeer
            </button>

            {/* Navigation Items */}
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                  location.pathname === item.path
            ? 'bg-teal-600/80 text-white'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="h-4 w-4">{item.icon}</div>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
      <div className="rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Mobile Header */}
          <div className="px-3 py-2 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="text-base font-bold text-white/80 hover:text-white transition-colors"
            >
              TadaTeer
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="border-t border-white/20 px-2 py-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all mb-1 ${
                    location.pathname === item.path
                      ? 'bg-teal-600/80 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
