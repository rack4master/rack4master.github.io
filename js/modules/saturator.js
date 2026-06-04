// js/modules/saturator.js
// CORREGIDO: drawCurve del UI usaba tanh(x * drive / 10) como aproximación,
// pero buildSatCurve (el audio real) usa tanh(x * drive) / tanh(drive).
// Ahora la UI dibuja la misma curva que se aplica al audio.

import { buildSatCurve } from '../core/audio.js';
import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'SATURADOR';
export const color = '#ff6633';

export const params = {
  drive:  { label:'DRIVE',  min:1,   max:100, def:2,  step:0.5, unit:'x'  },
  tone:   { label:'TONE',   min:-10, max:10,  def:0,  step:0.5, unit:'dB' },
  mix:    { label:'MIX',    min:0,   max:100, def:50, step:1,   unit:'%'  },
  output: { label:'OUTPUT', min:-18, max:6,   def:0,  step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input  = ctx.createGain();
  const output = ctx.createGain();
  const dry    = ctx.createGain();
  const wet    = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.oversample = '4x';
  const toneF  = ctx.createBiquadFilter();
  toneF.type = 'highshelf';
  toneF.frequency.value = 3000;
  toneF.gain.value = params.tone;
  const outGn  = ctx.createGain();

  dry.gain.value    = 1 - params.mix / 100;
  wet.gain.value    = params.mix / 100;
  shaper.curve      = buildSatCurve(params.drive);
  outGn.gain.value  = dbToGain(params.output);

  input.connect(dry);
  input.connect(shaper);
  shaper.connect(toneF);
  toneF.connect(wet);
  dry.connect(outGn);
  wet.connect(outGn);
  outGn.connect(output);

  return { input, output, dry, wet, shaper, toneF, outGn };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'drive':  nodes.shaper.curve = buildSatCurve(value); break;
    case 'tone':   r(nodes.toneF.gain, value); break;
    case 'mix':    r(nodes.wet.gain, value / 100); r(nodes.dry.gain, 1 - value / 100); break;
    case 'output': r(nodes.outGn.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default':          { drive:2,  tone:0,  mix:50, output:0 },
  'Tube Warmth':      { drive:15, tone:2,  mix:60, output:1 },
  'Tape Saturation':  { drive:8,  tone:1,  mix:70, output:0 },
  'Amp Drive':        { drive:25, tone:3,  mix:80, output:2 },
  'Subtle':           { drive:4,  tone:0,  mix:35, output:0 },
  'Creamy':           { drive:12, tone:-2, mix:65, output:1 },
  'Aggressive':       { drive:40, tone:5,  mix:90, output:3 }
};

// ----------------------------------------------------------------
// UI: drawCurve ahora usa la misma fórmula que buildSatCurve
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def   = window.MODULE_DEFS['saturator'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 120;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:10px; justify-content:center;';
  ['drive', 'tone', 'mix', 'output'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  function drawCurve() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e'; ctx.fillRect(0, 0, W, H);

    const m = 25, pW = W-m*2, pH = H-m*2, pX = m, pY = m;
    ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const x = pX+(pW/4)*i; ctx.beginPath(); ctx.moveTo(x,pY); ctx.lineTo(x,pY+pH); ctx.stroke();
      const y = pY+(pH/4)*i; ctx.beginPath(); ctx.moveTo(pX,y); ctx.lineTo(pX+pW,y); ctx.stroke();
    }

    const d = Math.max(1, mod.params.drive);
    const tanhD = Math.tanh(d);   // denominador = tanh(drive)

    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 4;
    for (let px = 0; px <= pW; px++) {
      const x_in = (px / pW) * 2 - 1;                      // -1 .. +1
      const y_out = Math.tanh(x_in * d) / (tanhD || 1);    // MISMA FÓRMULA que buildSatCurve
      const x = pX + px;
      const y = pY + pH - ((y_out + 1) / 2) * pH;
      if (px === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;

    // Línea de unidad
    ctx.beginPath(); ctx.strokeStyle = '#555'; ctx.lineWidth = 0.5;
    ctx.moveTo(pX, pY + pH); ctx.lineTo(pX + pW, pY); ctx.stroke();
  }

  drawCurve();
  setInterval(() => { if (container.isConnected) drawCurve(); }, 100);

  return container;
}
