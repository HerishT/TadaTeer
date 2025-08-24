import { useState, useEffect } from 'react';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authState) => {
      setUser(authState.user);
      setIsAuthenticated(authState.isAuthenticated);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    const result = await authService.login(email, password);
    setIsLoading(false);
    return result;
  };

  const register = async (email, password, name) => {
    setIsLoading(true);
    const result = await authService.register(email, password, name);
    setIsLoading(false);
    return result;
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const result = await authService.signInWithGoogle();
    setIsLoading(false);
    return result;
  };

  const logout = () => {
    authService.logout();
  };

  const updateProfile = async (updates) => {
    setIsLoading(true);
    const result = await authService.updateProfile(updates);
    setIsLoading(false);
    return result;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    signInWithGoogle,
    logout,
    updateProfile
  };
};
