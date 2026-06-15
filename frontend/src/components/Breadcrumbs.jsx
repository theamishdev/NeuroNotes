import React from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { ChevronRight, Database, Folder, Bookmark } from 'lucide-react';

export const Breadcrumbs = () => {
  const { tree, activeNote, audioEnabled, fetchNote } = useNotesStore();

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
  let topic = null;
  let subtopic = null;

  if (subject) {
    subjectName = subject.title;
    topic = subject.topics?.find(t => t.id === activeNote.topic_id);
    if (topic) {
      topicName = topic.title;
      subtopic = topic.subtopics?.find(st => st.id === activeNote.subtopic_id);
      if (subtopic) {
        subtopicName = subtopic.title;
      }
    }
  }

  const handleHover = () => {
    playSound('hover', audioEnabled);
  };

  const normalizeText = (str) => {
    return str ? str.toLowerCase().replace(/[\s_-]/g, '') : '';
  };

  const titleMatches = (a, b) => {
    return normalizeText(a) === normalizeText(b);
  };

  const handleSubjectClick = () => {
    if (!subject) return;
    playSound('select', audioEnabled);
    
    // Find note matching subject title
    let targetNote = null;
    const searchNote = (notes) => {
      return notes?.find(n => titleMatches(n.title, subject.title));
    };

    for (const t of (subject.topics || [])) {
      const match = searchNote(t.notes);
      if (match) { targetNote = match; break; }
      for (const st of (t.subtopics || [])) {
        const subMatch = searchNote(st.notes);
        if (subMatch) { targetNote = subMatch; break; }
      }
      if (targetNote) break;
    }

    if (!targetNote) {
      for (const t of (subject.topics || [])) {
        if (t.notes && t.notes.length > 0) {
          targetNote = t.notes[0];
          break;
        }
        for (const st of (t.subtopics || [])) {
          if (st.notes && st.notes.length > 0) {
            targetNote = st.notes[0];
            break;
          }
        }
        if (targetNote) break;
      }
    }

    if (targetNote) {
      fetchNote(targetNote.id);
    }
  };

  const handleTopicClick = () => {
    if (!topic) return;
    playSound('select', audioEnabled);

    // Find note matching topic title
    let targetNote = topic.notes?.find(n => titleMatches(n.title, topic.title));

    if (!targetNote) {
      for (const st of (topic.subtopics || [])) {
        const match = st.notes?.find(n => titleMatches(n.title, topic.title));
        if (match) { targetNote = match; break; }
      }
    }

    if (!targetNote) {
      if (topic.notes && topic.notes.length > 0) {
        targetNote = topic.notes[0];
      } else {
        for (const st of (topic.subtopics || [])) {
          if (st.notes && st.notes.length > 0) {
            targetNote = st.notes[0];
            break;
          }
        }
      }
    }

    if (targetNote) {
      fetchNote(targetNote.id);
    }
  };

  const handleSubtopicClick = () => {
    if (!subtopic) return;
    playSound('select', audioEnabled);

    // Find note matching subtopic title
    let targetNote = subtopic.notes?.find(n => titleMatches(n.title, subtopic.title));

    if (!targetNote && subtopic.notes && subtopic.notes.length > 0) {
      targetNote = subtopic.notes[0];
    }

    if (targetNote) {
      fetchNote(targetNote.id);
    }
  };

  return (
    <nav className="flex flex-wrap items-center gap-1.5 py-3 px-4 font-cyber text-xs tracking-widest text-[#a8aabd] border-b border-cyber-border/40 bg-cyber-dark/40">
      <div 
        onClick={() => {
          playSound('select', audioEnabled);
          useNotesStore.setState({ activeNote: null, activeNoteId: null });
        }}
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
            onClick={handleSubjectClick}
            className="flex items-center space-x-1 cursor-pointer hover:text-cyber-cyan transition-colors"
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
            onClick={handleTopicClick}
            className="flex items-center space-x-1 cursor-pointer hover:text-cyber-cyan transition-colors"
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
            onClick={handleSubtopicClick}
            className="flex items-center space-x-1 cursor-pointer hover:text-cyber-cyan transition-colors"
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
