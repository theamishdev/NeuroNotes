import React, { useState, useRef } from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { 
  Save, Eye, Code, Bold, Italic, List, CheckSquare, 
  Table, Image, Plus, X, ArrowLeft, Hash 
} from 'lucide-react';
import { Marked } from 'marked';

// Simple html escaping
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const NoteEditor = ({ onViewMode }) => {
  const { 
    activeNote, 
    updateNoteContent, 
    updateNoteMetadata,
    addTagToNote,
    removeTagFromNote,
    syncStatus, 
    audioEnabled 
  } = useNotesStore();

  const [editorTab, setEditorTab] = useState('edit'); // 'edit' | 'preview' | 'split'
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!activeNote) return null;

  // Insert markdown markdown syntax helper
  const insertText = (beforeStr, afterStr = '') => {
    playSound('select', audioEnabled);
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const replacement = beforeStr + (selection || '') + afterStr;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    
    updateNoteContent(newContent);

    // Refocus and place cursor inside/after
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + beforeStr.length;
      textarea.selectionEnd = start + beforeStr.length + (selection ? selection.length : 0);
    }, 50);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    playSound('select', audioEnabled);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        // Insert markdown image tag
        insertText(`\n![${file.name}](${data.url})\n`);
      } else {
        alert('UPLOAD FAILED // GATEWAY REFUSED FILE');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    playSound('success', audioEnabled);
    await addTagToNote(activeNote.id, tagInput.trim());
    setTagInput('');
  };

  const handleRemoveTag = (tagId) => {
    playSound('delete', audioEnabled);
    removeTagFromNote(activeNote.id, tagId);
  };

  // Compile markdown for preview
  const compilePreviewHtml = () => {
    const markedInstance = new Marked();
    // Use custom code block display
    markedInstance.use({
      renderer: {
        code(code, infostring) {
          const lang = infostring || 'code';
          return `
            <div class="code-block-wrapper my-4">
              <div class="flex items-center justify-between px-4 py-1.5 bg-[#0e0a1a] border border-cyber-border/40 font-cyber text-[10px] text-cyber-cyan rounded-t">
                <span>LAYER // ${lang.toUpperCase()}</span>
              </div>
              <pre class="!mt-0 !rounded-t-none"><code class="language-${lang}">${escapeHtml(code)}</code></pre>
            </div>
          `;
        }
      }
    });
    return markedInstance.parse(activeNote.content);
  };

  return (
    <div className="flex-1 flex flex-col bg-cyber-dark/20 overflow-hidden">
      {/* Editor top toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-3 border-b border-cyber-border/40 bg-cyber-dark/65 space-y-2.5 md:space-y-0">
        
        {/* Left pane: title edit & view mode toggles */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onViewMode}
            className="p-1.5 border border-cyber-border/50 hover:border-cyber-cyan text-gray-400 hover:text-cyber-cyan transition-all rounded bg-cyber-dark"
            title="Return to Read Mode"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <input
            type="text"
            value={activeNote.title}
            onChange={(e) => updateNoteMetadata({ title: e.target.value })}
            placeholder="VAULT TITLE..."
            className="bg-transparent border-b border-cyber-border/20 focus:border-cyber-cyan outline-none text-sm font-cyber text-white tracking-wide py-0.5 focus:ring-0 w-48 sm:w-64"
          />
        </div>

        {/* Center/Right pane: Tab togglers and format bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format helpers */}
          <div className="flex items-center space-x-1 border-r border-cyber-border/30 pr-2 mr-2">
            <button onClick={() => insertText('**', '**')} className="p-1 text-gray-400 hover:text-cyber-cyan transition-colors" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertText('*', '*')} className="p-1 text-gray-400 hover:text-cyber-cyan transition-colors" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertText('\n```javascript\n', '\n```\n')} className="p-1 text-gray-400 hover:text-cyber-cyan transition-colors" title="Code Block"><Code className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertText('\n* ')} className="p-1 text-gray-400 hover:text-cyber-cyan transition-colors" title="List"><List className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertText('\n- [ ] ')} className="p-1 text-gray-400 hover:text-cyber-cyan transition-colors" title="Checklist"><CheckSquare className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertText('\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Data | Data |\n')} className="p-1 text-gray-400 hover:text-cyber-cyan transition-colors" title="Table"><Table className="w-3.5 h-3.5" /></button>
            
            {/* Image Trigger */}
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-1 text-gray-400 hover:text-cyber-pink transition-colors"
              title="Upload Image"
            >
              <Image className="w-3.5 h-3.5" />
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* View Toggles */}
          <div className="flex border border-cyber-border/40 rounded bg-cyber-dark overflow-hidden font-cyber text-[9px] tracking-widest">
            <button
              onClick={() => { playSound('select', audioEnabled); setEditorTab('edit'); }}
              className={`px-3 py-1 border-r border-cyber-border/30 transition-colors ${editorTab === 'edit' ? 'bg-cyber-cyan text-cyber-bg font-bold shadow-neon-cyan' : 'text-gray-400 hover:bg-cyber-cyan/10'}`}
            >
              RAW_INPUT
            </button>
            <button
              onClick={() => { playSound('select', audioEnabled); setEditorTab('preview'); }}
              className={`px-3 py-1 border-r border-cyber-border/30 transition-colors ${editorTab === 'preview' ? 'bg-cyber-pink text-white font-bold shadow-neon-pink' : 'text-gray-400 hover:bg-cyber-pink/10'}`}
            >
              DECRYPTED
            </button>
            <button
              onClick={() => { playSound('select', audioEnabled); setEditorTab('split'); }}
              className={`px-3 py-1 transition-colors ${editorTab === 'split' ? 'bg-cyber-purple text-white font-bold shadow-neon-purple' : 'text-gray-400 hover:bg-cyber-purple/10'}`}
            >
              SPLIT_SHELL
            </button>
          </div>

          {/* Sync indicator */}
          <div className="flex items-center space-x-1.5 pl-2 font-cyber text-[9px]">
            <span className={`h-2 w-2 rounded-full ${
              syncStatus === 'SAVED' ? 'bg-cyber-green shadow-neon-green animate-pulse' :
              syncStatus === 'SYNCING' ? 'bg-cyber-yellow shadow-neon-yellow animate-spin' :
              'bg-cyber-pink shadow-neon-pink'
            }`} />
            <span className="text-gray-400">{syncStatus}</span>
          </div>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* RAW TEXT EDITOR */}
        {(editorTab === 'edit' || editorTab === 'split') && (
          <div className="flex-1 h-full relative">
            <textarea
              ref={textareaRef}
              value={activeNote.content}
              onChange={(e) => {
                // Play typing clicking sound as keys are pressed
                playSound('typewriter', audioEnabled);
                updateNoteContent(e.target.value);
              }}
              placeholder="# Ingest Markdown Vault content here..."
              className="w-full h-full p-6 bg-[#07050d] font-mono text-xs text-[#a0a5b8] border-none outline-none focus:ring-0 resize-none leading-relaxed select-text"
            />
          </div>
        )}

        {/* DECRIYPTED PREVIEW */}
        {(editorTab === 'preview' || editorTab === 'split') && (
          <div className="flex-1 h-full overflow-y-auto p-6 border-l border-cyber-border/40 bg-cyber-dark/10">
            <div className="max-w-3xl mx-auto">
              <div 
                className="markdown-body text-[#c3c7db]"
                dangerouslySetInnerHTML={{ __html: compilePreviewHtml() }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tags Linking Bar */}
      <div className="px-6 py-2 border-t border-cyber-border/40 bg-cyber-dark/50 flex flex-wrap gap-2 items-center select-none font-mono text-xs">
        <Hash className="w-4.5 h-4.5 text-cyber-purple" />
        <span className="font-cyber text-[10px] text-gray-400 tracking-wider">VAULT_TAGS:</span>
        <div className="flex flex-wrap gap-1.5">
          {activeNote.tags && activeNote.tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-cyber-purple/10 border border-cyber-purple/35 text-cyber-cyan text-[10px] group hover:border-cyber-pink hover:text-cyber-pink cursor-pointer transition-colors"
              onClick={() => handleRemoveTag(tag.id)}
              title="Remove tag link"
            >
              <span>#{tag.name}</span>
              <X className="w-2.5 h-2.5 text-gray-500 hover:text-cyber-pink" />
            </span>
          ))}
        </div>
        <form onSubmit={handleAddTag} className="flex items-center ml-2 border border-cyber-border/30 rounded px-1.5 bg-cyber-dark">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="ADD TAG..."
            className="bg-transparent border-none outline-none text-[10px] font-mono p-0 focus:ring-0 text-white placeholder-gray-600 w-20"
          />
          <button type="submit" className="p-0.5 text-cyber-cyan hover:text-cyber-pink transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
export default NoteEditor;
