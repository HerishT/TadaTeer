class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.listeners = [];
    this.loadUserFromStorage();
  }

  // Load user from localStorage on app start
  loadUserFromStorage() {
    try {
      const userData = localStorage.getItem('tadateer_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.isAuthenticated = true;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.logout();
    }
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback({
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser
    });
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        isAuthenticated: this.isAuthenticated,
        user: this.currentUser
      });
    });
  }

  // Simulate login (in real app, this would integrate with actual auth provider)
  async login(email, password) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any email/password combination
      if (email && password) {
        const user = {
          id: Date.now().toString(),
          email: email,
          name: email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date().toISOString(),
          preferences: {
            theme: 'dark',
            notifications: true
          }
        };

        this.currentUser = user;
        this.isAuthenticated = true;
        localStorage.setItem('tadateer_user', JSON.stringify(user));
        this.notifyListeners();
        return { success: true, user };
      } else {
        throw new Error('Email and password are required');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Register new user
  async register(email, password, name) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password && name) {
        const user = {
          id: Date.now().toString(),
          email: email,
          name: name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          createdAt: new Date().toISOString(),
          preferences: {
            theme: 'dark',
            notifications: true
          }
        };

        this.currentUser = user;
        this.isAuthenticated = true;
        localStorage.setItem('tadateer_user', JSON.stringify(user));
        this.notifyListeners();
        return { success: true, user };
      } else {
        throw new Error('All fields are required');
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Google Sign-In (placeholder for future implementation)
  async signInWithGoogle() {
    try {
      // This would integrate with Google OAuth in a real implementation
      const email = 'demo@google.com';
      const user = {
        id: Date.now().toString(),
        email: email,
        name: 'Demo User',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        provider: 'google',
        createdAt: new Date().toISOString(),
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };

      this.currentUser = user;
      this.isAuthenticated = true;
      localStorage.setItem('tadateer_user', JSON.stringify(user));
      this.notifyListeners();
      return { success: true, user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout
  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('tadateer_user');
    localStorage.removeItem('tadateer_search_history');
    localStorage.removeItem('tadateer_notes');
    this.notifyListeners();
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      this.currentUser = { ...this.currentUser, ...updates };
      localStorage.setItem('tadateer_user', JSON.stringify(this.currentUser));
      this.notifyListeners();
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
