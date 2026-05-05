// js/modules/softclipper.js
import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'SOFT CLIPPER';
export const color = '#ff8844';

export const params = {
  drive:  { label:'DRIVE',  min:1,  max:20, def:2,  step:0.5, unit:'x' },
  mix:    { label:'MIX',    min:0,  max:100,def:80, step:1,   unit:'%' },
  output: { label:'OUTPUT', min:-18,max:6,  def:0,  step:0.5, unit:'dB' }
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
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.oversample = '4x';
  shaper.curve = buildSoftClipCurve(params.drive);
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
    case 'drive': nodes.shaper.curve = buildSoftClipCurve(value); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
    case 'output': r(nodes.outGain.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default':         { drive:2,  mix:80, output:0 },
  'Gentle':          { drive:2,  mix:80, output:0 },
  'Aggressive':      { drive:12, mix:100,output:2 },
  'Tape Saturation': { drive:3,  mix:70, output:1 },
  'Transparent':     { drive:1.5,mix:50, output:0 },
  'Pumping':         { drive:8,  mix:100,output:3 },
  'Crisp':           { drive:4,  mix:90, output:1.5 }
};

// ----------------------------------------------------------------
// UI personalizada del Soft Clipper (curva de transferencia + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['softclipper'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Canvas para la curva de transferencia
  const canvas = document.createElement('canvas');
  canvas.className = 'softclipper-curve-canvas';
  canvas.width = 200;
  canvas.height = 120;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Knobs (Drive, Mix, Output)
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:10px; justify-content:center;';
  ['drive', 'mix', 'output'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Dibujo de la curva de transferencia ----
  function drawCurve() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    const margin = 25;
    const plotW = W - margin * 2;
    const plotH = H - margin * 2;
    const plotX = margin, plotY = margin;

    // Rejilla
    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const x = plotX + (plotW / 4) * i;
      ctx.beginPath(); ctx.moveTo(x, plotY); ctx.lineTo(x, plotY + plotH); ctx.stroke();
      const y = plotY + (plotH / 4) * i;
      ctx.beginPath(); ctx.moveTo(plotX, y); ctx.lineTo(plotX + plotW, y); ctx.stroke();
    }

    const drive = mod.params.drive;
    // Curva tanh(x * drive) / tanh(drive)
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    for (let pixelX = 0; pixelX <= plotW; pixelX++) {
      const input = (pixelX / plotW) * 2 - 1; // -1 a 1
      const output = Math.tanh(input * drive) / Math.tanh(drive);
      const x = plotX + pixelX;
      const y = plotY + plotH - ((output + 1) / 2) * plotH;
      if (pixelX === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Línea de unidad
    ctx.beginPath();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    ctx.moveTo(plotX + plotW, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.stroke();
  }

  drawCurve();
  setInterval(() => {
    if (container.isConnected) drawCurve();
  }, 100);

  return container;
}
