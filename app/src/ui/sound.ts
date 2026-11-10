// Small synthesised sound set (no asset files) and haptics. Both respect the player's settings.
import { settings } from './settings.svelte';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (!settings.sound) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One soft note: sine/triangle with a quick attack and exponential release. */
function note(freq: number, dur = 0.16, type: OscillatorType = 'triangle', vol = 0.6, delay = 0) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Short filtered noise burst, for soil and leaves. */
function thud(delay = 0, freq = 380, dur = 0.12, vol = 0.5) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

// Major pentatonic from C5, so rising tally steps always sound pleasant.
const PENTA = [0, 2, 4, 7, 9];
const pitch = (step: number) => 523.25 * 2 ** ((PENTA[step % 5] + 12 * Math.floor(step / 5)) / 12);

function buzz(pattern: number | number[]) {
  if (!settings.haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export const sfx = {
  select() { note(880, 0.07, 'sine', 0.25); buzz(5); },
  plant() { thud(0, 420, 0.14, 0.7); note(392, 0.12, 'triangle', 0.3, 0.04); buzz(12); },
  tool() { thud(0, 900, 0.1, 0.35); note(660, 0.08, 'sine', 0.25, 0.02); buzz(8); },
  draft() { note(659.25, 0.1, 'triangle', 0.35); note(987.77, 0.14, 'triangle', 0.25, 0.05); buzz(6); },
  tally(step: number) { note(pitch(Math.min(step, 14)), 0.12, 'triangle', 0.4); buzz(4); },
  bonus() { note(1046.5, 0.18, 'sine', 0.35); note(1318.5, 0.22, 'sine', 0.3, 0.06); },
  pass() { [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => note(f, 0.5, 'triangle', 0.35, k * 0.07)); buzz([20, 40, 30]); },
  fail() { note(311.13, 0.4, 'sine', 0.4); note(233.08, 0.6, 'sine', 0.35, 0.18); buzz([40, 60, 40]); },
  grow() { note(1567.98, 0.1, 'sine', 0.2); note(2093, 0.12, 'sine', 0.15, 0.05); },
  /** call from a user gesture so later sounds are allowed to play */
  unlock() { ac(); },
};
