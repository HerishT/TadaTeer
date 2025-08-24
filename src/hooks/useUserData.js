import { useState, useEffect } from 'react';
import userDataService from '../services/userDataService';

export const useUserData = (userId) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
    } else {
      setSearchHistory([]);
      setNotes([]);
      setIsLoading(false);
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const [history, userNotes] = await Promise.all([
        userDataService.getSearchHistory(userId),
        userDataService.getNotes(userId)
      ]);
      setSearchHistory(history);
      setNotes(userNotes);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search History Functions
  const addSearchQuery = (query) => {
    if (userId && query.trim()) {
      const updated = userDataService.addSearchQuery(userId, query);
      setSearchHistory(updated);
    }
  };

  const removeSearchQuery = (queryId) => {
    if (userId) {
      const updated = userDataService.removeSearchQuery(userId, queryId);
      setSearchHistory(updated);
    }
  };

  const clearSearchHistory = () => {
    if (userId) {
      const updated = userDataService.clearSearchHistory(userId);
      setSearchHistory(updated);
    }
  };

  // Notes Functions
  const saveNote = async (noteData) => {
    if (!userId) return null;
    
    try {
      const savedNote = userDataService.saveNote(userId, noteData);
      const updatedNotes = userDataService.getNotes(userId);
      setNotes(updatedNotes);
      return savedNote;
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  };

  const deleteNote = (noteId) => {
    if (userId) {
      const updated = userDataService.deleteNote(userId, noteId);
      setNotes(updated);
    }
  };

  const updateNote = async (noteId, updates) => {
    if (!userId) return null;
    
    try {
      const updatedNote = userDataService.updateNote(userId, noteId, updates);
      const updatedNotes = userDataService.getNotes(userId);
      setNotes(updatedNotes);
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const searchNotes = (searchTerm, companySymbol = null) => {
    if (!userId) return [];
    return userDataService.searchNotes(userId, searchTerm, companySymbol);
  };

  const getNotesByCompany = (companySymbol) => {
    if (!userId) return [];
    return userDataService.getNotes(userId, companySymbol);
  };

  const getPinnedNotes = () => {
    if (!userId) return [];
    return userDataService.getPinnedNotes(userId);
  };

  const getNotesByCategory = (category) => {
    if (!userId) return [];
    return userDataService.getNotesByCategory(userId, category);
  };

  return {
    searchHistory,
    notes,
    isLoading,
    // Search history methods
    addSearchQuery,
    removeSearchQuery,
    clearSearchHistory,
    // Notes methods
    saveNote,
    deleteNote,
    updateNote,
    searchNotes,
    getNotesByCompany,
    getPinnedNotes,
    getNotesByCategory,
    // Utility
    loadUserData
  };
};
