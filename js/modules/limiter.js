// js/modules/limiter.js
// CORREGIDO: attack de 30ms → 1ms (30ms era demasiado lento para un limitador;
// dejaba pasar transientes sin limitar durante 30ms)

import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'LIMITADOR';
export const color = '#ff3366';

export const params = {
  threshold: { label:'THRESH',  min:-30, max:0,  def:-1,  step:0.1, unit:'dB' },
  release:   { label:'RELEASE', min:1,   max:500, def:80,  step:1,   unit:'ms' },
  makeup:    { label:'MAKEUP',  min:0,   max:18,  def:0,   step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input  = ctx.createGain();
  const output = ctx.createGain();
  const comp   = ctx.createDynamicsCompressor();
  const makeup = ctx.createGain();

  comp.threshold.value = params.threshold;
  comp.ratio.value     = 20;
  comp.knee.value      = 0;
  comp.attack.value    = 0.001;   // CORREGIDO: 1 ms (antes: 30 ms = dejaba pasar transientes)
  comp.release.value   = params.release / 1000;
  makeup.gain.value    = dbToGain(params.makeup);

  input.connect(comp);
  comp.connect(makeup);
  makeup.connect(output);
  return { input, output, comp, makeup };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'threshold': r(nodes.comp.threshold, value); break;
    // attack permanece fijo en 1 ms — no exponer al usuario
    case 'release':   r(nodes.comp.release, value / 1000); break;
    case 'makeup':    r(nodes.makeup.gain, dbToGain(value)); break;
  }
}

export const presets = {
  // Thresholds ajustados a targets de streaming real:
  // Spotify/YouTube: −14 LUFS, −1 dBTP  → thresh −1
  // Apple Music:     −16 LUFS, −1 dBTP  → thresh −1
  // EBU R128:        −23 LUFS, −1 dBTP  → thresh −1
  'Default':         { threshold:-1,   release:80,  makeup:0   },
  'Streaming (-1TP)':{ threshold:-1,   release:80,  makeup:0   },
  'Brickwall':       { threshold:-0.3, release:20,  makeup:0   },
  'Mastering':       { threshold:-1,   release:100, makeup:0   },
  'Transparent':     { threshold:-2,   release:150, makeup:0.5 },
  'Aggressive':      { threshold:-0.3, release:15,  makeup:0   },
  'Safe (+makeup)':  { threshold:-3,   release:100, makeup:2   }
};

// ----------------------------------------------------------------
// UI personalizada del Limitador (medidor GR + curva + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['limiter'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  const topRow = document.createElement('div');
  topRow.style.cssText = 'display:flex; gap:12px; align-items:stretch;';

  // Medidor GR
  const grMeter = document.createElement('div');
  grMeter.style.cssText = 'width:20px; background:#0a0a0e; border-radius:4px; border:1px solid #2a2a35; position:relative; overflow:hidden;';
  const grFill = document.createElement('div');
  grFill.style.cssText = 'position:absolute; bottom:0; left:0; right:0; background:#ff3366; transition:height 0.08s linear;';
  grMeter.appendChild(grFill);

  const grLabel = document.createElement('div');
  grLabel.textContent = 'GR';
  grLabel.style.cssText = 'font-family:"Share Tech Mono",monospace; font-size:9px; color:#888; text-align:center; margin-top:2px;';

  const grContainer = document.createElement('div');
  grContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center;';
  grContainer.appendChild(grMeter);
  grContainer.appendChild(grLabel);
  topRow.appendChild(grContainer);

  // Curva de transferencia
  const curveCanvas = document.createElement('canvas');
  curveCanvas.width = 160; curveCanvas.height = 100;
  curveCanvas.style.cssText = 'border:1px solid #2a2a35; border-radius:4px; background:#0a0a0e;';
  topRow.appendChild(curveCanvas);
  container.appendChild(topRow);

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['threshold', 'release', 'makeup'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  function updateGR() {
    if (!mod.nodes?.comp) { requestAnimationFrame(updateGR); return; }
    const pct = Math.min(1, Math.abs(mod.nodes.comp.reduction) / 40);
    grFill.style.height = (pct * 100) + '%';
    requestAnimationFrame(updateGR);
  }
  updateGR();

  function drawCurve() {
    const ctx = curveCanvas.getContext('2d');
    const W = curveCanvas.width, H = curveCanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e'; ctx.fillRect(0, 0, W, H);
    const m = 20, pW = W-m*2, pH = H-m*2, pX = m, pY = m;
    ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const x = pX+(pW/4)*i; ctx.beginPath(); ctx.moveTo(x,pY); ctx.lineTo(x,pY+pH); ctx.stroke();
      const y = pY+(pH/4)*i; ctx.beginPath(); ctx.moveTo(pX,y); ctx.lineTo(pX+pW,y); ctx.stroke();
    }
    const thr = mod.params.threshold;
    const dbToX = db => pX+((db+60)/60)*pW;
    const dbToY = db => pY+pH-((db+60)/60)*pH;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let px = 0; px <= pW; px++) {
      const inDB = (px/pW)*60-60;
      const outDB = inDB > thr ? thr : inDB;
      if (px === 0) ctx.moveTo(pX+px, dbToY(outDB));
      else ctx.lineTo(pX+px, dbToY(outDB));
    }
    ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = '#444'; ctx.lineWidth = 0.5;
    ctx.moveTo(dbToX(-60), dbToY(-60)); ctx.lineTo(dbToX(0), dbToY(0)); ctx.stroke();
  }
  drawCurve();
  setInterval(() => { if (container.isConnected) drawCurve(); }, 100);

  return container;
}
