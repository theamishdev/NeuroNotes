import React, { useMemo } from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { Marked } from 'marked';
import { 
  Maximize2, Minimize2, FileText, Calendar, Hash, 
  Trash2, Edit, Printer, FileDown, Bookmark, BookmarkCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Simple html escaping
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const NoteViewer = ({ onEditMode }) => {
  const { 
    activeNote, 
    distractionFree, 
    setDistractionFree, 
    audioEnabled, 
    updateNoteMetadata,
    deleteNote,
    removeTagFromNote
  } = useNotesStore();

  const parsedContent = useMemo(() => {
    if (!activeNote) return '';

    // Set up Marked parser with custom GFM rendering
    const markedInstance = new Marked();
    
    // Custom renderer to output cyberpunk copy-code wraps
    const renderer = {
      code(code, infostring) {
        const lang = infostring || 'code';
        return `
          <div class="code-block-wrapper my-4">
            <div class="flex items-center justify-between px-4 py-1.5 bg-[#0e0a1a] border border-cyber-border/40 font-cyber text-[10px] text-cyber-cyan rounded-t">
              <span>DECRYPTED_LAYER // ${lang.toUpperCase()}</span>
              <button class="code-copy-btn" onclick="
                (function(btn) {
                  const pre = btn.closest('.code-block-wrapper').querySelector('pre');
                  navigator.clipboard.writeText(pre.innerText.trim());
                  btn.innerText = 'COPIED!';
                  setTimeout(() => { btn.innerText = 'COPY'; }, 2000);
                })(this)
              ">COPY</button>
            </div>
            <pre class="!mt-0 !rounded-t-none"><code class="language-${lang}">${escapeHtml(code)}</code></pre>
          </div>
        `;
      },
      // Cyberpunk custom blockquote alert styling
      blockquote(quote) {
        let alertClass = '';
        if (quote.includes('>[!NOTE]')) {
          alertClass = 'cyber-alert-note';
          quote = quote.replace('&gt;[!NOTE]', '');
        } else if (quote.includes('>[!WARNING]')) {
          alertClass = 'cyber-alert-warning';
          quote = quote.replace('&gt;[!WARNING]', '');
        } else if (quote.includes('>[!CAUTION]')) {
          alertClass = 'cyber-alert-caution';
          quote = quote.replace('&gt;[!CAUTION]', '');
        }
        return `<blockquote class="${alertClass}">${quote}</blockquote>`;
      }
    };

    markedInstance.use({ renderer });
    return markedInstance.parse(activeNote.content);
  }, [activeNote]);

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 font-cyber">
        <FileText className="w-16 h-16 text-cyber-border mb-4 animate-pulse" />
        <h2 className="text-xl text-cyber-purple glow-text-purple tracking-widest font-bold">NEURONOTES SECURE DISK</h2>
        <p className="font-mono text-xs text-gray-500 mt-2">SELECT OR CONSTRUCT A NODE IN THE DIRECTORY TO INJECT CONTENT</p>
      </div>
    );
  }

  const handleFavoriteToggle = () => {
    playSound('select', audioEnabled);
    const updatedStatus = activeNote.is_favorite === 1 ? 0 : 1;
    updateNoteMetadata({ is_favorite: updatedStatus });
    if (updatedStatus) {
      confetti({
        particleCount: 40,
        spread: 30,
        colors: ['#ff007f', '#00f0ff']
      });
    }
  };

  const handlePinToggle = () => {
    playSound('select', audioEnabled);
    updateNoteMetadata({ is_pinned: activeNote.is_pinned === 1 ? 0 : 1 });
  };

  const handleDelete = () => {
    if (confirm('DESTRUCT SYSTEM NOTE? THIS CANNOT BE UNDONE.')) {
      playSound('delete', audioEnabled);
      deleteNote(activeNote.id);
    }
  };

  const handlePrint = () => {
    playSound('select', audioEnabled);
    window.print();
  };

  const handleExportMarkdown = () => {
    playSound('success', audioEnabled);
    window.open(`/api/notes/${activeNote.id}/export/markdown`, '_blank');
  };

  return (
    <div className={`flex-1 flex flex-col bg-cyber-dark/30 overflow-hidden ${distractionFree ? 'fixed inset-0 z-40 bg-cyber-bg' : ''}`}>
      {/* Viewer Header HUD */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-cyber-border/40 bg-cyber-dark/65 select-none print:hidden">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleFavoriteToggle}
            className="text-gray-400 hover:text-cyber-pink transition-all"
            title={activeNote.is_favorite ? "Remove Favorite" : "Favorite Note"}
          >
            {activeNote.is_favorite ? (
              <BookmarkCheck className="w-5 h-5 text-cyber-pink shadow-neon-pink" />
            ) : (
              <Bookmark className="w-5 h-5 hover:scale-105" />
            )}
          </button>
          
          <h2 className="font-cyber text-sm font-bold text-white glow-text-cyan flex items-center gap-2">
            <span>{activeNote.title.toUpperCase()}</span>
          </h2>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Action Buttons */}
          <button
            onClick={onEditMode}
            className="flex items-center space-x-1.5 px-3 py-1 font-cyber text-[10px] text-cyber-cyan border border-cyber-cyan/40 hover:border-cyber-cyan hover:shadow-neon-cyan transition-all rounded bg-cyber-dark"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EDIT VAULT</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1 font-cyber text-[10px] text-cyber-purple border border-cyber-purple/40 hover:border-cyber-purple hover:shadow-neon-purple transition-all rounded bg-cyber-dark"
            title="Download Markdown"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EXPORT MD</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-1.5 border border-cyber-border hover:border-white text-gray-400 hover:text-white transition-all rounded bg-cyber-dark"
            title="Print Note (PDF)"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 border border-cyber-border hover:border-cyber-pink text-gray-400 hover:text-cyber-pink transition-all rounded bg-cyber-dark"
            title="Destruct Note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-cyber-border" />

          {/* Distraction Free Trigger */}
          <button
            onClick={() => { playSound('select', audioEnabled); setDistractionFree(!distractionFree); }}
            className={`p-1.5 border transition-all rounded bg-cyber-dark ${
              distractionFree 
                ? 'border-cyber-pink text-cyber-pink shadow-neon-pink' 
                : 'border-cyber-border hover:border-cyber-cyan text-gray-400 hover:text-cyber-cyan'
            }`}
            title={distractionFree ? "Exit Fullscreen" : "Fullscreen Reader"}
          >
            {distractionFree ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Reader Panel */}
      <div className="flex-1 overflow-y-auto px-6 py-8 selection:bg-cyber-pink selection:text-white print:p-0">
        <div className="max-w-3xl mx-auto">
          {/* Metadata Display */}
          <div className="mb-6 flex flex-wrap gap-3 items-center justify-between text-[10px] font-mono text-gray-500 border-b border-cyber-border/20 pb-4 print:hidden">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyber-purple" />
              <span>SYNCED: {new Date(activeNote.updated_at).toLocaleString()}</span>
            </div>
            
            {/* Tags area */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <Hash className="w-3.5 h-3.5 text-cyber-cyan" />
              {activeNote.tags && activeNote.tags.length > 0 ? (
                activeNote.tags.map((tag) => (
                  <span 
                    key={tag.id}
                    className="flex items-center bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-cyan px-2 py-0.5 rounded text-[9px] hover:border-cyber-pink hover:text-cyber-pink cursor-pointer transition-colors"
                    onClick={() => {
                      if (confirm(`REMOVE TAG #${tag.name}?`)) {
                        playSound('delete', audioEnabled);
                        removeTagFromNote(activeNote.id, tag.id);
                      }
                    }}
                    title="Click to remove tag"
                  >
                    #{tag.name}
                  </span>
                ))
              ) : (
                <span className="italic text-gray-600">NO SECURE TAGS REGISTERED</span>
              )}
            </div>
          </div>

          {/* Rendered HTML */}
          <div 
            className="markdown-body text-[#c3c7db]"
            dangerouslySetInnerHTML={{ __html: parsedContent }}
          />
        </div>
      </div>
    </div>
  );
};
export default NoteViewer;
