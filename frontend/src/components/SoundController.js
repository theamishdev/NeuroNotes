let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
};

export const playSound = (type = 'click', enabled = true) => {
  if (!enabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'typewriter') {
      // keystroke sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500 + Math.random() * 300, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'hover') {
      // low mechanical tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } else if (type === 'select') {
      // clean sci-fi click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
      // pleasant double rising chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
      
      setTimeout(() => {
        if (!enabled) return;
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1100, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.03, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.3);
        } catch (err) {}
      }, 70);
    } else if (type === 'delete') {
      // descending warning sweep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.25);
      
      gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.26);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);
    }
  } catch (e) {
    // Blocked browser audio contexts resolve gracefully
    console.warn('Audio Synthesis block:', e);
  }
};
