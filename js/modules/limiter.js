// js/modules/limiter.js
import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'LIMITADOR';
export const color = '#ff3366';

export const params = {
  threshold: { label:'THRESH', min:-30, max:0, def:-3, step:0.1, unit:'dB' },
  release:   { label:'RELEASE',min:1,  max:500,def:100,step:1,  unit:'ms' },
  makeup:    { label:'MAKEUP', min:0,  max:18, def:0, step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  const makeup = ctx.createGain();
  comp.threshold.value = params.threshold;
  comp.ratio.value = 20;
  comp.knee.value = 0;
  comp.attack.value = 0.030;
  comp.release.value = params.release / 1000;
  makeup.gain.value = dbToGain(params.makeup);
  input.connect(comp);
  comp.connect(makeup);
  makeup.connect(output);
  return { input, output, comp, makeup };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'threshold': r(nodes.comp.threshold, value); break;
    case 'release':   r(nodes.comp.release, value / 1000); break;
    case 'makeup':    r(nodes.makeup.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default':      { threshold:-3,   release:100, makeup:0 },
  'Brickwall':    { threshold:-0.5, release:20,  makeup:0 },
  'Safe Limiter': { threshold:-3,   release:100, makeup:2 },
  'Aggressive':   { threshold:-0.2, release:10,  makeup:3 },
  'Mastering':    { threshold:-1.5, release:80,  makeup:1 },
  'Transparent':  { threshold:-2,   release:120, makeup:0.5 },
  'Pumping':      { threshold:-0.8, release:5,   makeup:2 }
};

// ----------------------------------------------------------------
// UI personalizada del Limitador (medidor GR + curva + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['limiter'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Fila superior: medidor GR + curva
  const topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex; gap:12px; align-items:stretch;';

  // Medidor GR
  const grMeter = document.createElement('div');
  grMeter.style.cssText = 'width:20px; background:#0a0a0e; border-radius:4px; border:1px solid #2a2a35; position:relative; overflow:hidden;';
  const grFill = document.createElement('div');
  grFill.style.cssText = 'position:absolute; bottom:0; left:0; right:0; background: #ff3366; transition: height 0.08s linear;';
  grMeter.appendChild(grFill);
  topRow.appendChild(grMeter);

  const grLabel = document.createElement('div');
  grLabel.textContent = 'GR';
  grLabel.style.cssText = 'font-family: "Share Tech Mono", monospace; font-size:9px; color:#888; text-align:center; margin-top:2px;';

  // Curva de transferencia (canvas)
  const curveCanvas = document.createElement('canvas');
  curveCanvas.className = 'limiter-curve-canvas';
  curveCanvas.width = 160;
  curveCanvas.height = 100;
  curveCanvas.style.cssText = 'border:1px solid #2a2a35; border-radius:4px; background:#0a0a0e;';
  topRow.appendChild(curveCanvas);

  const grContainer = document.createElement('div');
  grContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; margin-top:-4px;';
  grMeter.parentNode.insertBefore(grContainer, grMeter.nextSibling);
  grContainer.appendChild(grMeter);
  grContainer.appendChild(grLabel);
  container.appendChild(topRow);

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['threshold', 'release', 'makeup'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // Medidor GR en tiempo real
  function updateGR() {
    if (!mod.nodes || !mod.nodes.comp) {
      requestAnimationFrame(updateGR);
      return;
    }
    const reduction = mod.nodes.comp.reduction;
    const maxReduction = 40;
    const percent = Math.min(1, Math.abs(reduction) / maxReduction);
    grFill.style.height = (percent * 100) + '%';
    requestAnimationFrame(updateGR);
  }
  updateGR();

  // Dibujar curva
  function drawCurve() {
    const ctx = curveCanvas.getContext('2d');
    const W = curveCanvas.width, H = curveCanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    const margin = 20;
    const plotW = W - margin * 2, plotH = H - margin * 2;
    const plotX = margin, plotY = margin;

    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const x = plotX + (plotW / 4) * i;
      ctx.beginPath(); ctx.moveTo(x, plotY); ctx.lineTo(x, plotY + plotH); ctx.stroke();
      const y = plotY + (plotH / 4) * i;
      ctx.beginPath(); ctx.moveTo(plotX, y); ctx.lineTo(plotX + plotW, y); ctx.stroke();
    }

    const thr = mod.params.threshold;
    const dbToX = (db) => plotX + ((db + 60) / 60) * plotW;
    const dbToY = (db) => plotY + plotH - ((db + 60) / 60) * plotH;

    // Curva del limitador (ratio 20:1, rodilla 0)
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let pixelX = 0; pixelX <= plotW; pixelX++) {
      const inputDB = (pixelX / plotW) * 60 - 60;
      let outputDB = inputDB;
      if (inputDB > thr) outputDB = thr; // limitador ideal (techo)
      const x = plotX + pixelX;
      const y = dbToY(outputDB);
      if (pixelX === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Línea de unidad
    ctx.beginPath();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.5;
    ctx.moveTo(dbToX(-60), dbToY(-60));
    ctx.lineTo(dbToX(0), dbToY(0));
    ctx.stroke();
  }
  drawCurve();

  setInterval(() => {
    if (container.isConnected) drawCurve();
  }, 100);

  return container;
}
