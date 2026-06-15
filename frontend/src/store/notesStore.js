import { create } from 'zustand';

// Debounce timer variable
let saveTimeout = null;

export const useNotesStore = create((set, get) => ({
  tree: [],
  activeNoteId: null,
  activeNote: null,
  distractionFree: false,
  searchQuery: '',
  searchResults: [],
  favorites: [],
  recents: [],
  tags: [],
  syncStatus: 'SAVED', // 'SAVED', 'SYNCING', 'ERROR'
  isSidebarOpen: true,
  audioEnabled: true,
  
  // Setters
  setDistractionFree: (df) => set({ distractionFree: df }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Actions
  fetchTree: async () => {
    try {
      const res = await fetch('/api/tree');
      if (!res.ok) throw new Error('Failed to fetch tree');
      const data = await res.json();
      set({ tree: data });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  fetchNote: async (id) => {
    if (!id) return;
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/notes/${id}`);
      if (!res.ok) throw new Error('Failed to fetch note');
      const note = await res.json();
      set({ 
        activeNoteId: id, 
        activeNote: note,
        syncStatus: 'SAVED'
      });
      // Refresh recents list
      get().fetchSpecial();
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  fetchSpecial: async () => {
    try {
      const [favRes, recRes, tagRes] = await Promise.all([
        fetch('/api/notes-special/favorites'),
        fetch('/api/notes-special/recent'),
        fetch('/api/tags')
      ]);
      if (favRes.ok) {
        const favs = await favRes.json();
        set({ favorites: favs });
      }
      if (recRes.ok) {
        const recs = await recRes.json();
        set({ recents: recs });
      }
      if (tagRes.ok) {
        const tags = await tagRes.json();
        set({ tags });
      }
    } catch (err) {
      console.error('Error fetching special categories:', err);
    }
  },

  // Subjects CRUD
  createSubject: async (title) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to create subject');
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  renameSubject: async (id, title) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to rename subject');
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  deleteSubject: async (id) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete subject');
      if (get().activeNote && get().activeNote.subject_id === id) {
        set({ activeNote: null, activeNoteId: null });
      }
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  // Topics CRUD
  createTopic: async (subjectId, title) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, title })
      });
      if (!res.ok) throw new Error('Failed to create topic');
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  renameTopic: async (id, title) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to rename topic');
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  deleteTopic: async (id) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete topic');
      if (get().activeNote && get().activeNote.topic_id === id) {
        set({ activeNote: null, activeNoteId: null });
      }
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  // Subtopics CRUD
  createSubtopic: async (topicId, title) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch('/api/subtopics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, title })
      });
      if (!res.ok) throw new Error('Failed to create subtopic');
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  renameSubtopic: async (id, title) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/subtopics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to rename subtopic');
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  deleteSubtopic: async (id) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/subtopics/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete subtopic');
      if (get().activeNote && get().activeNote.subtopic_id === id) {
        set({ activeNote: null, activeNoteId: null });
      }
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  // Notes CRUD
  createNote: async (subjectId, topicId, subtopicId, title, content = '') => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, topic_id: topicId, subtopic_id: subtopicId, title, content })
      });
      if (!res.ok) throw new Error('Failed to create note');
      const note = await res.json();
      await get().fetchTree();
      set({ syncStatus: 'SAVED' });
      await get().fetchNote(note.id);
      return note.id;
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
      return null;
    }
  },

  // Auto-saves content (Debounced 800ms)
  updateNoteContent: (content) => {
    const activeNote = get().activeNote;
    if (!activeNote) return;

    // Update local state immediately for instant typing responsiveness
    set({
      activeNote: { ...activeNote, content },
      syncStatus: 'SYNCING'
    });

    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes/${activeNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Failed to auto-save content');
        
        set({ syncStatus: 'SAVED' });
        // Fetch special to reload recent logs
        get().fetchSpecial();
      } catch (err) {
        console.error('Auto-save error:', err);
        set({ syncStatus: 'ERROR' });
      }
    }, 800);
  },

  // Updates metadata instantly
  updateNoteMetadata: async (updates) => {
    const activeNote = get().activeNote;
    if (!activeNote) return;

    // Update local state
    set({
      activeNote: { ...activeNote, ...updates },
      syncStatus: 'SYNCING'
    });

    try {
      const res = await fetch(`/api/notes/${activeNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update note metadata');
      
      set({ syncStatus: 'SAVED' });
      await get().fetchTree();
      await get().fetchSpecial();
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  deleteNote: async (id) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      
      if (get().activeNoteId === id) {
        set({ activeNote: null, activeNoteId: null });
      }
      await get().fetchTree();
      await get().fetchSpecial();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  // Tag interactions
  addTagToNote: async (noteId, tagName) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/notes/${noteId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName })
      });
      if (!res.ok) throw new Error('Failed to add tag');
      
      // Reload active note to see new tag list
      if (get().activeNoteId === noteId) {
        await get().fetchNote(noteId);
      }
      await get().fetchSpecial();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  removeTagFromNote: async (noteId, tagId) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/notes/${noteId}/tags/${tagId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete tag');
      
      // Reload active note to see new tag list
      if (get().activeNoteId === noteId) {
        await get().fetchNote(noteId);
      }
      await get().fetchSpecial();
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  // Version History Restore
  restoreVersion: async (noteId, versionId) => {
    try {
      set({ syncStatus: 'SYNCING' });
      const res = await fetch(`/api/notes/${noteId}/versions/${versionId}/restore`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to restore version');
      
      await get().fetchNote(noteId);
      set({ syncStatus: 'SAVED' });
    } catch (err) {
      console.error(err);
      set({ syncStatus: 'ERROR' });
    }
  },

  // Global search trigger
  performSearch: async (q) => {
    if (!q) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }
    set({ searchQuery: q });
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const results = await res.json();
      set({ searchResults: results });
    } catch (err) {
      console.error(err);
    }
  }
}));
