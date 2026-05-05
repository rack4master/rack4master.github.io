// js/modules/compressor.js
import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'COMPRESOR';
export const color = '#ffaa00';

export const params = {
  threshold: { label:'THRESH', min:-60, max:0, def:-18, step:0.5, unit:'dB' },
  ratio:     { label:'RATIO',  min:1,   max:20, def:4,  step:0.1, unit:':1' },
  knee:      { label:'KNEE',   min:0,   max:40, def:10, step:0.5, unit:'dB' },
  attack:    { label:'ATTACK', min:0,   max:500,def:10, step:0.5, unit:'ms' },
  release:   { label:'RELEASE',min:10,  max:1000,def:150,step:1,  unit:'ms' },
  makeup:    { label:'MAKEUP', min:0,   max:24, def:0,  step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  const makeup = ctx.createGain();
  comp.threshold.value = params.threshold;
  comp.ratio.value = params.ratio;
  comp.knee.value = params.knee;
  comp.attack.value = params.attack / 1000;
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
    case 'ratio':     r(nodes.comp.ratio, value); break;
    case 'knee':      r(nodes.comp.knee, value); break;
    case 'attack':    r(nodes.comp.attack, value / 1000); break;
    case 'release':   r(nodes.comp.release, value / 1000); break;
    case 'makeup':    r(nodes.makeup.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default':        { threshold:-18, ratio:4, knee:10, attack:10, release:150, makeup:0 },
  'Vocal Leveler':  { threshold:-24, ratio:3, knee:8,  attack:5,  release:80,  makeup:2 },
  'Drum Smash':     { threshold:-12, ratio:8, knee:0,  attack:1,  release:50,  makeup:4 },
  'Bass Glue':      { threshold:-20, ratio:4, knee:12, attack:20, release:200, makeup:2 },
  'Master Bus':     { threshold:-6,  ratio:2, knee:6,  attack:30, release:300, makeup:0 },
  'Fast Limiter':   { threshold:-10, ratio:12,knee:3,  attack:0.5,release:100, makeup:3 },
  'Smooth Opto':    { threshold:-15, ratio:2.5,knee:15,attack:15, release:250, makeup:1 }
};

// ----------------------------------------------------------------
// UI personalizada del Compresor (medidor GR + curva + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['compressor'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // ---- Fila superior: medidor GR + curva de transferencia ----
  const topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex; gap:12px; align-items:stretch;';

  // ----- Medidor GR (barra vertical) -----
  const grMeter = document.createElement('div');
  grMeter.style.cssText = 'width:20px; background:#0a0a0e; border-radius:4px; border:1px solid #2a2a35; position:relative; overflow:hidden;';
  const grFill = document.createElement('div');
  grFill.style.cssText = 'position:absolute; bottom:0; left:0; right:0; background: #ff8c00; transition: height 0.08s linear;';
  grMeter.appendChild(grFill);
  topRow.appendChild(grMeter);

  // Etiqueta "GR" encima (se añade después)
  const grLabel = document.createElement('div');
  grLabel.textContent = 'GR';
  grLabel.style.cssText = 'font-family: "Share Tech Mono", monospace; font-size:9px; color:#888; text-align:center; margin-top:2px;';

  // ----- Curva de transferencia (canvas) -----
  const curveCanvas = document.createElement('canvas');
  curveCanvas.className = 'comp-curve-canvas';
  curveCanvas.width = 160;
  curveCanvas.height = 100;
  curveCanvas.style.cssText = 'border:1px solid #2a2a35; border-radius:4px; background:#0a0a0e;';
  topRow.appendChild(curveCanvas);
  container.appendChild(topRow);

  // Añadir etiqueta GR debajo del medidor (dentro de un mini contenedor)
  const grContainer = document.createElement('div');
  grContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center; margin-top:-4px;';
  grMeter.parentNode.insertBefore(grContainer, grMeter.nextSibling);
  grContainer.appendChild(grMeter);
  grContainer.appendChild(grLabel);

  // ---- Fila inferior: botones (Thresh, Ratio, Knee, Attack, Release, Makeup) ----
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; justify-content:center;';
  ['threshold', 'ratio', 'knee', 'attack', 'release', 'makeup'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Animación del medidor GR ----
  function updateGR() {
    if (!mod.nodes || !mod.nodes.comp) {
      requestAnimationFrame(updateGR);
      return;
    }
    // DynamicsCompressorNode.reduction devuelve el valor en dB (negativo).
    const reduction = mod.nodes.comp.reduction; // ej. -6
    const maxReduction = 40; // representamos hasta 40 dB de reducción
    const percent = Math.min(1, Math.abs(reduction) / maxReduction);
    grFill.style.height = (percent * 100) + '%';
    requestAnimationFrame(updateGR);
  }
  updateGR();

  // ---- Dibujo de la curva de transferencia ----
  function drawCurve() {
    const ctx = curveCanvas.getContext('2d');
    const W = curveCanvas.width;
    const H = curveCanvas.height;
    ctx.clearRect(0, 0, W, H);
    // Fondo
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    // Ejes
    const margin = 20;
    const plotW = W - margin * 2;
    const plotH = H - margin * 2;
    const plotX = margin, plotY = margin;

    // Rejilla tenue
    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const x = plotX + (plotW / 4) * i;
      ctx.beginPath(); ctx.moveTo(x, plotY); ctx.lineTo(x, plotY + plotH); ctx.stroke();
      const y = plotY + (plotH / 4) * i;
      ctx.beginPath(); ctx.moveTo(plotX, y); ctx.lineTo(plotX + plotW, y); ctx.stroke();
    }

    const thr = mod.params.threshold;
    const ratio = mod.params.ratio;
    const knee = mod.params.knee;

    // Mapear coordenadas: entrada (dB) -> pixels
    const dbToX = (db) => plotX + ((db + 60) / 60) * plotW;
    const dbToY = (db) => plotY + plotH - ((db + 60) / 60) * plotH;

    // Curva de transferencia
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 2;
    for (let pixelX = 0; pixelX <= plotW; pixelX++) {
      const inputDB = (pixelX / plotW) * 60 - 60;
      let outputDB = inputDB;
      if (inputDB >= thr + knee / 2) {
        outputDB = thr + (inputDB - thr) / ratio;
      } else if (inputDB > thr - knee / 2) {
        const kneeBottom = thr - knee / 2;
        const kneeTop = thr + knee / 2;
        const t = (inputDB - kneeBottom) / knee;
        const linearOut = inputDB;
        const compOut = thr + (inputDB - thr) / ratio;
        outputDB = linearOut + (compOut - linearOut) * t;
      }
      const x = plotX + pixelX;
      const y = dbToY(outputDB);
      if (pixelX === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Línea de unidad (sin compresión)
    ctx.beginPath();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.5;
    ctx.moveTo(dbToX(-60), dbToY(-60));
    ctx.lineTo(dbToX(0), dbToY(0));
    ctx.stroke();
  }
  drawCurve();

  // Redibujar curva cada vez que cambien parámetros (aproximación: cada 100ms)
  setInterval(() => {
    if (container.isConnected) drawCurve();
  }, 100);

  return container;
}
