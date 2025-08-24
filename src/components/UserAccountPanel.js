import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

const UserAccountPanel = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const { 
    searchHistory, 
    clearSearchHistory, 
    removeSearchQuery,
    notes 
  } = useUserData(user?.id);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  if (!isOpen || !user) return null;

  const handleProfileUpdate = async () => {
    try {
      const result = await updateProfile(profileForm);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleExportData = () => {
    const userData = {
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      searchHistory,
      notes,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tadateer-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}>
  <div className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" style={{ backgroundColor: 'rgba(10,10,10,0.18)', backdropFilter: 'blur(36px)', border: '1px solid rgba(80,80,80,0.18)' }}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full bg-gray-700"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-6">
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'history', label: 'Search History', icon: '🔍' },
              { id: 'notes', label: 'Notes', icon: '📝' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-gray-800/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-teal-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 transition-all"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Name</label>
                      <p className="text-white text-lg">{user.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Email</label>
                      <p className="text-white text-lg">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Member Since</label>
                      <p className="text-white text-lg">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm font-medium">Total Notes</h4>
                  <p className="text-2xl font-bold text-white">{notes.length}</p>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm font-medium">Search Queries</h4>
                  <p className="text-2xl font-bold text-white">{searchHistory.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Search History</h3>
                {searchHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all search history?')) {
                        clearSearchHistory();
                      }
                    }}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {searchHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">No Search History</h4>
                  <p className="text-gray-400 text-sm">Your search queries will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-800/50 transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.query}</p>
                        <p className="text-gray-400 text-sm">{formatDate(item.timestamp)}</p>
                      </div>
                      <button
                        onClick={() => removeSearchQuery(item.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors ml-4"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Notes Summary</h3>
              
              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">No Notes Yet</h4>
                  <p className="text-gray-400 text-sm">Start taking notes on company dashboards.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notes.slice(0, 10).map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4"
                    >
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        {note.isPinned && (
                          <svg className="h-4 w-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                          </svg>
                        )}
                        {note.title}
                      </h4>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                        {note.content || 'No content'}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{formatDate(note.updatedAt || note.createdAt)}</span>
                        {note.companySymbol && (
                          <span className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">
                            {note.companySymbol}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {notes.length > 10 && (
                <p className="text-gray-400 text-center">
                  And {notes.length - 10} more notes...
                </p>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleExportData}
                    className="w-full bg-gray-700 text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-all flex items-center justify-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export My Data
                  </button>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-red-400 font-medium mb-2">Danger Zone</h4>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to sign out? This will clear all local data.')) {
                          logout();
                          onClose();
                        }
                      }}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAccountPanel;
