// js/modules/midside.js
// CORREGIDO: la matriz M/S original producía +6 dB a ganancia unidad.
// La suma L+R da una señal 6 dB más alta que L sola.
// Corrección: midNorm y sideNorm con gain = 0.5 antes de aplicar el proceso.
// Con este fix: si midGain=0dB y sideGain=0dB → salida = entrada (bit-exact).

import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'MID/SIDE';
export const color = '#ffaa44';

export const params = {
  midGain:  { label:'MID GAIN',  min:-24, max:24, def:0,   step:0.5, unit:'dB' },
  sideGain: { label:'SIDE GAIN', min:-24, max:24, def:0,   step:0.5, unit:'dB' },
  mix:      { label:'MIX',       min:0,   max:100, def:100, step:1,   unit:'%' }
};

export function buildNodes(ctx, params) {
  const input  = ctx.createGain();
  const output = ctx.createGain();

  // === ENCODER M/S ===
  const splitter  = ctx.createChannelSplitter(2);
  const L         = ctx.createGain();   // canal L
  const R         = ctx.createGain();   // canal R
  splitter.connect(L, 0);
  splitter.connect(R, 1);

  // Mid = (L + R) * 0.5       — normalizamos *0.5 para que unity sea 0 dB
  const midSum  = ctx.createGain();
  midSum.gain.value = 0.5;              // CORRECCIÓN
  L.connect(midSum);
  R.connect(midSum);

  // Side = (L - R) * 0.5
  const invertR = ctx.createGain();
  invertR.gain.value = -1;
  R.connect(invertR);
  const sideDiff = ctx.createGain();
  sideDiff.gain.value = 0.5;           // CORRECCIÓN
  L.connect(sideDiff);
  invertR.connect(sideDiff);

  // === PROCESO M/S ===
  const midGainNode  = ctx.createGain();
  midGainNode.gain.value  = dbToGain(params.midGain);
  const sideGainNode = ctx.createGain();
  sideGainNode.gain.value = dbToGain(params.sideGain);
  midSum.connect(midGainNode);
  sideDiff.connect(sideGainNode);

  // === DECODER M/S ===
  // L_out = M + S
  // R_out = M - S
  const leftOut  = ctx.createGain();
  const rightOut = ctx.createGain();
  midGainNode.connect(leftOut);
  sideGainNode.connect(leftOut);
  midGainNode.connect(rightOut);
  const invertSide = ctx.createGain();
  invertSide.gain.value = -1;
  sideGainNode.connect(invertSide);
  invertSide.connect(rightOut);

  // === MIX DRY/WET ===
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

  return {
    input, output,
    midGainNode, sideGainNode, dryGain, wetGain,
    splitter, L, R, midSum, sideDiff, invertR,
    leftOut, rightOut, invertSide, merger
  };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'midGain':  r(nodes.midGainNode.gain,  dbToGain(value)); break;
    case 'sideGain': r(nodes.sideGainNode.gain, dbToGain(value)); break;
    case 'mix':
      r(nodes.wetGain.gain, value / 100);
      r(nodes.dryGain.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':      { midGain:0,   sideGain:0,   mix:100 },
  'Center Boost': { midGain:3,   sideGain:-1,  mix:100 },
  'Widen':        { midGain:0,   sideGain:4,   mix:100 },
  'Mono Maker':   { midGain:0,   sideGain:-24, mix:100 },
  'Side Only':    { midGain:-24, sideGain:0,   mix:100 },
  'Mid Only':     { midGain:0,   sideGain:-24, mix:100 },
  'Warm Center':  { midGain:2,   sideGain:-2,  mix:80  }
};

// ----------------------------------------------------------------
// UI personalizada Mid/Side (barras de balance)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['midside'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  const canvas = document.createElement('canvas');
  canvas.width = 160; canvas.height = 80;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['midGain', 'sideGain', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  function animate() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e'; ctx.fillRect(0, 0, W, H);

    const midGain  = mod.params.midGain;
    const sideGain = mod.params.sideGain;
    const mixVal   = mod.params.mix;
    const margin   = 20, barW = 30, maxH = H - margin * 2;
    const centerX  = W / 2;
    const midX     = centerX - barW - 10;
    const sideX    = centerX + 10;
    const gainToH  = g => ((g + 24) / 48) * maxH;
    const alpha    = 0.3 + mixVal / 100 * 0.6;

    ctx.fillStyle   = `rgba(255,170,68,${alpha})`;
    ctx.fillRect(midX,  margin + maxH - gainToH(midGain),  barW, gainToH(midGain));
    ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = 1;
    ctx.strokeRect(midX, margin + maxH - gainToH(midGain), barW, gainToH(midGain));

    ctx.fillStyle   = `rgba(68,200,255,${alpha})`;
    ctx.fillRect(sideX, margin + maxH - gainToH(sideGain), barW, gainToH(sideGain));
    ctx.strokeStyle = '#44ccff';
    ctx.strokeRect(sideX, margin + maxH - gainToH(sideGain), barW, gainToH(sideGain));

    // Línea de 0 dB
    const zeroY = margin + maxH - gainToH(0);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 0.5;
    ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(W, zeroY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#aaa'; ctx.font = '9px "Share Tech Mono"'; ctx.textAlign = 'center';
    ctx.fillText('MID',  midX  + barW/2, H - 4);
    ctx.fillText('SIDE', sideX + barW/2, H - 4);
    ctx.fillStyle = '#555'; ctx.font = '8px "Share Tech Mono"';
    ctx.fillText('0dB', 8, zeroY + 3);

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
