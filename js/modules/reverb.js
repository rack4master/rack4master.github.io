// js/modules/reverb.js
import { buildReverbIR } from '../core/audio.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'REVERB';
export const color = '#aa66ff';

export const params = {
  size:     { label:'SIZE',    min:0.1, max:6,   def:1.5, step:0.05, unit:'s' },
  decay:    { label:'DECAY',   min:0.5, max:8,   def:2,   step:0.1,  unit:'x' },
  predelay: { label:'PRE-DLY', min:0,   max:100, def:20,  step:1,    unit:'ms' },
  mix:      { label:'MIX',     min:0,   max:100, def:30,  step:1,    unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const preDly = ctx.createDelay(0.15);
  const conv = ctx.createConvolver();
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  preDly.delayTime.value = params.predelay / 1000;
  conv.buffer = buildReverbIR(ctx, params.size, params.decay);
  input.connect(dry);
  input.connect(preDly);
  preDly.connect(conv);
  conv.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, preDly, conv };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'size':
    case 'decay':
      const currentSize = key === 'size' ? value : params.size;
      const currentDecay = key === 'decay' ? value : params.decay;
      nodes.conv.buffer = buildReverbIR(window.audioCtx, currentSize, currentDecay);
      break;
    case 'predelay':
      r(nodes.preDly.delayTime, value / 1000);
      break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':     { size:1.5, decay:2,   predelay:20, mix:30 },
  'Small Room':  { size:0.8, decay:1.2, predelay:10, mix:25 },
  'Large Hall':  { size:4,   decay:4,   predelay:30, mix:35 },
  'Cathedral':   { size:6,   decay:6,   predelay:40, mix:40 },
  'Plate':       { size:1.2, decay:1.8, predelay:15, mix:30 },
  'Ambience':    { size:0.5, decay:0.8, predelay:5,  mix:20 },
  'Epic':        { size:5,   decay:5,   predelay:50, mix:45 }
};

// ----------------------------------------------------------------
// UI personalizada de la Reverb (cola de reverberación)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['reverb'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Canvas para la cola de reverb
  const canvas = document.createElement('canvas');
  canvas.className = 'reverb-canvas';
  canvas.width = 260;
  canvas.height = 50;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['size', 'decay', 'predelay', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Animación de la cola ----
  function animate() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    const size = mod.params.size;
    const decay = mod.params.decay;
    const predelay = mod.params.predelay;
    const mixVal = mod.params.mix;

    const margin = 10;
    const plotW = W - margin * 2;
    const plotH = H - 10;
    const plotX = margin, plotY = 5;
    const maxTime = 0.5; // segundos máximos mostrados
    const totalBars = 40;
    const barWidth = (plotW / totalBars) * 0.7;
    const gap = plotW / totalBars;
    const initialPeak = H * 0.6;

    // Pre-delay: barra de silencio al principio
    const preDelayPixels = Math.min(plotW * 0.3, (predelay / 1000) / maxTime * plotW);

    // Dibujar barras que decaen exponencialmente
    const startX = plotX + preDelayPixels;
    for (let i = 0; i < totalBars; i++) {
      const x = startX + i * gap;
      if (x > plotX + plotW) break;

      // Decaimiento exponencial combinando size y decay
      const t = i / totalBars;
      const env = Math.exp(-t * decay * 3) * size;
      const barH = initialPeak * env;
      if (barH < 0.5) continue;

      const alpha = 0.2 + mixVal / 100 * 0.6;
      ctx.fillStyle = `rgba(170, 102, 255, ${alpha * Math.max(0.1, 1 - t)})`;
      ctx.fillRect(x, plotY + plotH - barH, barWidth, barH);
    }

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
