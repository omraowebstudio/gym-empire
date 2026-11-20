// Procedurally synthesises all GYM EMPIRE sound effects and the music loop as 16-bit
// mono WAV files. Original audio: no third-party samples. Run: node scripts/generate-sounds.js
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(OUT, { recursive: true });

function writeWav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([header, data]));
}

const buf = (sec) => new Float32Array(Math.floor(sec * RATE));
const osc = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  square: (p) => (p % 1 < 0.5 ? 1 : -1) * 0.6,
  tri: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
  saw: (p) => 2 * (p % 1) - 1,
};
let seed = 1;
const noise = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
};

/** Adds a tone with ADSR-ish envelope; freq may be a function of t for sweeps. */
function tone(out, start, dur, freq, { type = 'sine', vol = 0.5, attack = 0.005, release = 0.08 } = {}) {
  const s0 = Math.floor(start * RATE);
  const n = Math.floor(dur * RATE);
  let phase = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / RATE;
    const f = typeof freq === 'function' ? freq(t) : freq;
    phase += f / RATE;
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    out[s0 + i] += osc[type](phase) * vol * Math.max(0, env);
  }
}

function noiseBurst(out, start, dur, { vol = 0.3, decay = 30, highpass = false } = {}) {
  const s0 = Math.floor(start * RATE);
  const n = Math.floor(dur * RATE);
  let prev = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / RATE;
    let v = noise();
    if (highpass) {
      const hp = v - prev;
      prev = v;
      v = hp;
    }
    out[s0 + i] += v * vol * Math.exp(-t * decay);
  }
}

const note = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

// --- UI click
{ const b = buf(0.08); tone(b, 0, 0.06, (t) => 1200 - t * 6000, { type: 'tri', vol: 0.5, release: 0.04 }); writeWav('click.wav', b); }
// --- coin
{ const b = buf(0.35); tone(b, 0, 0.08, note(88), { type: 'square', vol: 0.25 }); tone(b, 0.07, 0.25, note(93), { type: 'square', vol: 0.25, release: 0.2 }); writeWav('coin.wav', b); }
// --- purchase (cash register-ish)
{ const b = buf(0.6); noiseBurst(b, 0, 0.05, { vol: 0.3, decay: 80, highpass: true }); [76, 81, 84, 88].forEach((n, i) => tone(b, 0.05 + i * 0.07, 0.3, note(n), { type: 'tri', vol: 0.35, release: 0.2 })); writeWav('purchase.wav', b); }
// --- upgrade (rising sweep)
{ const b = buf(0.5); tone(b, 0, 0.45, (t) => 300 + t * 1600, { type: 'square', vol: 0.18, release: 0.15 }); tone(b, 0.3, 0.2, note(96), { type: 'sine', vol: 0.3 }); writeWav('upgrade.wav', b); }
// --- level up fanfare
{ const b = buf(1.4); const seq = [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36]]; seq.forEach(([n, t]) => tone(b, t, 0.25, note(n), { type: 'square', vol: 0.2 })); [84, 88, 91].forEach((n) => tone(b, 0.5, 0.8, note(n), { type: 'tri', vol: 0.25, release: 0.5 })); noiseBurst(b, 0.5, 0.6, { vol: 0.08, decay: 6, highpass: true }); writeWav('levelup.wav', b); }
// --- achievement
{ const b = buf(1.0); [[79, 0], [84, 0.1], [88, 0.2], [91, 0.3]].forEach(([n, t]) => tone(b, t, 0.5, note(n), { type: 'sine', vol: 0.3, release: 0.4 })); writeWav('achievement.wav', b); }
// --- rep perfect / good / miss
{ const b = buf(0.3); tone(b, 0, 0.1, note(84), { type: 'square', vol: 0.22 }); tone(b, 0.08, 0.2, note(91), { type: 'square', vol: 0.22, release: 0.15 }); writeWav('perfect.wav', b); }
{ const b = buf(0.2); tone(b, 0, 0.16, note(79), { type: 'tri', vol: 0.35, release: 0.1 }); writeWav('good.wav', b); }
{ const b = buf(0.3); tone(b, 0, 0.28, (t) => 220 - t * 300, { type: 'saw', vol: 0.25, release: 0.15 }); writeWav('miss.wav', b); }
// --- clank (barbell rep)
{ const b = buf(0.35); noiseBurst(b, 0, 0.3, { vol: 0.35, decay: 25, highpass: true }); tone(b, 0, 0.3, 620, { type: 'sine', vol: 0.2, release: 0.25 }); tone(b, 0, 0.3, 910, { type: 'sine', vol: 0.12, release: 0.25 }); writeWav('clank.wav', b); }
// --- whoosh
{ const b = buf(0.4); noiseBurst(b, 0, 0.4, { vol: 0.25, decay: 8 }); writeWav('whoosh.wav', b); }
// --- victory
{ const b = buf(2.0); const m = [[67, 0, 0.15], [72, 0.15, 0.15], [76, 0.3, 0.15], [79, 0.45, 0.3], [76, 0.75, 0.15], [79, 0.9, 0.9]]; m.forEach(([n, t, d]) => { tone(b, t, d, note(n), { type: 'square', vol: 0.2 }); tone(b, t, d, note(n - 12), { type: 'tri', vol: 0.2 }); }); noiseBurst(b, 0.9, 1, { vol: 0.07, decay: 3, highpass: true }); writeWav('victory.wav', b); }
// --- defeat
{ const b = buf(1.2); [[67, 0], [66, 0.25], [65, 0.5]].forEach(([n, t]) => tone(b, t, 0.3, note(n), { type: 'tri', vol: 0.3 })); tone(b, 0.75, 0.45, note(64), { type: 'tri', vol: 0.3, release: 0.3 }); writeWav('defeat.wav', b); }
// --- crowd cheer-ish (filtered noise swell)
{ const b = buf(1.5); const n = b.length; let lp = 0; for (let i = 0; i < n; i++) { const t = i / RATE; lp += (noise() - lp) * 0.15; b[i] = lp * 0.6 * Math.sin(Math.PI * t / 1.5); } writeWav('cheer.wav', b); }

// --- music loop: 120 BPM, 8 bars, upbeat gym groove in C minor-ish
{
  const bpm = 118;
  const beat = 60 / bpm;
  const bars = 8;
  const b = buf(bars * 4 * beat);
  const chords = [[48, 55, 63], [44, 51, 60], [46, 53, 62], [43, 50, 58]];
  for (let bar = 0; bar < bars; bar++) {
    const ch = chords[bar % 4];
    const t0 = bar * 4 * beat;
    // pads
    ch.forEach((n) => tone(b, t0, 4 * beat, note(n + 12), { type: 'tri', vol: 0.045, attack: 0.3, release: 0.4 }));
    for (let q = 0; q < 8; q++) {
      const t = t0 + q * beat / 2;
      // bass on eighths
      tone(b, t, beat / 2 * 0.9, note(ch[0] - 12 + (q % 4 === 3 ? 7 : 0)), { type: 'saw', vol: 0.09, release: 0.05 });
      // hi-hat
      noiseBurst(b, t + beat / 4, 0.05, { vol: 0.05, decay: 90, highpass: true });
    }
    for (let q = 0; q < 4; q++) {
      const t = t0 + q * beat;
      // kick on every beat
      tone(b, t, 0.18, (x) => 110 * Math.exp(-x * 25) + 45, { type: 'sine', vol: 0.5, release: 0.08 });
      // snare/clap on 2 and 4
      if (q % 2 === 1) noiseBurst(b, t, 0.18, { vol: 0.16, decay: 22, highpass: true });
    }
    // little lead arp in bars 5-8
    if (bar >= 4) {
      [0, 2, 1, 2].forEach((ci, k) => tone(b, t0 + k * beat, beat * 0.45, note(ch[ci] + 24), { type: 'square', vol: 0.035 }));
    }
  }
  // normalise softly
  let peak = 0;
  for (const v of b) peak = Math.max(peak, Math.abs(v));
  for (let i = 0; i < b.length; i++) b[i] = (b[i] / peak) * 0.6;
  writeWav('music_loop.wav', b);
}
console.log('Sounds written to', OUT);
