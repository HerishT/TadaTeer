import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

const NotesTab = ({ companyData }) => {
  const { user, isAuthenticated } = useAuth();
  const { 
    notes, 
    saveNote, 
    deleteNote, 
    searchNotes, 
    getNotesByCompany 
  } = useUserData(user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    tags: [],
    category: 'general',
    isPinned: false
  });

  // Get notes for current company
  const companyNotes = companyData 
    ? getNotesByCompany(companyData.symbol)
    : notes;

  // Filtered notes based on search
  const filteredNotes = searchTerm.trim() 
    ? searchNotes(searchTerm, companyData?.symbol)
    : companyNotes;

  const resetForm = () => {
    setNoteForm({
      title: '',
      content: '',
      tags: [],
      category: 'general',
      isPinned: false
    });
    setEditingNote(null);
  };

  const handleNewNote = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleEditNote = (note) => {
    setNoteForm({
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      category: note.category || 'general',
      isPinned: note.isPinned || false
    });
    setEditingNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    if (!noteForm.title.trim() && !noteForm.content.trim()) return;

    try {
      const noteData = {
        ...noteForm,
        id: editingNote?.id,
        companySymbol: companyData?.symbol,
        companyName: companyData?.name,
        title: noteForm.title.trim() || 'Untitled Note'
      };

      await saveNote(noteData);
      setIsEditing(false);
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
      if (editingNote?.id === noteId) {
        setIsEditing(false);
        resetForm();
      }
    }
  };

  const handleTagAdd = (tag) => {
    if (tag.trim() && !noteForm.tags.includes(tag.trim())) {
      setNoteForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setNoteForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-white mb-2">Sign In Required</h4>
        <p className="text-gray-400 text-sm text-center">Please sign in to save and view your notes.</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {editingNote ? 'Edit Note' : 'New Note'}
          </h3>
          <button
            onClick={() => {
              setIsEditing(false);
              resetForm();
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 flex-1">
          <input
            type="text"
            placeholder="Note title..."
            value={noteForm.title}
            onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-medium"
          />

          <textarea
            placeholder="Write your note here..."
            value={noteForm.content}
            onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
            className="w-full h-32 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {noteForm.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full text-xs flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="ml-1 text-teal-300 hover:text-teal-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tag and press Enter..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTagAdd(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <select
              value={noteForm.category}
              onChange={(e) => setNoteForm(prev => ({ ...prev, category: e.target.value }))}
              className="bg-gray-800/50 border border-gray-600 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="general">General</option>
              <option value="analysis">Analysis</option>
              <option value="research">Research</option>
              <option value="ideas">Ideas</option>
            </select>

            <label className="flex items-center text-sm text-gray-300">
              <input
                type="checkbox"
                checked={noteForm.isPinned}
                onChange={(e) => setNoteForm(prev => ({ ...prev, isPinned: e.target.checked }))}
                className="mr-2 text-teal-500 focus:ring-teal-500"
              />
              Pin note
            </label>
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-gray-700/50">
          <button
            onClick={handleSaveNote}
            className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-teal-600 hover:to-blue-700 transition-all"
          >
            Save Note
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              resetForm();
            }}
            className="bg-gray-700 text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {companyData ? `${companyData.symbol} Notes` : 'My Notes'}
        </h3>
        <button
          onClick={handleNewNote}
          className="bg-gradient-to-r from-teal-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-teal-600 hover:to-blue-700 transition-all text-sm"
        >
          + New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
        />
        <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-800/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-md font-medium text-white mb-1">No Notes Yet</h4>
            <p className="text-gray-400 text-sm">
              {searchTerm ? 'No notes match your search.' : 'Start taking notes to organize your research.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium flex items-center flex-1">
                    {note.isPinned && (
                      <svg className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                      </svg>
                    )}
                    <span className="truncate">{note.title}</span>
                  </h4>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNote(note);
                      }}
                      className="text-gray-400 hover:text-teal-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                  {note.content || 'No content'}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {formatDate(note.updatedAt || note.createdAt)}
                  </span>
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                    {note.category}
                  </span>
                </div>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-gray-400 text-xs">+{note.tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesTab;
