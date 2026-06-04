// js/modules/modulation.js
// NUEVO: fusión de chorus.js + flanger.js
// Mode 0=Chorus (delay largo ~25ms, sin feedback)
// Mode 1=Flanger (delay corto ~2ms, con feedback)
// Mode 2=Vibrato (como chorus pero 100% wet)

import { buildKnob } from '../ui/knobs.js';

export const label = 'MODULATION';
export const color = '#55aaff';

// Base delay por modo (segundos)
const MODE_BASE_DELAY = [0.025, 0.002, 0.020];
const MODE_LABELS = ['CHORUS', 'FLANGER', 'VIBRATO'];

export const params = {
  mode:     { label:'MODE',   min:0, max:2, def:0, step:1, unit:'' },
  rate:     { label:'RATE',   min:0.1, max:10,  def:1.5, step:0.1, unit:'Hz' },
  depth:    { label:'DEPTH',  min:0.1, max:20,  def:5,   step:0.1, unit:'ms' },
  feedback: { label:'FEEDBK', min:0,   max:90,  def:50,  step:1,   unit:'%'  },
  mix:      { label:'MIX',    min:0,   max:100, def:50,  step:1,   unit:'%'  }
};

export function buildNodes(ctx, p) {
  const input  = ctx.createGain();
  const output = ctx.createGain();
  const dry    = ctx.createGain();
  const wet    = ctx.createGain();

  const baseDelay = MODE_BASE_DELAY[Math.round(p.mode) || 0];
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = baseDelay;

  const lfo     = ctx.createOscillator();
  lfo.type      = 'sine';
  lfo.frequency.value = p.rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = p.depth / 1000;
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start(0);

  // Feedback path: activo solo en Flanger (mode=1)
  const fb = ctx.createGain();
  fb.gain.value = (Math.round(p.mode) === 1) ? p.feedback / 100 : 0;
  delay.connect(fb);
  fb.connect(delay);

  const isVibrato = Math.round(p.mode) === 2;
  dry.gain.value = isVibrato ? 0 : 1 - p.mix / 100;
  wet.gain.value = isVibrato ? 1 : p.mix / 100;

  input.connect(dry);
  input.connect(delay);
  delay.connect(wet);
  dry.connect(output);
  wet.connect(output);

  return { input, output, dry, wet, delay, lfo, lfoGain, fb };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  const mode = Math.round(nodes._mode !== undefined ? nodes._mode : 0);

  switch (key) {
    case 'mode': {
      const m = Math.round(value);
      nodes._mode = m;
      // Cambiar delay base
      r(nodes.delay.delayTime, MODE_BASE_DELAY[m]);
      // Feedback: solo en Flanger
      r(nodes.fb.gain, m === 1 ? (nodes._feedback || 50) / 100 : 0);
      // Vibrato: 100% wet
      if (m === 2) {
        r(nodes.wet.gain, 1);
        r(nodes.dry.gain, 0);
      } else {
        const mix = nodes._mix !== undefined ? nodes._mix : 50;
        r(nodes.wet.gain, mix / 100);
        r(nodes.dry.gain, 1 - mix / 100);
      }
      break;
    }
    case 'rate':  r(nodes.lfo.frequency, value); break;
    case 'depth': r(nodes.lfoGain.gain, value / 1000); break;
    case 'feedback':
      nodes._feedback = value;
      if (mode === 1) r(nodes.fb.gain, value / 100);
      break;
    case 'mix':
      nodes._mix = value;
      if (mode !== 2) {
        r(nodes.wet.gain, value / 100);
        r(nodes.dry.gain, 1 - value / 100);
      }
      break;
  }
}

export const presets = {
  'Default':          { mode:0, rate:1.5, depth:5,  feedback:0,  mix:50 },
  'Classic Chorus':   { mode:0, rate:1.2, depth:6,  feedback:0,  mix:55 },
  'Fluffy':           { mode:0, rate:0.8, depth:8,  feedback:0,  mix:60 },
  'Ensemble':         { mode:0, rate:0.5, depth:4,  feedback:0,  mix:35 },
  'Jet Flanger':      { mode:1, rate:1.2, depth:3,  feedback:70, mix:60 },
  'Subtle Flange':    { mode:1, rate:0.3, depth:1.5,feedback:30, mix:40 },
  'Deep Flange':      { mode:1, rate:0.8, depth:4,  feedback:60, mix:55 },
  'Vibrato Gentle':   { mode:2, rate:3,   depth:3,  feedback:0,  mix:100 },
  'Vibrato Deep':     { mode:2, rate:5,   depth:7,  feedback:0,  mix:100 }
};

// ----------------------------------------------------------------
// UI personalizada: selector de modo + osciloscopio LFO + knobs
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def   = window.MODULE_DEFS['modulation'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // --- Selector de modo (3 botones) ---
  const modeRow = document.createElement('div');
  modeRow.style.cssText = 'display:flex; gap:6px;';
  const modeBtns = MODE_LABELS.map((lbl, i) => {
    const btn = document.createElement('button');
    btn.textContent = lbl;
    btn.style.cssText = `padding:4px 10px; font-size:11px; font-family:var(--fnt-ui);
      font-weight:700; border-radius:4px; cursor:pointer; border:1px solid var(--brd2);
      background:${Math.round(mod.params.mode) === i ? color : 'var(--surf2)'};
      color:${Math.round(mod.params.mode) === i ? '#000' : 'var(--tx2)'};
      transition:all .15s;`;
    btn.addEventListener('click', () => {
      if (window.applyParam) window.applyParam(mod, 'mode', i);
      modeBtns.forEach((b, j) => {
        b.style.background = j === i ? color : 'var(--surf2)';
        b.style.color      = j === i ? '#000' : 'var(--tx2)';
      });
      // Mostrar/ocultar feedback knob según modo
      const fbWrap = container.querySelector('[data-key="feedback"]');
      if (fbWrap) fbWrap.style.opacity = i === 1 ? '1' : '0.35';
    });
    return btn;
  });
  modeBtns.forEach(b => modeRow.appendChild(b));
  container.appendChild(modeRow);

  // --- Osciloscopio LFO ---
  const canvas = document.createElement('canvas');
  canvas.width = 220; canvas.height = 50;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#000; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // --- Knobs ---
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:12px; justify-content:center; flex-wrap:wrap;';
  ['rate','depth','feedback','mix'].forEach(key => {
    const wrap = buildKnob(mod, key, def.params[key], color);
    if (key === 'feedback') wrap.style.opacity = Math.round(mod.params.mode) === 1 ? '1' : '0.35';
    knobsRow.appendChild(wrap);
  });
  container.appendChild(knobsRow);

  // --- Animación osciloscopio ---
  function animate() {
    const W = canvas.width, H = canvas.height;
    const freq  = mod.params.rate;
    const depth = mod.params.depth;
    const now   = performance.now() / 1000;
    const phase = (now * freq) % 1.0;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 25) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let i = 0; i < 5; i++) { const y=(H/4)*i; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    const amp = (depth / 20) * (H * 0.4);
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([3,4]);
    [H/2-amp, H/2+amp].forEach(y => { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    for (let x = 0; x <= W; x++) {
      const y = H/2 - Math.sin(2*Math.PI*(x/W + phase)) * amp;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
