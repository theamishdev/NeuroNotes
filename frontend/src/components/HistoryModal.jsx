import React, { useState, useEffect } from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { X, History, RotateCcw, AlertTriangle, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export const HistoryModal = ({ onClose }) => {
  const { activeNoteId, activeNote, restoreVersion, audioEnabled } = useNotesStore();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState('');
  const [selectedVerId, setSelectedVerId] = useState(null);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!activeNoteId) return;
      try {
        const res = await fetch(`/api/notes/${activeNoteId}/versions`);
        if (res.ok) {
          const data = await res.json();
          setVersions(data);
          if (data.length > 0) {
            // Auto preview latest version in list
            handleSelectVersion(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching versions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [activeNoteId]);

  const handleSelectVersion = async (versionId) => {
    playSound('select', audioEnabled);
    setSelectedVerId(versionId);
    try {
      const res = await fetch(`/api/notes/${activeNoteId}/versions/${versionId}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewContent(data.content);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (versionId) => {
    playSound('success', audioEnabled);
    await restoreVersion(activeNoteId, versionId);
    
    // trigger cyber success confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00f0ff', '#ff007f', '#bd00ff']
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-flicker">
      <div className="w-full max-w-4xl cyber-glass bg-cyber-dark/95 border-cyber-cyan/50 text-[#c3c7db] overflow-hidden rounded-lg shadow-neon-cyan flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-cyber-cyan/30 bg-cyber-dark">
          <div className="flex items-center space-x-2 font-cyber text-cyber-cyan glow-text-cyan">
            <History className="w-5 h-5" />
            <span className="tracking-wider">REVISION TIMELINE // NOTE: {activeNote?.title.toUpperCase()}</span>
          </div>
          <button 
            onClick={() => { playSound('select', audioEnabled); onClose(); }}
            className="text-gray-400 hover:text-cyber-pink transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-cyber-cyan">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-cyan mb-4" />
            <span className="font-cyber text-xs tracking-widest animate-pulse">DECRYPTING HISTORY VAULT...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar: list of revisions */}
            <div className="w-1/3 border-r border-cyber-border/40 overflow-y-auto bg-cyber-dark/30">
              {versions.length === 0 ? (
                <div className="p-6 text-center text-gray-500 font-mono text-sm">
                  NO BACKUPS COMMITTED
                </div>
              ) : (
                <div className="divide-y divide-cyber-border/20">
                  {versions.map((ver, index) => (
                    <div
                      key={ver.id}
                      onClick={() => handleSelectVersion(ver.id)}
                      className={`p-4 cursor-pointer transition-all hover:bg-cyber-purple/10 flex flex-col space-y-1.5 ${
                        selectedVerId === ver.id ? 'bg-cyber-cyan/10 border-l-4 border-cyber-cyan' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-cyber">
                        <span className={selectedVerId === ver.id ? 'text-cyber-cyan font-bold' : 'text-gray-400'}>
                          REV #{versions.length - index}
                        </span>
                        <span className="text-cyber-pink font-mono text-[10px]">
                          {ver.length} BYTES
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-300">
                        {new Date(ver.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right pane: preview content */}
            <div className="w-2/3 flex flex-col h-full bg-cyber-dark/10">
              {selectedVerId ? (
                <>
                  <div className="flex items-center justify-between px-6 py-2 border-b border-cyber-border/20 bg-cyber-dark/30">
                    <span className="text-xs font-cyber text-cyber-purple flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>SNAPSHOT PREVIEW</span>
                    </span>
                    <button
                      onClick={() => handleRestore(selectedVerId)}
                      className="flex items-center space-x-1.5 px-3 py-1 font-cyber text-[10px] tracking-wider text-cyber-bg bg-cyber-cyan hover:bg-white border border-cyber-cyan hover:shadow-neon-cyan transition-all rounded"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESTORE DRAFT</span>
                    </button>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-[#a0a5b8] bg-[#07050d] select-text">
                    <pre className="whitespace-pre-wrap leading-relaxed">{previewContent}</pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500 text-sm font-cyber">
                  <AlertTriangle className="w-8 h-8 text-cyber-pink mb-2 animate-pulse" />
                  <span>SELECT ARCHIVE STREAM FOR PREVIEW</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyber-border/40 bg-cyber-dark flex justify-between items-center text-[10px] font-cyber text-gray-400">
          <span>HOST: VAULT_SECURE_REVISION_MGR</span>
          <span>SYSTEM TIME: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
export default HistoryModal;
