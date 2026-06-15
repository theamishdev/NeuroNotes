import React from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { 
  Search, Volume2, VolumeX, Menu, PlusCircle, 
  Terminal, ShieldCheck, Heart, Clock
} from 'lucide-react';

export const Navbar = ({ onOpenSearch, onOpenShortcuts }) => {
  const { 
    isSidebarOpen, 
    setSidebarOpen, 
    audioEnabled, 
    setAudioEnabled,
    createNote,
    tree,
    syncStatus 
  } = useNotesStore();

  const handleToggleSidebar = () => {
    playSound('select', audioEnabled);
    setSidebarOpen(!isSidebarOpen);
  };

  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    playSound('success', nextState); // play confirmation click in next state
  };

  const handleQuickAdd = async () => {
    playSound('success', audioEnabled);
    // Find the first available subject and topic to add a generic note
    if (tree.length > 0 && tree[0].topics?.length > 0) {
      const subjId = tree[0].id;
      const topicId = tree[0].topics[0].id;
      const noteTitle = `Quick note ${new Date().toLocaleTimeString()}`;
      await createNote(subjId, topicId, null, noteTitle, `# ${noteTitle}\n\nStart typing here...`);
    } else {
      alert('VAULT ERROR // CONSTRUCT A SUBJECT & TOPIC FIRST.');
    }
  };

  return (
    <header className="h-14 border-b border-cyber-border/40 bg-[#080510]/80 backdrop-blur-md flex items-center justify-between px-4 select-none print:hidden z-20">
      {/* Left side: hamburger menu & brand */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={handleToggleSidebar}
          className="p-1.5 border border-cyber-border/50 text-[#c3c7db] hover:text-cyber-cyan hover:border-cyber-cyan hover:shadow-neon-cyan transition-all rounded bg-cyber-dark/45"
          title="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-cyber-pink animate-pulse" />
          <span className="font-cyber font-black tracking-widest text-xs hidden sm:inline text-white">
            NEURO<span className="text-cyber-cyan font-light">NOTES</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-cyber-purple/10 border border-cyber-purple/40 text-[#a07fff] font-mono text-[9px] scale-90 hidden md:inline tracking-widest shadow-[0_0_4px_rgba(189,0,255,0.25)]">
            CORE_ENGINE:v1.0
          </span>
        </div>
      </div>

      {/* Center section: Search Bar button */}
      <div className="flex-1 max-w-md mx-6">
        <div 
          onClick={() => { playSound('select', audioEnabled); onOpenSearch(); }}
          className="flex items-center bg-cyber-dark/80 border border-cyber-border/30 hover:border-cyber-cyan/60 rounded px-3 py-1.5 cursor-pointer text-gray-500 hover:text-cyber-cyan transition-all"
        >
          <Search className="w-4 h-4 mr-2" />
          <span className="font-mono text-xs text-left truncate flex-1 select-none">
            DECRYPT VAULT FILES... (Ctrl + K)
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Add */}
        <button
          onClick={handleQuickAdd}
          className="flex items-center space-x-1.5 px-3 py-1.5 font-cyber text-[10px] tracking-wider text-cyber-bg bg-cyber-pink border border-cyber-pink hover:bg-white hover:text-cyber-bg hover:shadow-neon-pink transition-all rounded"
          title="Create note in primary vault"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden md:inline">QUICK_ADD</span>
        </button>

        {/* Audio Mute toggle */}
        <button
          onClick={handleToggleAudio}
          className={`p-1.5 border transition-all rounded ${
            audioEnabled 
              ? 'border-cyber-cyan/40 hover:border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5 shadow-neon-cyan' 
              : 'border-cyber-border hover:border-gray-400 text-gray-500'
          }`}
          title={audioEnabled ? "Mute Terminal Audio" : "Unmute Terminal Audio"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Sync Indicator */}
        <div className="hidden lg:flex items-center space-x-1 border border-cyber-border/40 rounded px-2.5 py-1 bg-cyber-dark/80 text-[10px] font-cyber text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyber-green animate-pulse" />
          <span>VAULT: SECURE</span>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
