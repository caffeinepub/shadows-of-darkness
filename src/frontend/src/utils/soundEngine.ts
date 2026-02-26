// Web Audio API based procedural sound engine
// Generates game sounds programmatically

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3,
  gainEnvelope?: { attack: number; decay: number; sustain: number; release: number }
) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    const env = gainEnvelope ?? { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.3 };
    const now = ctx.currentTime;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + env.attack);
    gainNode.gain.linearRampToValueAtTime(volume * env.sustain, now + env.attack + env.decay);
    gainNode.gain.setValueAtTime(volume * env.sustain, now + duration - env.release);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (e) {
    // Audio context may be blocked
  }
}

function playChord(frequencies: number[], duration: number, type: OscillatorType = "sine", volume = 0.15) {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration, type, volume), i * 50);
  });
}

export const SoundEngine = {
  cardDraw: () => {
    playTone(800, 0.15, "sine", 0.2, { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.1 });
    setTimeout(() => playTone(1200, 0.1, "sine", 0.15), 80);
  },

  cardFlip: () => {
    playTone(600, 0.12, "triangle", 0.2);
  },

  monsterSummon: () => {
    // Dramatic ascending chord
    playChord([220, 277, 330, 440], 0.6, "sine", 0.2);
    setTimeout(() => playChord([330, 415, 494, 660], 0.8, "sine", 0.25), 200);
    setTimeout(() => playTone(880, 0.4, "sine", 0.3, { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.25 }), 500);
  },

  spellActivate: () => {
    // Mystical shimmer
    playTone(1200, 0.3, "sine", 0.2);
    setTimeout(() => playTone(800, 0.3, "sine", 0.15), 100);
    setTimeout(() => playTone(1600, 0.3, "sine", 0.1), 200);
  },

  trapActivate: () => {
    // Dramatic snap
    playTone(200, 0.1, "sawtooth", 0.3, { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.05 });
    setTimeout(() => playTone(400, 0.3, "triangle", 0.2), 100);
  },

  attack: () => {
    // Impact sound
    playTone(100, 0.2, "sawtooth", 0.4, { attack: 0.001, decay: 0.05, sustain: 0.3, release: 0.15 });
    setTimeout(() => playTone(50, 0.3, "sine", 0.35, { attack: 0.001, decay: 0.1, sustain: 0.4, release: 0.2 }), 50);
  },

  damage: () => {
    playTone(150, 0.4, "sawtooth", 0.3, { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.2 });
  },

  victory: () => {
    // Triumphant fanfare
    const notes = [
      { freq: 523, delay: 0 },
      { freq: 659, delay: 150 },
      { freq: 784, delay: 300 },
      { freq: 1047, delay: 450 },
      { freq: 1319, delay: 600 },
    ];
    notes.forEach(({ freq, delay }) => {
      setTimeout(() => playTone(freq, 0.4, "sine", 0.25), delay);
    });
    setTimeout(() => playChord([523, 659, 784, 1047], 1.5, "sine", 0.2), 800);
  },

  defeat: () => {
    // Low rumble
    playTone(80, 1.5, "sawtooth", 0.35, { attack: 0.1, decay: 0.5, sustain: 0.3, release: 0.6 });
    setTimeout(() => playTone(60, 1.2, "sine", 0.3, { attack: 0.1, decay: 0.4, sustain: 0.2, release: 0.5 }), 200);
  },

  packOpen: () => {
    // Crackling tear sound
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(1000 + Math.random() * 2000, 0.05, "sawtooth", 0.15);
      }, i * 60);
    }
  },

  rarityReveal: (rarity: number) => {
    // Higher rarity = more dramatic
    const intensity = Math.min(rarity / 200, 1);
    const baseFreq = 200 + intensity * 600;
    playTone(baseFreq, 0.5 + intensity * 0.5, "sine", 0.2 + intensity * 0.2);
    setTimeout(() => playTone(baseFreq * 1.5, 0.4, "sine", 0.15 + intensity * 0.15), 200);
    if (intensity > 0.5) {
      setTimeout(() => playChord([baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2], 0.8, "sine", 0.15), 400);
    }
  },

  buttonClick: () => {
    playTone(800, 0.05, "sine", 0.1, { attack: 0.001, decay: 0.02, sustain: 0.1, release: 0.03 });
  },

  navigation: () => {
    playTone(600, 0.08, "triangle", 0.1);
  },

  playCustomSound: async (blob: { getBytes: () => Promise<Uint8Array> }) => {
    try {
      const ctx = getAudioContext();
      const bytes = await blob.getBytes();
      const buffer = await ctx.decodeAudioData(bytes.buffer as ArrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn("Failed to play custom sound:", e);
    }
  },
};

export default SoundEngine;
