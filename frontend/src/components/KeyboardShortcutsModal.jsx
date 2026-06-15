import React from 'react';
import { useNotesStore } from '../store/notesStore';
import { playSound } from './SoundController';
import { X, Keyboard, HelpCircle } from 'lucide-react';

export const KeyboardShortcutsModal = ({ onClose }) => {
  const { audioEnabled } = useNotesStore();

  const shortcuts = [
    { keys: ['CTRL', 'K'], desc: 'Open global search query palette' },
    { keys: ['CTRL', 'B'], desc: 'Toggle navigation tree sidebar' },
    { keys: ['CTRL', 'D'], desc: 'Toggle full-width distraction-free reader' },
    { keys: ['CTRL', 'N'], desc: 'Quick add note under active branch' },
    { keys: ['ESC'], desc: 'Close modals / Return from full-screen reader' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-flicker">
      <div className="w-full max-w-md cyber-glass bg-cyber-dark/95 border-cyber-pink/50 text-[#c3c7db] overflow-hidden rounded-lg shadow-neon-pink flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-cyber-pink/30 bg-cyber-dark">
          <div className="flex items-center space-x-2 font-cyber text-cyber-pink glow-text-pink">
            <Keyboard className="w-5 h-5 animate-pulse" />
            <span className="tracking-wider">COMMAND MAP // SECURE_INPUTS</span>
          </div>
          <button 
            onClick={() => { playSound('select', audioEnabled); onClose(); }}
            className="text-gray-400 hover:text-cyber-cyan transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6 space-y-4">
          {shortcuts.map((sh, index) => (
            <div key={index} className="flex justify-between items-center py-1.5 border-b border-cyber-border/10 font-mono text-xs">
              <span className="text-[#a0a3bd]">{sh.desc}</span>
              <div className="flex items-center space-x-1">
                {sh.keys.map((k, kIdx) => (
                  <span 
                    key={kIdx} 
                    className="px-2 py-0.5 rounded bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-cyan font-bold tracking-tight text-[10px] shadow-[0_0_4px_rgba(189,0,255,0.3)]"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyber-border/40 bg-cyber-dark flex justify-between items-center text-[10px] font-cyber text-gray-400">
          <span className="flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-cyber-cyan" />
            <span>VAULT ENGINE V1.0.0</span>
          </span>
          <span>READY</span>
        </div>
      </div>
    </div>
  );
};
export default KeyboardShortcutsModal;
