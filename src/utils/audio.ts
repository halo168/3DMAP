/**
 * Web Audio API procedural sound synthesizer for stamp thud and celebrations.
 * 100% zero-dependency, works offline without external audio files.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Procedural Wooden Seal Impact Sound (木印章重磅蓋下音效)
 * Combines low-frequency wood body thud, crisp surface slap, and rich acoustic resonance.
 */
export function playStampSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Heavy Wooden Sub-Thud (重擊下壓聲)
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);

    gainNode.gain.setValueAtTime(0.85, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);

    // 2. High-frequency Slap / Seal Paper Contact (印面與紙張瞬間拍打聲)
    const bufferSize = ctx.sampleRate * 0.04;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);

    // 3. Wood Cavity Resonance (木槌回彈空腔共鳴)
    const resOsc = ctx.createOscillator();
    const resGain = ctx.createGain();
    resOsc.type = 'sine';
    resOsc.frequency.setValueAtTime(420, now);
    resOsc.frequency.exponentialRampToValueAtTime(260, now + 0.22);

    resGain.gain.setValueAtTime(0.35, now);
    resGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    resOsc.connect(resGain);
    resGain.connect(ctx.destination);

    resOsc.start(now);
    resOsc.stop(now + 0.26);

    // 4. Subtle Victory Bell Tone (清脆喜悅餘音)
    setTimeout(() => {
      try {
        const bellCtx = getAudioContext();
        if (!bellCtx) return;
        const bNow = bellCtx.currentTime;
        const bell = bellCtx.createOscillator();
        const bellGain = bellCtx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(880, bNow); // A5
        bellGain.gain.setValueAtTime(0.12, bNow);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, bNow + 0.35);

        bell.connect(bellGain);
        bellGain.connect(bellCtx.destination);
        bell.start(bNow);
        bell.stop(bNow + 0.36);
      } catch {
        // ignore
      }
    }, 70);
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

/**
 * Subtle tactile UI click sound
 */
export function playUiClick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // ignore
  }
}
