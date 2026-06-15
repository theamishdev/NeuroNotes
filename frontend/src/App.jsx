import React, { useEffect, useState } from 'react';
import { useNotesStore } from './store/notesStore';
import { playSound } from './components/SoundController';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Breadcrumbs from './components/Breadcrumbs';
import NoteViewer from './components/NoteViewer';
import NoteEditor from './components/NoteEditor';
import MatrixBackground from './components/MatrixBackground';
import SearchModal from './components/SearchModal';
import HistoryModal from './components/HistoryModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { 
  Terminal, ShieldCheck, Heart, Clock, Keyboard, 
  Cpu, FileText, Database, Radio 
} from 'lucide-react';

export const App = () => {
  const { 
    tree, 
    activeNote, 
    fetchTree, 
    fetchNote,
    fetchSpecial, 
    favorites, 
    recents, 
    audioEnabled, 
    isSidebarOpen, 
    setSidebarOpen,
    distractionFree, 
    setDistractionFree,
    createNote
  } = useNotesStore();

  const [editMode, setEditMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Load initial tree and special content on mount
  useEffect(() => {
    fetchTree();
    fetchSpecial();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K -> Search Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      // Ctrl + B -> Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(!isSidebarOpen);
      }
      // Ctrl + D -> Toggle Distraction Free Reader
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDistractionFree(!distractionFree);
      }
      // Ctrl + N -> Quick note add
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (tree.length > 0 && tree[0].topics?.length > 0) {
          const title = prompt('SECURE VAULT TITLE:');
          if (title) {
            createNote(tree[0].id, tree[0].topics[0].id, null, title, `# ${title}\n\nStart typing...`);
          }
        } else {
          alert('SYSTEM ERROR // CONSTRUCT A SUBJECT & TOPIC FIRST.');
        }
      }
      // Escape -> Exit all modals
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setHistoryOpen(false);
        setShortcutsOpen(false);
        setDistractionFree(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, distractionFree, tree]);

  // When note changes, go to view mode default
  useEffect(() => {
    setEditMode(false);
  }, [activeNote?.id]);

  const selectNoteDirect = (noteId) => {
    playSound('select', audioEnabled);
    fetchNote(noteId);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-cyber-bg text-slate-200">
      
      {/* 1. Holographic Matrix Rain background */}
      <MatrixBackground />

      {/* 2. Cyber Scanline / CRT overlay */}
      <div className="cyber-scanner" />

      {/* 3. Navbar Header */}
      {!distractionFree && (
        <Navbar 
          onOpenSearch={() => setSearchOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
      )}

      {/* 4. Core Body panel */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Left Sidebar */}
        {!distractionFree && (
          <Sidebar 
            onShowShortcuts={() => setShortcutsOpen(true)}
            onShowHistory={() => setHistoryOpen(true)}
            onEditMode={() => setEditMode(true)}
          />
        )}

        {/* Main Workspace content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-cyber-dark/45 border-l border-cyber-border/20">
          
          {/* Breadcrumbs path */}
          {!distractionFree && <Breadcrumbs />}

          {/* Core workspace switcher */}
          {activeNote ? (
            editMode ? (
              <NoteEditor onViewMode={() => setEditMode(false)} />
            ) : (
              <NoteViewer onEditMode={() => setEditMode(true)} />
            )
          ) : (
            // Holographic Hacker Dashboard Welcome page
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 select-none">
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Visual Banner */}
                <div className="cyber-glass p-6 rounded-lg border-cyber-pink/50 text-center flex flex-col items-center justify-center space-y-3 relative overflow-hidden shadow-neon-pink">
                  <div className="absolute top-2 right-2 flex items-center space-x-1.5 text-[8px] font-cyber text-cyber-pink animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    <span>BROADCAST: ONLINE</span>
                  </div>
                  
                  <Cpu className="w-12 h-12 text-cyber-pink animate-pulse" />
                  <h1 className="font-cyber font-black tracking-widest text-2xl text-white glow-text-pink">
                    NEURO_NOTES // INTEL_VAULT
                  </h1>
                  <p className="font-mono text-xs text-slate-400 max-w-lg">
                    Decryption system online. Connected to secure SQLite local drive. Create nodes in the navigation sector or select an archive sector to query payload data.
                  </p>
                </div>

                {/* Dashboard layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Pinned / Pinned favorites */}
                  <div className="cyber-glass p-5 rounded-lg border-cyber-purple/40">
                    <h3 className="font-cyber text-xs text-cyber-purple glow-text-purple tracking-widest font-black mb-3.5 flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-cyber-pink" />
                      <span>PINNED_SECTORS</span>
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {favorites.length === 0 ? (
                        <div className="text-[10px] font-mono text-gray-500 py-3 italic">
                          NO PINNED DATA VAULTS REGISTERED
                        </div>
                      ) : (
                        favorites.map(fav => (
                          <div 
                            key={fav.id}
                            onClick={() => selectNoteDirect(fav.id)}
                            className="p-2 cursor-pointer border border-cyber-border/30 hover:border-cyber-pink hover:bg-cyber-pink/5 rounded flex justify-between items-center transition-all"
                          >
                            <span className="font-mono text-xs text-white truncate max-w-[200px]">{fav.title}</span>
                            <span className="font-mono text-[9px] text-cyber-pink">PINNED</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recently Opened Notes */}
                  <div className="cyber-glass p-5 rounded-lg border-cyber-cyan/40">
                    <h3 className="font-cyber text-xs text-cyber-cyan glow-text-cyan tracking-widest font-black mb-3.5 flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-cyber-cyan" />
                      <span>RECENT_STREAMS</span>
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {recents.length === 0 ? (
                        <div className="text-[10px] font-mono text-gray-500 py-3 italic">
                          NO RECENT SYSTEM ACCESS LOGS
                        </div>
                      ) : (
                        recents.map(rec => (
                          <div 
                            key={rec.id}
                            onClick={() => selectNoteDirect(rec.id)}
                            className="p-2 cursor-pointer border border-cyber-border/30 hover:border-cyber-cyan hover:bg-cyber-cyan/5 rounded flex justify-between items-center transition-all"
                          >
                            <span className="font-mono text-xs text-white truncate max-w-[200px]">{rec.title}</span>
                            <span className="font-mono text-[8px] text-gray-500">
                              {new Date(rec.opened_at).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Hotkeys block */}
                <div className="cyber-glass p-5 rounded-lg border-cyber-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Keyboard className="w-8 h-8 text-cyber-cyan animate-pulse" />
                    <div>
                      <h4 className="font-cyber text-xs text-white">HOTKEYS // HUD_SPEEDRUN</h4>
                      <p className="font-mono text-[10px] text-gray-500">Enable faster netrunning operations using shortcut keys.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { playSound('select', audioEnabled); setShortcutsOpen(true); }}
                    className="px-4 py-1.5 font-cyber text-[10px] tracking-wider border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/15 rounded transition-all select-none self-start md:self-center"
                  >
                    DEPLOY KEYMAP
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>

      {/* 5. Modals Overlay */}
      {searchOpen && (
        <SearchModal onClose={() => setSearchOpen(false)} />
      )}
      
      {historyOpen && (
        <HistoryModal onClose={() => setHistoryOpen(false)} />
      )}

      {shortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
};
export default App;
