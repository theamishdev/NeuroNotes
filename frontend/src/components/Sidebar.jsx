import React, { useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { 
  Plus, ChevronDown, ChevronRight, Folder, FolderOpen, 
  FileText, Edit2, Trash2, Database, Bookmark, Keyboard, HelpCircle, Import
} from 'lucide-react';

export const Sidebar = ({ 
  onShowShortcuts, 
  onShowHistory,
  onEditMode 
}) => {
  const { 
    tree, 
    activeNoteId, 
    fetchNote, 
    createSubject, 
    deleteSubject,
    renameSubject,
    createTopic, 
    deleteTopic,
    renameTopic,
    createSubtopic, 
    deleteSubtopic,
    renameSubtopic,
    createNote, 
    deleteNote,
    updateNoteMetadata,
    audioEnabled,
    isSidebarOpen,
    setSidebarOpen
  } = useNotesStore();

  // Expanded nodes tracker (e.g. "subject-1", "topic-3")
  const [expandedNodes, setExpandedNodes] = useState(new Set(['subject-1']));
  const [activeInput, setActiveInput] = useState(null); // { type: 'subject'|'topic'|'subtopic'|'note', parentId?: number, action: 'add'|'rename', id?: number }
  const [inputValue, setInputValue] = useState('');
  const [importTarget, setImportTarget] = useState(null); // { subject_id, topic_id, subtopic_id }

  const toggleNode = (nodeKey) => {
    playSound('hover', audioEnabled);
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeKey)) {
      newExpanded.delete(nodeKey);
    } else {
      newExpanded.add(nodeKey);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectNote = (noteId) => {
    playSound('select', audioEnabled);
    fetchNote(noteId);
  };

  // Keyboard sound click for text inputs
  const handleInputKeystroke = () => {
    playSound('typewriter', audioEnabled);
  };

  // Create or rename handler
  const handleSubmitInput = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setActiveInput(null);
      return;
    }

    playSound('success', audioEnabled);
    const { type, action, id, parentId } = activeInput;

    if (action === 'add') {
      if (type === 'subject') {
        await createSubject(inputValue.trim());
      } else if (type === 'topic') {
        await createTopic(parentId, inputValue.trim());
        toggleNode(`subject-${parentId}`);
      } else if (type === 'subtopic') {
        await createSubtopic(parentId, inputValue.trim());
        toggleNode(`topic-${parentId}`);
      } else if (type === 'note') {
        // Find subject_id first
        let subjId = null;
        let topicId = null;
        let subtopicId = null;

        if (activeInput.level === 'topic') {
          topicId = parentId;
          // find subject ID from tree
          const matchSub = tree.find(s => s.topics.some(t => t.id === topicId));
          subjId = matchSub ? matchSub.id : null;
        } else if (activeInput.level === 'subtopic') {
          subtopicId = parentId;
          // find topic and subject IDs
          for (let s of tree) {
            for (let t of s.topics) {
              if (t.subtopics.some(st => st.id === subtopicId)) {
                subjId = s.id;
                topicId = t.id;
                break;
              }
            }
          }
        }
        
        if (subjId && topicId) {
          const noteId = await createNote(subjId, topicId, subtopicId, inputValue.trim(), '# New Cyber Note\\n\\nWrite here...');
          if (noteId) {
            if (subtopicId) toggleNode(`subtopic-${subtopicId}`);
            else toggleNode(`topic-${topicId}`);
          }
        }
      }
    } else if (action === 'rename') {
      if (type === 'subject') {
        await renameSubject(id, inputValue.trim());
      } else if (type === 'topic') {
        await renameTopic(id, inputValue.trim());
      } else if (type === 'subtopic') {
        await renameSubtopic(id, inputValue.trim());
      }
    }

    setInputValue('');
    setActiveInput(null);
  };

  // Native HTML5 Drag and Drop handlers
  const handleDragStart = (e, noteId) => {
    e.dataTransfer.setData('noteId', noteId);
  };

  const handleDropOnNode = async (e, destType, destId, destSubjectId) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('noteId');
    if (!noteId) return;

    playSound('success', audioEnabled);

    // Prepare update parameters
    let topic_id = null;
    let subtopic_id = null;
    let subject_id = destSubjectId;

    if (destType === 'subtopic') {
      subtopic_id = destId;
      // Resolve topic & subject IDs
      for (let s of tree) {
        for (let t of s.topics) {
          if (t.subtopics.some(st => st.id === subtopic_id)) {
            subject_id = s.id;
            topic_id = t.id;
            break;
          }
        }
      }
    } else if (destType === 'topic') {
      topic_id = destId;
      subtopic_id = null; // direct note inside topic
      const sMatch = tree.find(s => s.topics.some(t => t.id === topic_id));
      subject_id = sMatch ? sMatch.id : null;
    }

    if (subject_id && topic_id) {
      // Put request directly to backend note update endpoint
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subject_id,
            topic_id,
            subtopic_id
          })
        });
        if (res.ok) {
          useNotesStore.getState().fetchTree();
          // Reload if this note is currently open
          if (activeNoteId === parseInt(noteId)) {
            useNotesStore.getState().fetchNote(noteId);
          }
        }
      } catch (err) {
        console.error('Drag drop update failed:', err);
      }
    }
  };

  // Import markdown file trigger
  const handleImportMarkdown = async (e, subjectId, topicId, subtopicId) => {
    const file = e.target.files[0];
    if (!file) return;

    playSound('success', audioEnabled);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId);
    formData.append('topic_id', topicId);
    if (subtopicId) {
      formData.append('subtopic_id', subtopicId);
    }

    try {
      const res = await fetch('/api/import-markdown', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        useNotesStore.getState().fetchTree();
        useNotesStore.getState().fetchNote(data.id);
      } else {
        alert('IMPORT FAILED // VERIFY FILE DATA');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Node deletion triggers
  const handleDeleteNode = (type, id, title) => {
    if (confirm(`DESTRUCT ${type.toUpperCase()}: "${title.toUpperCase()}" AND ALL SUB-SECTORS?`)) {
      playSound('delete', audioEnabled);
      if (type === 'subject') deleteSubject(id);
      if (type === 'topic') deleteTopic(id);
      if (type === 'subtopic') deleteSubtopic(id);
      if (type === 'note') deleteNote(id);
    }
  };

  return (
    <div className={`cyber-glass bg-[#080510]/85 border-r border-cyber-border/40 text-slate-300 transition-all duration-300 flex flex-col ${
      isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0'
    } h-full select-none print:hidden z-10`}>
      
      {/* Sidebar Top Title */}
      <div className="px-5 py-4 border-b border-cyber-border/40 bg-cyber-dark/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Database className="w-5 h-5 text-cyber-cyan animate-pulse" />
          <h2 className="font-cyber text-xs font-black tracking-widest text-white glow-text-cyan">
            NEURO_ARCHIVE //
          </h2>
        </div>
        <button
          onClick={() => { playSound('select', audioEnabled); toggleNode('subject-add'); setActiveInput({ type: 'subject', action: 'add' }); setInputValue(''); }}
          className="p-1 hover:text-cyber-cyan text-[#9a9db6] hover:bg-cyber-cyan/15 rounded transition-all border border-transparent hover:border-cyber-cyan/40"
          title="Add New Subject"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inline Input Creator widget */}
      {activeInput && (
        <form onSubmit={handleSubmitInput} className="p-4 border-b border-cyber-border/40 bg-cyber-dark/40 animate-pulse-glow">
          <div className="text-[9px] font-cyber text-cyber-purple mb-1">
            {activeInput.action.toUpperCase()}_{activeInput.type.toUpperCase()}:
          </div>
          <div className="flex space-x-1.5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeystroke}
              placeholder="ENTER TITLE..."
              className="flex-1 bg-cyber-dark/90 border border-cyber-cyan/40 hover:border-cyber-cyan outline-none text-xs text-white p-1.5 rounded font-mono focus:ring-0"
              autoFocus
            />
            <button type="submit" className="px-2.5 bg-cyber-cyan text-cyber-bg font-cyber text-[10px] tracking-wider rounded border border-cyber-cyan hover:bg-white hover:shadow-neon-cyan transition-all">
              EXEC
            </button>
            <button 
              type="button" 
              onClick={() => { playSound('select', audioEnabled); setActiveInput(null); }}
              className="px-2 bg-transparent border border-cyber-pink/40 text-cyber-pink hover:bg-cyber-pink/10 rounded transition-all text-xs"
            >
              X
            </button>
          </div>
        </form>
      )}

      {/* Directory Hierarchy Tree Panel */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {tree.length === 0 ? (
          <div className="text-center py-8 font-cyber text-[10px] text-gray-500 tracking-wider">
            CORE VAULT VACANT // ADD SUBJECT
          </div>
        ) : (
          tree.map((subject) => {
            const isSubExpanded = expandedNodes.has(`subject-${subject.id}`);
            return (
              <div key={subject.id} className="space-y-1">
                {/* Subject Header */}
                <div className="group flex items-center justify-between text-xs py-1 rounded hover:bg-cyber-cyan/5 transition-colors pl-1">
                  <div 
                    onClick={() => toggleNode(`subject-${subject.id}`)}
                    className="flex items-center space-x-1.5 cursor-pointer flex-1 text-white font-cyber tracking-wider"
                  >
                    {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5 text-cyber-cyan" /> : <ChevronRight className="w-3.5 h-3.5 text-cyber-border" />}
                    {isSubExpanded ? <FolderOpen className="w-3.5 h-3.5 text-cyber-cyan" /> : <Folder className="w-3.5 h-3.5 text-cyber-cyan" />}
                    <span className="font-bold">{subject.title.toUpperCase()}</span>
                  </div>
                  
                  {/* Subject Actions HUD */}
                  <div className="hidden group-hover:flex items-center space-x-1 pr-1.5">
                    <button 
                      onClick={() => { playSound('select', audioEnabled); setActiveInput({ type: 'topic', parentId: subject.id, action: 'add' }); setInputValue(''); }}
                      className="p-0.5 hover:text-cyber-cyan text-gray-500"
                      title="Add Topic"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => { playSound('select', audioEnabled); setActiveInput({ type: 'subject', id: subject.id, action: 'rename' }); setInputValue(subject.title); }}
                      className="p-0.5 hover:text-cyber-cyan text-gray-500"
                      title="Rename"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteNode('subject', subject.id, subject.title)}
                      className="p-0.5 hover:text-cyber-pink text-gray-500"
                      title="Delete"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Topics List */}
                {isSubExpanded && (
                  <div className="pl-4 border-l border-cyber-cyan/15 space-y-1 ml-2.5">
                    {subject.topics?.map((topic) => {
                      const isTopicExpanded = expandedNodes.has(`topic-${topic.id}`);
                      return (
                        <div key={topic.id} className="space-y-1">
                          
                          {/* Topic Line */}
                          <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropOnNode(e, 'topic', topic.id, subject.id)}
                            className="group flex items-center justify-between text-xs py-1 rounded hover:bg-cyber-purple/5 transition-colors pl-1"
                          >
                            <div 
                              onClick={() => toggleNode(`topic-${topic.id}`)}
                              className="flex items-center space-x-1.5 cursor-pointer flex-1 font-cyber tracking-wide text-slate-200"
                            >
                              {isTopicExpanded ? <ChevronDown className="w-3 h-3 text-cyber-purple" /> : <ChevronRight className="w-3 h-3 text-cyber-border" />}
                              <Folder className="w-3 h-3 text-cyber-purple" />
                              <span>{topic.title}</span>
                            </div>

                            {/* Topic Actions */}
                            <div className="hidden group-hover:flex items-center space-x-1 pr-1 text-gray-500">
                              {/* Import MD button */}
                              <label className="p-0.5 hover:text-cyber-cyan cursor-pointer" title="Import MD File">
                                <Import className="w-2.5 h-2.5" />
                                <input
                                  type="file"
                                  accept=".md"
                                  className="hidden"
                                  onChange={(e) => handleImportMarkdown(e, subject.id, topic.id, null)}
                                />
                              </label>
                              
                              <button 
                                onClick={() => { playSound('select', audioEnabled); setActiveInput({ type: 'subtopic', parentId: topic.id, action: 'add' }); setInputValue(''); }}
                                className="p-0.5 hover:text-cyber-cyan"
                                title="Add Subtopic"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => { playSound('select', audioEnabled); setActiveInput({ type: 'note', parentId: topic.id, level: 'topic', action: 'add' }); setInputValue(''); }}
                                className="p-0.5 hover:text-cyber-cyan"
                                title="Add Note"
                              >
                                <FileText className="w-2.5 h-2.5" />
                              </button>
                              <button 
                                onClick={() => { playSound('select', audioEnabled); setActiveInput({ type: 'topic', id: topic.id, action: 'rename' }); setInputValue(topic.title); }}
                                className="p-0.5 hover:text-cyber-cyan"
                                title="Rename"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteNode('topic', topic.id, topic.title)}
                                className="p-0.5 hover:text-cyber-pink"
                                title="Delete"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          {/* Subtopics and Notes List under Topic */}
                          {isTopicExpanded && (
                            <div className="pl-4 border-l border-cyber-purple/20 space-y-1 ml-2">
                              
                              {/* Subtopics */}
                              {topic.subtopics?.map((subtopic) => {
                                const isSubtopicExpanded = expandedNodes.has(`subtopic-${subtopic.id}`);
                                return (
                                  <div key={subtopic.id} className="space-y-1">
                                    <div 
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => handleDropOnNode(e, 'subtopic', subtopic.id, subject.id)}
                                      className="group flex items-center justify-between text-xs py-0.5 rounded hover:bg-cyber-pink/5 transition-colors pl-1"
                                    >
                                      <div 
                                        onClick={() => toggleNode(`subtopic-${subtopic.id}`)}
                                        className="flex items-center space-x-1.5 cursor-pointer flex-1 font-cyber text-slate-300 text-[11px]"
                                      >
                                        {isSubtopicExpanded ? <ChevronDown className="w-2.5 h-2.5 text-cyber-pink" /> : <ChevronRight className="w-2.5 h-2.5 text-cyber-border" />}
                                        <Folder className="w-3 h-3 text-cyber-pink" />
                                        <span>{subtopic.title}</span>
                                      </div>

                                      {/* Subtopic Actions */}
                                      <div className="hidden group-hover:flex items-center space-x-1 pr-1 text-gray-500">
                                        <label className="p-0.5 hover:text-cyber-cyan cursor-pointer" title="Import MD File">
                                          <Import className="w-2.5 h-2.5" />
                                          <input
                                            type="file"
                                            accept=".md"
                                            className="hidden"
                                            onChange={(e) => handleImportMarkdown(e, subject.id, topic.id, subtopic.id)}
                                          />
                                        </label>
                                        
                                        <button 
                                          onClick={() => { playSound('select', audioEnabled); setActiveInput({ type: 'note', parentId: subtopic.id, level: 'subtopic', action: 'add' }); setInputValue(''); }}
                                          className="p-0.5 hover:text-cyber-cyan"
                                          title="Add Note"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                        <button 
                                          onClick={() => { playSound('select', audioEnabled); setActiveInput({ type: 'subtopic', id: subtopic.id, action: 'rename' }); setInputValue(subtopic.title); }}
                                          className="p-0.5 hover:text-cyber-cyan"
                                          title="Rename"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteNode('subtopic', subtopic.id, subtopic.title)}
                                          className="p-0.5 hover:text-cyber-pink"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Notes under Subtopic */}
                                    {isSubtopicExpanded && (
                                      <div className="pl-4 border-l border-cyber-pink/20 space-y-0.5 ml-1.5">
                                        {subtopic.notes?.map((note) => (
                                          <div
                                            key={note.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, note.id)}
                                            onClick={() => handleSelectNote(note.id)}
                                            className={`group flex items-center justify-between text-xs py-1 px-2 rounded cursor-pointer transition-all border ${
                                              activeNoteId === note.id 
                                                ? 'bg-cyber-cyan/10 border-cyber-cyan text-white shadow-neon-cyan' 
                                                : 'border-transparent text-slate-400 hover:text-white hover:bg-cyber-cyan/5'
                                            }`}
                                          >
                                            <div className="flex items-center space-x-1.5 truncate">
                                              <FileText className={`w-3 h-3 ${activeNoteId === note.id ? 'text-cyber-cyan animate-pulse' : 'text-gray-500'}`} />
                                              <span className="truncate font-mono text-[11px]">{note.title}</span>
                                            </div>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeleteNode('note', note.id, note.title); }}
                                              className="hidden group-hover:block text-gray-500 hover:text-cyber-pink"
                                              title="Delete Note"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Direct Notes under Topic */}
                              {topic.notes?.map((note) => (
                                <div
                                  key={note.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, note.id)}
                                  onClick={() => handleSelectNote(note.id)}
                                  className={`group flex items-center justify-between text-xs py-1 px-2 rounded cursor-pointer transition-all border ${
                                    activeNoteId === note.id 
                                      ? 'bg-cyber-cyan/10 border-cyber-cyan text-white shadow-neon-cyan' 
                                      : 'border-transparent text-slate-400 hover:text-white hover:bg-cyber-cyan/5'
                                  }`}
                                >
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <FileText className={`w-3 h-3 ${activeNoteId === note.id ? 'text-cyber-cyan animate-pulse' : 'text-gray-500'}`} />
                                    <span className="truncate font-mono text-[11px]">{note.title}</span>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteNode('note', note.id, note.title); }}
                                    className="hidden group-hover:block text-gray-500 hover:text-cyber-pink"
                                    title="Delete Note"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Bottom HUD status indicators */}
      <div className="p-4 border-t border-cyber-border/40 bg-cyber-dark/60 flex flex-col space-y-2.5 select-none">
        
        {/* HUD control hotkeys */}
        <div className="flex justify-between items-center text-[10px] font-cyber text-gray-400">
          <button 
            onClick={() => { playSound('select', audioEnabled); onShowShortcuts(); }}
            className="flex items-center space-x-1 hover:text-cyber-pink transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5 text-cyber-purple" />
            <span>KEY_MAP</span>
          </button>
          
          <button 
            onClick={() => { playSound('select', audioEnabled); onShowHistory(); }}
            className="flex items-center space-x-1 hover:text-cyber-cyan transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>REVISIONS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
