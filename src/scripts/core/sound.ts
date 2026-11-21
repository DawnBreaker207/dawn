// ---------------------------------------------------------------------------
// Unified Audio Engine & Mechanical Keyboard Sound Synthesizer
// ---------------------------------------------------------------------------
let masterAudioCtx: AudioContext | null = null;

export function getDawnAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!masterAudioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      masterAudioCtx = new Ctx();
    }
  }
  if (masterAudioCtx && masterAudioCtx.state === 'suspended') {
    masterAudioCtx.resume().catch(() => {});
  }
  return masterAudioCtx;
}

// Global user gesture unlocker to ensure browser audio pipeline is always ready
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getDawnAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true });
  });
}

// Backward-compatibility alias
export const getKeyAudioContext = getDawnAudioContext;

export type SoundProfile = 'thock' | 'clicky' | 'tactile' | 'cream';
let currentSoundProfile: SoundProfile = 'thock';

/**
 * High-End Mechanical Switch Sound Synthesizer
 * Key types: normal, space, enter, backspace, modifier (Shift/Ctrl/Alt/Tab/CapsLock), function (F1-F12), arrow
 * Sound profiles: thock (lubed linear), clicky (Blue switch), tactile (Brown switch), cream (deep POM linear)
 */
export function playKeystrokeSound(keyOrSpecial: string | boolean = false): void {
  try {
    const ctx = getDawnAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const profile = currentSoundProfile;

    // --- Determine key type ---
    let keyType: 'normal' | 'space' | 'enter' | 'backspace' | 'modifier' | 'function' | 'arrow' = 'normal';
    if (typeof keyOrSpecial === 'string') {
      const k = keyOrSpecial.toLowerCase();
      if (k === ' ' || k === 'space' || k === 'spacebar') keyType = 'space';
      else if (k === 'enter') keyType = 'enter';
      else if (k === 'backspace' || k === 'delete') keyType = 'backspace';
      else if (['shift', 'control', 'alt', 'meta', 'capslock', 'tab'].includes(k)) keyType = 'modifier';
      else if (/^f\d{1,2}$/.test(k)) keyType = 'function';
      else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) keyType = 'arrow';
    } else if (keyOrSpecial === true) {
      keyType = 'space';
    }

    // --- Base acoustic parameters by key type ---
    let fCavity: number, fBottom: number, fSnap: number, snapGain: number, thockGain: number, decay: number;

    switch (keyType) {
      case 'space':
        fCavity = 195; fBottom = 110; fSnap = 2200; snapGain = 0.22; thockGain = 0.46; decay = 0.075; break;
      case 'enter':
        fCavity = 240; fBottom = 135; fSnap = 2600; snapGain = 0.20; thockGain = 0.40; decay = 0.065; break;
      case 'backspace':
        fCavity = 270; fBottom = 150; fSnap = 2800; snapGain = 0.19; thockGain = 0.38; decay = 0.060; break;
      case 'modifier':
        fCavity = 290; fBottom = 160; fSnap = 3000; snapGain = 0.17; thockGain = 0.34; decay = 0.055; break;
      case 'function':
        fCavity = 360; fBottom = 195; fSnap = 3600; snapGain = 0.14; thockGain = 0.28; decay = 0.045; break;
      case 'arrow':
        fCavity = 330; fBottom = 180; fSnap = 3300; snapGain = 0.15; thockGain = 0.30; decay = 0.048; break;
      case 'normal':
      default:
        fCavity = 310; fBottom = 170; fSnap = 3200; snapGain = 0.16; thockGain = 0.32; decay = 0.050; break;
    }

    // Natural human variance: ±4% frequency, ±8% amplitude
    const pitchJitter = 0.96 + Math.random() * 0.08;
    const gainJitter = 0.92 + Math.random() * 0.16;
    fCavity *= pitchJitter;
    fBottom *= pitchJitter;
    snapGain *= gainJitter;
    thockGain *= gainJitter;

    // --- Apply sound profile multipliers on top of key-type base ---
    let popGain = 0;
    let clickGain = 0;
    let clickFreq = 0;

    switch (profile) {
      case 'clicky':
        fCavity *= 1.25; fBottom *= 1.25; fSnap = 5200; snapGain *= 0.85; thockGain *= 0.55;
        clickGain = 0.38 * gainJitter; clickFreq = 4800 * pitchJitter; decay *= 0.70;
        break;
      case 'tactile':
        fCavity *= 1.05; fBottom *= 1.05; fSnap = 3800; snapGain *= 1.15; thockGain *= 0.85;
        clickGain = 0.12 * gainJitter; clickFreq = 3400 * pitchJitter; decay *= 0.85;
        break;
      case 'cream':
        fCavity *= 0.90; fBottom *= 0.88; fSnap = 2400; snapGain *= 0.70; thockGain *= 1.30;
        popGain = 0.18 * gainJitter; decay *= 1.20;
        break;
      case 'thock':
      default:
        fCavity *= 0.95; fBottom *= 0.92; snapGain *= 0.85; thockGain *= 1.15;
        popGain = 0.10 * gainJitter; decay *= 1.05;
        break;
    }

    // Layer 1: Stem Strike High-Frequency Snap
    const snapOsc = ctx.createOscillator();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(fSnap, now);
    snapOsc.frequency.exponentialRampToValueAtTime(fSnap * 0.3, now + 0.007);

    const snapGainNode = ctx.createGain();
    snapGainNode.gain.setValueAtTime(snapGain, now);
    snapGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

    snapOsc.connect(snapGainNode);
    snapGainNode.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.010);

    // Layer 2: Click Leaf (Clicky / Tactile switches only)
    if (clickGain > 0 && clickFreq > 0) {
      const clickOsc = ctx.createOscillator();
      clickOsc.type = profile === 'clicky' ? 'square' : 'triangle';
      clickOsc.frequency.setValueAtTime(clickFreq, now + 0.003);
      clickOsc.frequency.exponentialRampToValueAtTime(clickFreq * 0.6, now + 0.008);

      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(clickFreq, now + 0.003);
      clickFilter.Q.setValueAtTime(profile === 'clicky' ? 6.0 : 3.0, now + 0.003);

      const clickGainNode = ctx.createGain();
      clickGainNode.gain.setValueAtTime(0.001, now);
      clickGainNode.gain.setValueAtTime(clickGain, now + 0.003);
      clickGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGainNode);
      clickGainNode.connect(ctx.destination);
      clickOsc.start(now + 0.003);
      clickOsc.stop(now + 0.014);
    }

    // Layer 3: Main Bottom-Out Thock
    const thockOsc = ctx.createOscillator();
    thockOsc.type = 'sine';
    thockOsc.frequency.setValueAtTime(fCavity, now);
    thockOsc.frequency.exponentialRampToValueAtTime(fBottom, now + decay);

    const thockFilter = ctx.createBiquadFilter();
    thockFilter.type = 'lowpass';
    thockFilter.frequency.setValueAtTime(fCavity * 1.8, now);
    thockFilter.frequency.exponentialRampToValueAtTime(fBottom * 1.2, now + decay);

    const thockGainNode = ctx.createGain();
    thockGainNode.gain.setValueAtTime(thockGain, now);
    thockGainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);

    thockOsc.connect(thockFilter);
    thockFilter.connect(thockGainNode);
    thockGainNode.connect(ctx.destination);
    thockOsc.start(now);
    thockOsc.stop(now + decay + 0.005);

    // Layer 4: Switch Housing Pop
    if (popGain > 0) {
      const popOsc = ctx.createOscillator();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(fCavity * 1.5, now);
      popOsc.frequency.exponentialRampToValueAtTime(fCavity * 0.7, now + decay * 0.6);

      const popGainNode = ctx.createGain();
      popGainNode.gain.setValueAtTime(popGain, now);
      popGainNode.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.6);

      popOsc.connect(popGainNode);
      popGainNode.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + decay * 0.65);
    }

    // Layer 5: Keycap Upstroke Return Clack
    const upTime = now + 0.055 + Math.random() * 0.015;
    const upBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.008), ctx.sampleRate);
    const upData = upBuffer.getChannelData(0);
    for (let i = 0; i < upData.length; i++) {
      upData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.002));
    }
    const upNode = ctx.createBufferSource();
    upNode.buffer = upBuffer;
    const upFilter = ctx.createBiquadFilter();
    upFilter.type = 'bandpass';
    upFilter.frequency.setValueAtTime(fSnap * 1.1, upTime);
    upFilter.Q.setValueAtTime(2.0, upTime);
    const upGainNode = ctx.createGain();
    upGainNode.gain.setValueAtTime(snapGain * 0.4, upTime);
    upGainNode.gain.exponentialRampToValueAtTime(0.001, upTime + 0.005);
    upNode.connect(upFilter);
    upFilter.connect(upGainNode);
    upGainNode.connect(ctx.destination);
    upNode.start(upTime);
  } catch {}
}

/**
 * Tactile Switch Click for UI Buttons
 */
export function playTactileButtonClick(): void {
  try {
    const ctx = getDawnAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.022);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  } catch {}
}

export const SOUND_CYCLE = ['off', 'thock', 'clicky', 'tactile', 'cream'] as const;
export type ProfileState = typeof SOUND_CYCLE[number];

export const PROFILE_LABEL: Record<ProfileState, string> = {
  off:     'sound: off',
  thock:   'sound: thock',
  clicky:  'sound: clicky',
  tactile: 'sound: tactile',
  cream:   'sound: cream',
};

export function getStoredProfile(): ProfileState {
  const legacy = localStorage.getItem('dawn_thock_sound');
  if (legacy !== null) {
    const migrated: ProfileState = legacy === 'true' ? 'thock' : 'off';
    localStorage.removeItem('dawn_thock_sound');
    localStorage.setItem('dawn_sound_profile', migrated);
    return migrated;
  }
  return (localStorage.getItem('dawn_sound_profile') as ProfileState | null) ?? 'off';
}

export function setupMechanicalKeyboardSound(): void {
  const btn = document.getElementById('btn-keyboard-sound');
  const label = document.getElementById('keyboard-sound-label');

  const getProfile = (): ProfileState => getStoredProfile();

  const updateUI = () => {
    const p = getProfile();
    if (label) label.textContent = PROFILE_LABEL[p] ?? 'sound: off';
    const on = p !== 'off';
    if (btn) {
      btn.classList.toggle('text-(--accent)', on);
      btn.classList.toggle('text-(--fg-faint)', !on);
    }
    currentSoundProfile = on ? (p as SoundProfile) : 'thock';
  };

  updateUI();

  if (btn) {
    btn.onclick = (e) => {
      e.preventDefault();
      const ctx = getDawnAudioContext();
      if (ctx?.state === 'suspended') ctx.resume().catch(() => {});

      const cur = getProfile();
      const idx = SOUND_CYCLE.indexOf(cur);
      const next = SOUND_CYCLE[(idx + 1) % SOUND_CYCLE.length];
      localStorage.setItem('dawn_sound_profile', next);
      updateUI();

      if (next !== 'off') {
        playKeystrokeSound('a');
        setTimeout(() => playKeystrokeSound('space'), 90);
      } else {
        playTactileButtonClick();
      }
    };
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (getProfile() === 'off') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    playKeystrokeSound(e.key);
  };

  window.removeEventListener('keydown', (window as any).__dawn_thock_listener);
  (window as any).__dawn_thock_listener = handleKeydown;
  window.addEventListener('keydown', handleKeydown, { passive: true });
}
