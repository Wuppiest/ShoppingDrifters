// ============================================================
//  Shopping Drifters – procedural sound (Web Audio, no files)
// ============================================================
const SFX = (() => {
  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  const L = {};
  const now = () => ctx.currentTime;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = settings.vol;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9;
    musicBus = ctx.createGain(); musicBus.gain.value = settings.music ? 0.22 : 0;
    sfxBus.connect(comp); musicBus.connect(comp); comp.connect(master); master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    makeLoops();
    startMusic();
  }
  function applySettings() {
    if (!ctx) return;
    master.gain.setTargetAtTime(settings.vol, now(), 0.05);
    musicBus.gain.setTargetAtTime(settings.music ? 0.22 : 0, now(), 0.2);
  }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone({ type = 'sine', f0 = 440, f1 = null, dur = 0.3, v = 0.2, a = 0.005, delay = 0, bus = null, filter = 0 }) {
    if (!ctx) return;
    const t = now() + delay;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 != null) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, a, v, dur);
    let n = o;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); n = f; }
    n.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + a + dur + 0.05);
  }
  function noise({ dur = 0.2, v = 0.2, type = 'lowpass', f0 = 800, f1 = null, q = 0.8, a = 0.005, delay = 0 }) {
    if (!ctx) return;
    const t = now() + delay;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 != null) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, a, v, dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t, Math.random()); s.stop(t + a + dur + 0.05);
  }

  // ---------- continuous loops ----------
  function makeLoops() {
    // engine: two detuned saws + square sub, amplitude-chopped by an LFO (two-stroke "brrrr")
    const eg = ctx.createGain(); eg.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 2;
    const chop = ctx.createGain(); chop.gain.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 30;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.4; lfo.connect(lfoG); lfoG.connect(chop.gain);
    const oscs = [];
    for (const [type, mul, det] of [['sawtooth', 1, 0], ['sawtooth', 1, 9], ['square', 0.5, 0]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = 50 * mul; o.detune.value = det;
      o.connect(lp); o.start(); oscs.push({ o, mul });
    }
    lp.connect(chop); chop.connect(eg); eg.connect(sfxBus); lfo.start();
    L.engine = { g: eg, lp, oscs, lfo };
    // wheel rattle: band-passed noise with a fast tremolo
    const rs = ctx.createBufferSource(); rs.buffer = noiseBuf; rs.loop = true;
    const rf = ctx.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 2400; rf.Q.value = 1.2;
    const rtrem = ctx.createGain(); rtrem.gain.value = 0.5;
    const rl = ctx.createOscillator(); rl.frequency.value = 22; const rlg = ctx.createGain(); rlg.gain.value = 0.5; rl.connect(rlg); rlg.connect(rtrem.gain); rl.start();
    const rg = ctx.createGain(); rg.gain.value = 0;
    rs.connect(rf); rf.connect(rtrem); rtrem.connect(rg); rg.connect(sfxBus); rs.start();
    L.rattle = { g: rg, lfo: rl, f: rf };
    // tyre squeal: two sines + filtered noise
    const sg = ctx.createGain(); sg.gain.value = 0;
    const s1 = ctx.createOscillator(); s1.type = 'triangle'; s1.frequency.value = 1150;
    const s2 = ctx.createOscillator(); s2.type = 'sine'; s2.frequency.value = 1730;
    const sv = ctx.createOscillator(); sv.frequency.value = 9; const svg = ctx.createGain(); svg.gain.value = 40; sv.connect(svg); svg.connect(s1.frequency); svg.connect(s2.frequency);
    const ss = ctx.createBufferSource(); ss.buffer = noiseBuf; ss.loop = true;
    const sf = ctx.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 1500; sf.Q.value = 3;
    const sng = ctx.createGain(); sng.gain.value = 0.6;
    const smix = ctx.createGain(); smix.gain.value = 0.25;
    s1.connect(smix); s2.connect(smix); ss.connect(sf); sf.connect(sng); sng.connect(sg); smix.connect(sg); sg.connect(sfxBus);
    s1.start(); s2.start(); sv.start(); ss.start();
    L.squeal = { g: sg, s1, s2 };
  }
  // called every frame
  function drive(on, speed, throttle, slip, boost) {
    if (!ctx || !L.engine) return;
    const t = now();
    const sp = Math.abs(speed);
    const rpm = on ? 42 + sp * 7 + throttle * 26 + boost * 30 : 0;
    for (const { o, mul } of L.engine.oscs) o.frequency.setTargetAtTime(Math.max(20, rpm * mul), t, 0.06);
    L.engine.lfo.frequency.setTargetAtTime(14 + rpm * 0.35, t, 0.06);
    L.engine.lp.frequency.setTargetAtTime(500 + throttle * 900 + sp * 60 + boost * 800, t, 0.08);
    L.engine.g.gain.setTargetAtTime(on ? 0.085 + throttle * 0.07 + boost * 0.05 : 0, t, 0.08);
    L.rattle.g.gain.setTargetAtTime(on ? Math.min(0.16, sp * 0.014) : 0, t, 0.05);
    L.rattle.lfo.frequency.setTargetAtTime(8 + sp * 3, t, 0.05);
    const sq = on ? clamp((slip - 0.18) * 0.5, 0, 0.22) * clamp(sp / 4, 0, 1) : 0;
    L.squeal.g.gain.setTargetAtTime(sq, t, 0.04);
    L.squeal.s1.frequency.setTargetAtTime(1000 + sp * 25, t, 0.1);
  }

  // ---------- one-shots ----------
  const S = {
    crash(power = 1) {
      const p = clamp(power, 0.2, 1.5);
      noise({ dur: 0.25 + p * 0.15, v: 0.35 * p, f0: 900, f1: 120 });
      for (const f of [523, 811, 1187, 1601]) tone({ type: 'square', f0: f * (0.9 + Math.random() * 0.2), dur: 0.2 + p * 0.2, v: 0.025 * p, filter: 3000 });
      tone({ type: 'sine', f0: 110, f1: 50, dur: 0.25, v: 0.3 * p });
    },
    pickup() {
      [660, 880, 1320].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.14, v: 0.16, delay: i * 0.06 }));
      noise({ dur: 0.12, v: 0.08, type: 'highpass', f0: 3000, delay: 0.05 });
    },
    drop() { tone({ type: 'sine', f0: 220, f1: 110, dur: 0.12, v: 0.2 }); noise({ dur: 0.08, v: 0.1, f0: 600 }); },
    count(i) { tone({ type: 'square', f0: i > 0 ? 520 : 1040, dur: i > 0 ? 0.18 : 0.5, v: 0.12, filter: 2500 }); },
    tick() { tone({ type: 'square', f0: 880, dur: 0.08, v: 0.09, filter: 2000 }); tone({ type: 'square', f0: 660, dur: 0.08, v: 0.07, delay: 0.1, filter: 2000 }); },
    scan() { tone({ type: 'sine', f0: 1870, dur: 0.09, v: 0.16 }); },
    ding() { [1318, 1046, 1568].forEach((f, i) => tone({ type: 'sine', f0: f, dur: 0.6, v: 0.12, delay: i * 0.12 })); },
    win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.22, v: 0.14, delay: i * 0.1 })); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone({ type: 'sawtooth', f0: f, dur: 0.35, v: 0.08, delay: i * 0.22, filter: 1400 })); },
    boost() { noise({ dur: 0.5, v: 0.25, type: 'bandpass', f0: 400, f1: 3000, q: 1.5 }); tone({ type: 'sawtooth', f0: 120, f1: 380, dur: 0.4, v: 0.08, filter: 1500 }); },
    splash() { noise({ dur: 0.35, v: 0.2, type: 'bandpass', f0: 2500, f1: 700, q: 1 }); },
    hey() { tone({ type: 'sawtooth', f0: 260, f1: 340, dur: 0.18, v: 0.06, filter: 1200 }); tone({ type: 'sawtooth', f0: 340, f1: 220, dur: 0.22, v: 0.06, delay: 0.18, filter: 1200 }); },
    rumble() { noise({ dur: 1.0, v: 0.3, f0: 300, f1: 60 }); for (let i = 0; i < 5; i++) noise({ dur: 0.12, v: 0.2, f0: 1200, delay: 0.2 + i * 0.12 }); },
    nope() { tone({ type: 'square', f0: 200, dur: 0.15, v: 0.08, filter: 900 }); tone({ type: 'square', f0: 150, dur: 0.2, v: 0.08, delay: 0.15, filter: 900 }); },
    click() { tone({ type: 'triangle', f0: 900, dur: 0.05, v: 0.08 }); },
    door() { noise({ dur: 0.6, v: 0.08, type: 'bandpass', f0: 600, f1: 300, q: 2 }); },
  };

  // ---------- muzak: chill supermarket loop ----------
  let musicTimer = null, step = 0, nextT = 0;
  const BPM = 104, SPB = 60 / BPM / 2; // eighth notes
  const CH = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]]; // Cmaj7 Am7 Dm7 G7
  const BASS = [[36, 43, 40, 43], [33, 40, 36, 40], [38, 45, 41, 45], [31, 38, 35, 38]];
  const SCALE = [72, 74, 76, 79, 81, 84];
  const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
  let mrng = mulberry32(99);
  function note(n, t, dur, v, type) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = mf(n);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function startMusic() {
    nextT = now() + 0.1;
    musicTimer = setInterval(() => {
      while (nextT < now() + 0.3) {
        const bar = Math.floor(step / 8) % 4, s = step % 8;
        if (s === 0) for (const n of CH[bar]) note(n, nextT, SPB * 7.5, 0.05, 'triangle');
        if (s % 2 === 0) note(BASS[bar][s / 2], nextT, SPB * 1.8, 0.16, 'sine');
        if (s % 2 === 1) note(96, nextT, 0.04, 0.012, 'square'); // tiny hi-hat tick
        if (mrng() < (s % 2 ? 0.25 : 0.55)) note(SCALE[Math.floor(mrng() * SCALE.length)], nextT, SPB * 1.6, 0.06, 'sine');
        nextT += SPB; step++;
      }
    }, 100);
  }
  return Object.assign(S, { init, drive, applySettings, get ready() { return !!ctx; } });
})();
