// js/modules/widener.js
import { buildKnob } from '../ui/knobs.js';

export const label = 'WIDENER';
export const color = '#44ccff';

export const params = {
  width: { label:'WIDTH', min:0, max:30, def:10, step:0.5, unit:'ms' },
  mix:   { label:'MIX',   min:0, max:100,def:100,step:1,   unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const split = ctx.createChannelSplitter(2);
  const dlyR = ctx.createDelay(0.05);
  const dryG = ctx.createGain();
  const wetG = ctx.createGain();
  const wetMerge = ctx.createChannelMerger(2);
  dryG.gain.value = 1 - params.mix / 100;
  wetG.gain.value = params.mix / 100;
  dlyR.delayTime.value = params.width / 1000;
  input.connect(dryG);
  dryG.connect(output);
  input.connect(split);
  split.connect(wetMerge, 0, 0);
  split.connect(dlyR, 0);
  dlyR.connect(wetMerge, 0, 1);
  wetMerge.connect(wetG);
  wetG.connect(output);
  return { input, output, dryG, wetG, split, dlyR, wetMerge };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'width': r(nodes.dlyR.delayTime, value / 1000); break;
    case 'mix':
      r(nodes.wetG.gain, value / 100);
      r(nodes.dryG.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':          { width: 10, mix: 100 },
  'Subtle':           { width: 5,  mix: 60 },
  'Medium':           { width: 12, mix: 80 },
  'Wide':             { width: 20, mix: 100 },
  'Extreme':          { width: 30, mix: 100 },
  'Half Mix':         { width: 15, mix: 50 },
  'Mono Compatible':  { width: 8,  mix: 70 }
};

// ----------------------------------------------------------------
// UI personalizada del Widener (indicador de anchura + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['widener'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:12px;';

  // ---- Indicador de anchura (canvas) ----
  const canvas = document.createElement('canvas');
  canvas.className = 'widener-canvas';
  canvas.width = 200;
  canvas.height = 40;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // ---- Knobs ----
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['width', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Animación del indicador ----
  function animate() {
    const W = canvas.width;
    const H = canvas.height;
    const widthVal = mod.params.width;
    const mixVal = mod.params.mix;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    // Línea central (mono)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W/2, 0);
    ctx.lineTo(W/2, H);
    ctx.stroke();

    // Barras de anchura
    const maxWidth = 30; // valor máximo del parámetro width
    const barWidth = (widthVal / maxWidth) * (W * 0.4); // escala a píxeles
    const barHeight = 7;
    const barY = H / 2 - barHeight / 2;

    // Barra izquierda
    const leftX = W/2 - barWidth;
    ctx.fillStyle = 'rgba(68, 204, 255, 0.7)';
    ctx.fillRect(leftX, barY, barWidth, barHeight);

    // Barra derecha (simétrica)
    const rightX = W/2;
    ctx.fillRect(rightX, barY, barWidth, barHeight);

    // Brillo de las barras según Mix
    const mixOpacity = mixVal / 100;
    ctx.fillStyle = `rgba(68, 204, 255, ${0.2 + mixOpacity * 0.5})`;
    ctx.fillRect(leftX, barY, barWidth * 2, barHeight); // capa de brillo encima de ambas barras

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
