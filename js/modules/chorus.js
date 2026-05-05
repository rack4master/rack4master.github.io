// js/modules/chorus.js
import { buildKnob } from '../ui/knobs.js';

export const label = 'CHORUS';
export const color = '#3388ff';

export const params = {
  rate:  { label:'RATE',  min:0.1, max:10, def:1.5, step:0.1, unit:'Hz' },
  depth: { label:'DEPTH', min:0.1, max:20, def:5,   step:0.1, unit:'ms' },
  mix:   { label:'MIX',   min:0,   max:100,def:50,  step:1,   unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.025;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = params.rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = params.depth / 1000;
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start(0);
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  input.connect(dry);
  input.connect(delay);
  delay.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, delay, lfo, lfoGain };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'rate':  r(nodes.lfo.frequency, value); break;
    case 'depth': r(nodes.lfoGain.gain, value / 1000); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':          { rate: 1.5, depth: 5,  mix: 50 },
  'Classic Chorus':   { rate: 1.2, depth: 6,  mix: 55 },
  'Fluffy':           { rate: 0.8, depth: 8,  mix: 60 },
  'Fast Warble':      { rate: 4,   depth: 3,  mix: 40 },
  'Subtle Ensemble':  { rate: 0.5, depth: 4,  mix: 35 },
  'Deep Sweep':       { rate: 0.3, depth: 12, mix: 70 },
  'Bright Chorus':    { rate: 2,   depth: 4,  mix: 50 }
};

// ----------------------------------------------------------------
// UI personalizada del Chorus (osciloscopio + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['chorus'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:12px;';

  // Osciloscopio con borde
  const canvas = document.createElement('canvas');
  canvas.className = 'chorus-lfo-canvas';
  canvas.width = 220;
  canvas.height = 50;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#000; display:block;';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['rate', 'depth', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // Animación continua
  function animate() {
    const W = canvas.width;
    const H = canvas.height;
    const freq = mod.params.rate;
    const depth = mod.params.depth;
    const now = performance.now() / 1000;
    const phase = (now * freq) % 1.0;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // --- Rejilla de fondo muy tenue ---
    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 0.5;

    // Líneas verticales cada 25px
    for (let x = 0; x <= W; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Líneas horizontales (divisiones suaves)
    const divisions = 5; // 5 líneas = centro + 2 arriba + 2 abajo
    for (let i = 0; i < divisions; i++) {
      const y = (H / (divisions - 1)) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // --- Marcas de profundidad (min / max) ---
    const amplitude = (depth / 20) * (H * 0.4);
    const yMax = H/2 - amplitude;
    const yMin = H/2 + amplitude;

    // Líneas punteadas del color del módulo en los extremos de la onda
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    [yMax, yMin].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    });
    ctx.setLineDash([]); // volver a línea continua

    // --- Onda LFO ---
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    for (let x = 0; x <= W; x++) {
      const t = x / W;
      const value = Math.sin(2 * Math.PI * (t + phase)) * amplitude;
      const y = H/2 - value;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
