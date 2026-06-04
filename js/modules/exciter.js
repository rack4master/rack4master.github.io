// js/modules/exciter.js
import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'EXCITER';
export const color = '#33dd99';

export const params = {
  cutoff: { label:'CUTOFF', min:1000, max:12000, def:4000, step:50,  unit:'Hz' },
  drive:  { label:'DRIVE',  min:0,    max:100,   def:50,   step:1,   unit:'%' },
  mix:    { label:'MIX',    min:0,    max:100,   def:50,   step:1,   unit:'%' },
  output: { label:'OUTPUT', min:-12,  max:12,    def:0,    step:0.5, unit:'dB' }
};

function buildExciterCurve(drive) {
  const n = 2048;
  const curve = new Float32Array(n);
  const d = Math.min(1, Math.max(0, drive / 100));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    let y = x * (1 + d * x * x);
    if (y > 1.5) y = 1.5;
    if (y < -1.5) y = -1.5;
    curve[i] = y;
  }
  return curve;
}

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = params.cutoff;
  hpFilter.Q.value = 0.7;
  const shaper = ctx.createWaveShaper();
  shaper.oversample = '4x';
  shaper.curve = buildExciterCurve(params.drive);
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - params.mix / 100;
  wetGain.gain.value = params.mix / 100;
  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(params.output);
  input.connect(dryGain);
  input.connect(hpFilter);
  hpFilter.connect(shaper);
  shaper.connect(wetGain);
  dryGain.connect(outGain);
  wetGain.connect(outGain);
  outGain.connect(output);
  return { input, output, hpFilter, shaper, dryGain, wetGain, outGain };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'cutoff': r(nodes.hpFilter.frequency, value); break;
    case 'drive':  nodes.shaper.curve = buildExciterCurve(value); break;
    case 'mix':
      r(nodes.wetGain.gain, value / 100);
      r(nodes.dryGain.gain, 1 - value / 100);
      break;
    case 'output': r(nodes.outGain.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default':           { cutoff:4000, drive:50, mix:50, output:0 },
  'Air Boost':         { cutoff:6000, drive:60, mix:70, output:1 },
  'Subtle Brilliance': { cutoff:5000, drive:30, mix:40, output:0 },
  'Aggressive':        { cutoff:3000, drive:80, mix:80, output:2 },
  'Vocal Presence':    { cutoff:4500, drive:55, mix:60, output:1 },
  'Tape Bright':       { cutoff:8000, drive:40, mix:50, output:0.5 },
  'Soft Enhance':      { cutoff:3500, drive:25, mix:35, output:0 }
};

// ----------------------------------------------------------------
// UI personalizada del Exciter (curva de transferencia + indicador)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['exciter'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Canvas para la curva de transferencia
  const canvas = document.createElement('canvas');
  canvas.className = 'exciter-curve-canvas';
  canvas.width = 200;
  canvas.height = 120;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Indicador de "brillo" añadido (barra horizontal)
  const brightContainer = document.createElement('div');
  brightContainer.style.cssText = 'display:flex; align-items:center; gap:6px; width:200px;';
  const brightLabel = document.createElement('span');
  brightLabel.textContent = 'HARM';
  brightLabel.style.cssText = 'font-family:"Share Tech Mono",monospace; font-size:9px; color:#888;';
  const brightTrack = document.createElement('div');
  brightTrack.style.cssText = 'flex:1; height:4px; background:#1a1a20; border-radius:2px; overflow:hidden;';
  const brightFill = document.createElement('div');
  brightFill.style.cssText = 'height:100%; background:#33dd99; border-radius:2px; transition: width 0.1s linear;';
  brightTrack.appendChild(brightFill);
  brightContainer.appendChild(brightLabel);
  brightContainer.appendChild(brightTrack);
  container.appendChild(brightContainer);

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:10px; justify-content:center;';
  ['cutoff', 'drive', 'mix', 'output'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Dibujo de la curva ----
  function drawCurve() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    const margin = 25;
    const plotW = W - margin * 2;
    const plotH = H - margin * 2;
    const plotX = margin, plotY = margin;

    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const x = plotX + (plotW / 4) * i;
      ctx.beginPath(); ctx.moveTo(x, plotY); ctx.lineTo(x, plotY + plotH); ctx.stroke();
      const y = plotY + (plotH / 4) * i;
      ctx.beginPath(); ctx.moveTo(plotX, y); ctx.lineTo(plotX + plotW, y); ctx.stroke();
    }

    const drive = mod.params.drive;
    // Curva de distorsión armónica par: y = x * (1 + d * x^2)
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    const d = drive / 100;
    for (let pixelX = 0; pixelX <= plotW; pixelX++) {
      const input = (pixelX / plotW) * 2 - 1;
      const output = input * (1 + d * input * input);
      const x = plotX + pixelX;
      const y = plotY + plotH - ((output + 1.5) / 3) * plotH;
      if (pixelX === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    ctx.moveTo(plotX, plotY + plotH/2);
    ctx.lineTo(plotX + plotW, plotY + plotH/2);
    ctx.stroke();
  }

  function updateBright() {
    brightFill.style.width = mod.params.drive + '%';
  }

  drawCurve();
  updateBright();

  setInterval(() => {
    if (container.isConnected) {
      drawCurve();
      updateBright();
    }
  }, 100);

  return container;
}
