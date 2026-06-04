// js/modules/tremolo.js
import { buildKnob } from '../ui/knobs.js';

export const label = 'TREMOLO';
export const color = '#ff33aa';

export const params = {
  rate:  { label:'RATE',  min:0.1, max:20, def:5,  step:0.1, unit:'Hz' },
  depth: { label:'DEPTH', min:0,   max:100,def:60, step:1,   unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const tremGain = ctx.createGain();
  tremGain.gain.value = 1 - (params.depth / 200);
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = params.rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = params.depth / 200;
  lfo.connect(lfoGain);
  lfoGain.connect(tremGain.gain);
  lfo.start(0);
  input.connect(tremGain);
  tremGain.connect(output);
  return { input, output, tremGain, lfo, lfoGain };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'rate':  r(nodes.lfo.frequency, value); break;
    case 'depth':
      r(nodes.tremGain.gain, 1 - value / 200);
      r(nodes.lfoGain.gain, value / 200);
      break;
  }
}

export const presets = {
  'Default':        { rate:5, depth:60 },
  'Slow Pulse':     { rate:1.5,depth:50 },
  'Fast Vibe':      { rate:12, depth:70 },
  'Subtle Wobble':  { rate:3,  depth:30 },
  'Deep Trem':      { rate:4,  depth:90 },
  'Helicopter':     { rate:18, depth:100 },
  'Gentle':         { rate:2,  depth:40 }
};

// ----------------------------------------------------------------
// UI personalizada del Tremolo (osciloscopio de modulación centrado)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['tremolo'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:12px;';

  // Osciloscopio centrado (como Flanger)
  const canvas = document.createElement('canvas');
  canvas.className = 'tremolo-lfo-canvas';
  canvas.width = 220;
  canvas.height = 50;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#000; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Knobs (Rate, Depth)
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['rate', 'depth'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Animación del osciloscopio (onda centrada que representa la modulación) ----
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

    // Rejilla de fondo sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const y = (H / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Amplitud vertical máxima (la profundidad mapeada a píxeles)
    const amplitude = (depth / 100) * (H * 0.4);
    // Marcas de profundidad (min/max) con líneas punteadas
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    [H/2 - amplitude, H/2 + amplitude].forEach(y => {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Onda senoidal centrada que simula la modulación de volumen
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    for (let x = 0; x <= W; x++) {
      const t = x / W;
      // Valor de modulación entre -1 y 1 (sinusoide) escalado por la amplitud
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
