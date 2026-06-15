import React from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { ChevronRight, Database, Folder, Bookmark } from 'lucide-react';

export const Breadcrumbs = () => {
  const { tree, activeNote, audioEnabled } = useNotesStore();

  if (!activeNote) {
    return (
      <div className="flex items-center space-x-2 font-cyber text-xs tracking-wider text-cyber-cyan glow-text-cyan py-3 px-4">
        <Database className="w-4 h-4 animate-pulse" />
        <span>SYS.STATUS: SECURE_CORE_VAULT_ACTIVE // NO_ACTIVE_STREAM</span>
      </div>
    );
  }

  // Traverse tree to resolve names
  let subjectName = '';
  let topicName = '';
  let subtopicName = '';

  const subject = tree.find(s => s.id === activeNote.subject_id);
  if (subject) {
    subjectName = subject.title;
    const topic = subject.topics?.find(t => t.id === activeNote.topic_id);
    if (topic) {
      topicName = topic.title;
      const subtopic = topic.subtopics?.find(st => st.id === activeNote.subtopic_id);
      if (subtopic) {
        subtopicName = subtopic.title;
      }
    }
  }

  const handleHover = () => {
    playSound('hover', audioEnabled);
  };

  return (
    <nav className="flex flex-wrap items-center gap-1.5 py-3 px-4 font-cyber text-xs tracking-widest text-[#a8aabd] border-b border-cyber-border/40 bg-cyber-dark/40">
      <div 
        className="flex items-center space-x-1 cursor-pointer hover:text-cyber-cyan transition-colors"
        onMouseEnter={handleHover}
      >
        <Database className="w-3.5 h-3.5 text-cyber-purple" />
        <span className="hidden sm:inline">VAULT</span>
      </div>
      
      {subjectName && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-cyber-border" />
          <div 
            className="flex items-center space-x-1 cursor-default hover:text-white transition-colors"
            onMouseEnter={handleHover}
          >
            <Folder className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>{subjectName.toUpperCase()}</span>
          </div>
        </>
      )}

      {topicName && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-cyber-border" />
          <div 
            className="flex items-center space-x-1 cursor-default hover:text-white transition-colors"
            onMouseEnter={handleHover}
          >
            <Folder className="w-3.5 h-3.5 text-cyber-purple" />
            <span>{topicName.toUpperCase()}</span>
          </div>
        </>
      )}

      {subtopicName && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-cyber-border" />
          <div 
            className="flex items-center space-x-1 cursor-default hover:text-white transition-colors"
            onMouseEnter={handleHover}
          >
            <Folder className="w-3.5 h-3.5 text-cyber-pink" />
            <span>{subtopicName.toUpperCase()}</span>
          </div>
        </>
      )}

      <ChevronRight className="w-3.5 h-3.5 text-cyber-border" />
      <div className="flex items-center space-x-1 text-cyber-cyan font-bold glow-text-cyan">
        <Bookmark className="w-3.5 h-3.5 text-cyber-pink" />
        <span>{activeNote.title.toUpperCase()}</span>
      </div>
    </nav>
  );
};
export default Breadcrumbs;
