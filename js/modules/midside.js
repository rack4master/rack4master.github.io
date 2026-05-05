// js/modules/midside.js
import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'MID/SIDE';
export const color = '#ffaa44';

export const params = {
  midGain:  { label:'MID GAIN',  min:-24, max:24, def:0,  step:0.5, unit:'dB' },
  sideGain: { label:'SIDE GAIN', min:-24, max:24, def:0,  step:0.5, unit:'dB' },
  mix:      { label:'MIX',       min:0,   max:100,def:100,step:1,   unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const splitter = ctx.createChannelSplitter(2);
  const midGainNode = ctx.createGain();
  const sideGainNode = ctx.createGain();
  const L = ctx.createGain();
  const R = ctx.createGain();
  splitter.connect(L, 0);
  splitter.connect(R, 1);
  const midSum = ctx.createGain();
  const sideDiff = ctx.createGain();
  L.connect(midSum);
  R.connect(midSum);
  const invertR = ctx.createGain();
  invertR.gain.value = -1;
  R.connect(invertR);
  L.connect(sideDiff);
  invertR.connect(sideDiff);
  midSum.connect(midGainNode);
  sideDiff.connect(sideGainNode);
  const leftOut = ctx.createGain();
  const rightOut = ctx.createGain();
  midGainNode.connect(leftOut);
  sideGainNode.connect(leftOut);
  midGainNode.connect(rightOut);
  const invertSide = ctx.createGain();
  invertSide.gain.value = -1;
  sideGainNode.connect(invertSide);
  invertSide.connect(rightOut);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - params.mix / 100;
  wetGain.gain.value = params.mix / 100;
  input.connect(dryGain);
  input.connect(splitter);
  const merger = ctx.createChannelMerger(2);
  leftOut.connect(merger, 0, 0);
  rightOut.connect(merger, 0, 1);
  merger.connect(wetGain);
  dryGain.connect(output);
  wetGain.connect(output);
  return { input, output, midGainNode, sideGainNode, dryGain, wetGain, splitter, L, R, midSum, sideDiff, invertR, leftOut, rightOut, invertSide, merger };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'midGain':  r(nodes.midGainNode.gain, dbToGain(value)); break;
    case 'sideGain': r(nodes.sideGainNode.gain, dbToGain(value)); break;
    case 'mix':
      r(nodes.wetGain.gain, value / 100);
      r(nodes.dryGain.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':       { midGain:0,  sideGain:0,  mix:100 },
  'Center Boost':  { midGain:3,  sideGain:-1, mix:100 },
  'Widen':         { midGain:0,  sideGain:4,  mix:100 },
  'Mono Maker':    { midGain:0,  sideGain:-12,mix:100 },
  'Side Only':     { midGain:-12,sideGain:0,  mix:100 },
  'Mid Only':      { midGain:0,  sideGain:-24,mix:100 },
  'Warm Center':   { midGain:2,  sideGain:-2, mix:80 }
};

// ----------------------------------------------------------------
// UI personalizada del Mid/Side (barras de balance)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['midside'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Canvas para las barras Mid/Side
  const canvas = document.createElement('canvas');
  canvas.className = 'midside-canvas';
  canvas.width = 160;
  canvas.height = 80;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Knobs (Mid, Side, Mix)
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['midGain', 'sideGain', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Animación de las barras Mid/Side ----
  function animate() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    const midGain = mod.params.midGain;
    const sideGain = mod.params.sideGain;
    const mixVal = mod.params.mix;

    const margin = 20;
    const barW = 30;
    const maxHeight = H - margin * 2;
    const centerX = W / 2;
    const midX = centerX - barW - 10;
    const sideX = centerX + 10;

    // Mapear ganancia (-24 .. +24 dB) a altura de barra
    const gainToHeight = (gain) => ((gain + 24) / 48) * maxHeight;

    const midH = gainToHeight(midGain);
    const sideH = gainToHeight(sideGain);

    const alpha = 0.3 + mixVal / 100 * 0.6;

    // Barra Mid
    ctx.fillStyle = `rgba(255, 170, 68, ${alpha})`;
    ctx.fillRect(midX, margin + maxHeight - midH, barW, midH);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth = 1;
    ctx.strokeRect(midX, margin + maxHeight - midH, barW, midH);

    // Barra Side
    ctx.fillStyle = `rgba(68, 200, 255, ${alpha})`;
    ctx.fillRect(sideX, margin + maxHeight - sideH, barW, sideH);
    ctx.strokeStyle = '#44ccff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sideX, margin + maxHeight - sideH, barW, sideH);

    // Etiquetas
    ctx.fillStyle = '#aaa';
    ctx.font = '9px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('MID', midX + barW/2, H - 4);
    ctx.fillText('SIDE', sideX + barW/2, H - 4);

    // Línea central
    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, H/2);
    ctx.lineTo(W, H/2);
    ctx.stroke();

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
