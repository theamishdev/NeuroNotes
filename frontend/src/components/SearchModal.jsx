import React, { useEffect, useRef, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { X, Search, FileText, Hash, Calendar, ArrowRight } from 'lucide-react';

export const SearchModal = ({ onClose }) => {
  const { searchQuery, searchResults, performSearch, fetchNote, audioEnabled, tags } = useNotesStore();
  const inputRef = useRef(null);
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    // Focus search input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    // Play a typewriter clicking sound as they type
    playSound('typewriter', audioEnabled);
    
    if (selectedTag) {
      setSelectedTag(''); // Clear tag filter if typing
    }
    performSearch(q);
  };

  const handleSelectNote = async (id) => {
    playSound('select', audioEnabled);
    await fetchNote(id);
    onClose();
  };

  const handleSelectTag = (tagName) => {
    playSound('select', audioEnabled);
    setSelectedTag(tagName);
    performSearch(tagName); // search the tag
  };

  // Filter notes further if a specific tag was clicked
  const displayedResults = searchResults;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm pt-[10vh] animate-flicker animate-pulse-glow">
      <div className="w-full max-w-2xl cyber-glass bg-cyber-dark/95 border-cyber-cyan/50 text-[#c3c7db] overflow-hidden rounded-lg shadow-neon-cyan flex flex-col max-h-[70vh]">
        
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-cyber-cyan/30 bg-cyber-dark/60">
          <Search className="w-5 h-5 text-cyber-cyan mr-3 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="DECRYPT VAULT FILES... (ENTER KEYWORD OR TAG)"
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-white placeholder-cyber-border focus:ring-0"
          />
          <button 
            onClick={() => { playSound('select', audioEnabled); onClose(); }}
            className="text-gray-400 hover:text-cyber-pink transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tags Index */}
        {tags.length > 0 && (
          <div className="px-4 py-2 border-b border-cyber-border/20 bg-cyber-dark/40 flex flex-wrap gap-1.5 items-center">
            <span className="font-cyber text-[10px] tracking-wider text-cyber-purple mr-1">ACTIVE_TAGS:</span>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleSelectTag(tag.name)}
                className={`flex items-center px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                  selectedTag === tag.name 
                    ? 'bg-cyber-pink text-white border-cyber-pink shadow-neon-pink' 
                    : 'bg-cyber-dark/80 text-cyber-cyan border-cyber-cyan/30 hover:border-cyber-cyan'
                }`}
              >
                <Hash className="w-2.5 h-2.5 mr-0.5" />
                <span>{tag.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {displayedResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-cyber text-xs tracking-widest">
              {searchQuery ? 'NO MATCHING CORE SECTORS FOUND' : 'ENTER TERMINAL SEARCH QUERY...'}
            </div>
          ) : (
            displayedResults.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note.id)}
                className="group p-3 cursor-pointer cyber-glass-pink hover:bg-cyber-purple/10 border-cyber-border/40 hover:border-cyber-pink hover:shadow-neon-pink transition-all duration-200 rounded flex flex-col md:flex-row md:items-center justify-between"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded bg-cyber-dark/80 border border-cyber-border/50 text-cyber-cyan group-hover:text-cyber-pink group-hover:border-cyber-pink transition-colors mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-cyber text-xs text-white group-hover:text-cyber-pink transition-colors">
                      {note.title.toUpperCase()}
                    </h4>
                    {note.content && (
                      <p className="font-mono text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                        {note.content.replace(/[#*`_[\]]/g, '')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-2 md:mt-0 font-mono text-[9px] text-gray-500 self-end md:self-center">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyber-border group-hover:text-cyber-cyan transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-cyber-dark text-[9px] font-cyber text-gray-500 border-t border-cyber-border/30 flex justify-between">
          <span>DECRYPTOR: QUERY_RELEVANCE_MATCH</span>
          <span>RESULTS FOUND: {displayedResults.length}</span>
        </div>
      </div>
    </div>
  );
};
export default SearchModal;
