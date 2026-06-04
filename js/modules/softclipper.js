// js/modules/softclipper.js
// CORREGIDO: presets 'Default' y 'Gentle' eran idénticos (copy-paste error).
// 'Gentle' ahora tiene drive más bajo y mix reducido.

import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'SOFT CLIPPER';
export const color = '#ff8844';

export const params = {
  drive:  { label:'DRIVE',  min:1,   max:20, def:2,  step:0.5, unit:'x'  },
  mix:    { label:'MIX',    min:0,   max:100, def:80, step:1,   unit:'%'  },
  output: { label:'OUTPUT', min:-18, max:6,  def:0,  step:0.5, unit:'dB' }
};

function buildSoftClipCurve(drive) {
  const n = 2048;
  const curve = new Float32Array(n);
  const d = Math.max(0.1, drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * d) / Math.tanh(d);
  }
  return curve;
}

export function buildNodes(ctx, params) {
  const input   = ctx.createGain();
  const output  = ctx.createGain();
  const dry     = ctx.createGain();
  const wet     = ctx.createGain();
  const shaper  = ctx.createWaveShaper();
  shaper.oversample = '4x';
  shaper.curve  = buildSoftClipCurve(params.drive);
  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(params.output);
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  input.connect(dry);
  input.connect(shaper);
  shaper.connect(wet);
  dry.connect(outGain);
  wet.connect(outGain);
  outGain.connect(output);
  return { input, output, dry, wet, shaper, outGain };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'drive':  nodes.shaper.curve = buildSoftClipCurve(value); break;
    case 'mix':    r(nodes.wet.gain, value/100); r(nodes.dry.gain, 1-value/100); break;
    case 'output': r(nodes.outGain.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default':         { drive:2,   mix:80,  output:0   },
  'Gentle':          { drive:1.5, mix:50,  output:0   },  // CORREGIDO: distinto de Default
  'Transparent':     { drive:1.5, mix:40,  output:0   },
  'Tape Saturation': { drive:3,   mix:70,  output:1   },
  'Aggressive':      { drive:12,  mix:100, output:2   },
  'Pumping':         { drive:8,   mix:100, output:3   },
  'Crisp':           { drive:4,   mix:90,  output:1.5 }
};

// ----------------------------------------------------------------
// UI del Soft Clipper (curva de transferencia + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def   = window.MODULE_DEFS['softclipper'];
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
  ['drive', 'mix', 'output'].forEach(key => {
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
    const d = Math.max(0.1, mod.params.drive);
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 4;
    for (let px = 0; px <= pW; px++) {
      const x_in = (px / pW) * 2 - 1;
      const y_out = Math.tanh(x_in * d) / Math.tanh(d);
      const x = pX + px;
      const y = pY + pH - ((y_out + 1) / 2) * pH;
      if (px === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.strokeStyle = '#555'; ctx.lineWidth = 0.5;
    ctx.moveTo(pX + pW, pY); ctx.lineTo(pX, pY + pH); ctx.stroke();
  }

  drawCurve();
  setInterval(() => { if (container.isConnected) drawCurve(); }, 100);
  return container;
}
