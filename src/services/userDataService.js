class UserDataService {
  constructor() {
    this.storageKeys = {
      searchHistory: 'tadateer_search_history',
      notes: 'tadateer_notes',
      preferences: 'tadateer_preferences'
    };
  }

  // Get user ID for data isolation
  getUserKey(userId, dataType) {
    return `${this.storageKeys[dataType]}_${userId}`;
  }

  // Search History Management
  getSearchHistory(userId) {
    try {
      const history = localStorage.getItem(this.getUserKey(userId, 'searchHistory'));
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  addSearchQuery(userId, query) {
    try {
      const history = this.getSearchHistory(userId);
      const searchEntry = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date().toISOString(),
        type: 'search'
      };

      // Remove duplicate if exists
      const filtered = history.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase()
      );

      // Add to beginning and limit to 50 entries
      const updated = [searchEntry, ...filtered].slice(0, 50);
      
      localStorage.setItem(
        this.getUserKey(userId, 'searchHistory'), 
        JSON.stringify(updated)
      );
      
      return updated;
    } catch (error) {
      console.error('Error saving search query:', error);
      return this.getSearchHistory(userId);
    }
  }

  clearSearchHistory(userId) {
    try {
      localStorage.removeItem(this.getUserKey(userId, 'searchHistory'));
      return [];
    } catch (error) {
      console.error('Error clearing search history:', error);
      return this.getSearchHistory(userId);
    }
  }

  removeSearchQuery(userId, queryId) {
    try {
      const history = this.getSearchHistory(userId);
      const updated = history.filter(item => item.id !== queryId);
      localStorage.setItem(
        this.getUserKey(userId, 'searchHistory'), 
        JSON.stringify(updated)
      );
      return updated;
    } catch (error) {
      console.error('Error removing search query:', error);
      return this.getSearchHistory(userId);
    }
  }

  // Notes Management
  getNotes(userId, companySymbol = null) {
    try {
      const allNotes = localStorage.getItem(this.getUserKey(userId, 'notes'));
      const notes = allNotes ? JSON.parse(allNotes) : [];
      
      if (companySymbol) {
        return notes.filter(note => note.companySymbol === companySymbol);
      }
      
      return notes;
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  saveNote(userId, noteData) {
    try {
      const notes = this.getNotes(userId);
      const note = {
        id: noteData.id || Date.now().toString(),
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        companySymbol: noteData.companySymbol || null,
        companyName: noteData.companyName || null,
        tags: noteData.tags || [],
        createdAt: noteData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: noteData.isPinned || false,
        category: noteData.category || 'general'
      };

      // Update existing note or add new one
      const existingIndex = notes.findIndex(n => n.id === note.id);
      if (existingIndex >= 0) {
        notes[existingIndex] = note;
      } else {
        notes.unshift(note); // Add to beginning
      }

      localStorage.setItem(
        this.getUserKey(userId, 'notes'), 
        JSON.stringify(notes)
      );
      
      return note;
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  deleteNote(userId, noteId) {
    try {
      const notes = this.getNotes(userId);
      const updated = notes.filter(note => note.id !== noteId);
      localStorage.setItem(
        this.getUserKey(userId, 'notes'), 
        JSON.stringify(updated)
      );
      return updated;
    } catch (error) {
      console.error('Error deleting note:', error);
      return this.getNotes(userId);
    }
  }

  updateNote(userId, noteId, updates) {
    try {
      const notes = this.getNotes(userId);
      const noteIndex = notes.findIndex(note => note.id === noteId);
      
      if (noteIndex >= 0) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(
          this.getUserKey(userId, 'notes'), 
          JSON.stringify(notes)
        );
        
        return notes[noteIndex];
      }
      
      throw new Error('Note not found');
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Search notes
  searchNotes(userId, searchTerm, companySymbol = null) {
    try {
      const notes = this.getNotes(userId, companySymbol);
      const term = searchTerm.toLowerCase().trim();
      
      if (!term) return notes;
      
      return notes.filter(note => 
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term) ||
        note.tags.some(tag => tag.toLowerCase().includes(term)) ||
        (note.companyName && note.companyName.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }

  // Get notes by category
  getNotesByCategory(userId, category) {
    try {
      const notes = this.getNotes(userId);
      return notes.filter(note => note.category === category);
    } catch (error) {
      console.error('Error getting notes by category:', error);
      return [];
    }
  }

  // Get pinned notes
  getPinnedNotes(userId) {
    try {
      const notes = this.getNotes(userId);
      return notes.filter(note => note.isPinned);
    } catch (error) {
      console.error('Error getting pinned notes:', error);
      return [];
    }
  }

  // Export user data
  exportUserData(userId) {
    try {
      return {
        searchHistory: this.getSearchHistory(userId),
        notes: this.getNotes(userId),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }

  // Import user data
  importUserData(userId, data) {
    try {
      if (data.searchHistory) {
        localStorage.setItem(
          this.getUserKey(userId, 'searchHistory'), 
          JSON.stringify(data.searchHistory)
        );
      }
      
      if (data.notes) {
        localStorage.setItem(
          this.getUserKey(userId, 'notes'), 
          JSON.stringify(data.notes)
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error importing user data:', error);
      return false;
    }
  }

  // Clear all user data
  clearAllUserData(userId) {
    try {
      Object.keys(this.storageKeys).forEach(key => {
        localStorage.removeItem(this.getUserKey(userId, key));
      });
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }
}

// Create singleton instance
const userDataService = new UserDataService();
export default userDataService;
