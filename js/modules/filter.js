// js/modules/filter.js
import { buildKnob, buildToggle, setKnobDisplay, updateToggleDisplay } from '../ui/knobs.js';

export const label = 'FILTRO HP/LP';
export const color = '#00d4b0';

export const params = {
  hpFreq: { label:'HP FREQ', min:10, max:2000, def:80, step:1, unit:'Hz' },
  hpQ:    { label:'HP Q',    min:0.1, max:18, def:0.7, step:0.05, unit:'' },
  hpOn:   { label:'HP ON',   type:'toggle', def:true },
  lpFreq: { label:'LP FREQ', min:1000, max:22000, def:18000, step:10, unit:'Hz' },
  lpQ:    { label:'LP Q',    min:0.1, max:18, def:0.7, step:0.05, unit:'' },
  lpOn:   { label:'LP ON',   type:'toggle', def:true }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = params.hpOn ? params.hpFreq : 10;
  hp.Q.value = params.hpQ;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = params.lpOn ? params.lpFreq : 22050;
  lp.Q.value = params.lpQ;
  input.connect(hp);
  hp.connect(lp);
  lp.connect(output);
  return { input, output, hp, lp };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'hpFreq': r(nodes.hp.frequency, value); break;
    case 'hpQ':    r(nodes.hp.Q, value); break;
    case 'hpOn':   r(nodes.hp.frequency, value ? params.hpFreq : 10); break;
    case 'lpFreq': r(nodes.lp.frequency, value); break;
    case 'lpQ':    r(nodes.lp.Q, value); break;
    case 'lpOn':   r(nodes.lp.frequency, value ? params.lpFreq : 22050); break;
  }
}

export const presets = {
  'Default':    { hpFreq:80, hpQ:0.7, hpOn:true, lpFreq:18000, lpQ:0.7, lpOn:true },
  'Vocal HP':   { hpFreq:120,hpQ:0.8, hpOn:true, lpFreq:16000, lpQ:0.7, lpOn:true },
  'Bass Cut':   { hpFreq:60, hpQ:0.7, hpOn:true, lpFreq:20000, lpQ:0.7, lpOn:false },
  'Hi-Fi':      { hpFreq:30, hpQ:0.6, hpOn:true, lpFreq:20000, lpQ:0.6, lpOn:true },
  'Telephone':  { hpFreq:300,hpQ:1.2, hpOn:true, lpFreq:4000,  lpQ:1.2, lpOn:true },
  'Sub Only':   { hpFreq:20, hpQ:0.5, hpOn:true, lpFreq:120,   lpQ:0.8, lpOn:true },
  'Air Boost':  { hpFreq:80, hpQ:0.7, hpOn:true, lpFreq:10000, lpQ:0.9, lpOn:true }
};

// ----------------------------------------------------------------
// UI personalizada del Filtro HP/LP (curva con dos puntos arrastrables)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['filter'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Canvas para la curva
  const canvas = document.createElement('canvas');
  canvas.className = 'filter-canvas';
  canvas.width = 260;
  canvas.height = 90;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block; touch-action:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Knobs en dos columnas
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:20px; justify-content:center;';

  const hpCol = document.createElement('div');
  hpCol.className = 'band-col';
  const hpLabel = document.createElement('div');
  hpLabel.className = 'band-sep';
  hpLabel.textContent = 'HIGH-PASS';
  hpCol.appendChild(hpLabel);
  hpCol.appendChild(buildKnob(mod, 'hpFreq', def.params.hpFreq, color));
  hpCol.appendChild(buildKnob(mod, 'hpQ', def.params.hpQ, color));
  hpCol.appendChild(buildToggle(mod, 'hpOn', def.params.hpOn, color));
  knobsRow.appendChild(hpCol);

  const lpCol = document.createElement('div');
  lpCol.className = 'band-col';
  const lpLabel = document.createElement('div');
  lpLabel.className = 'band-sep';
  lpLabel.textContent = 'LOW-PASS';
  lpCol.appendChild(lpLabel);
  lpCol.appendChild(buildKnob(mod, 'lpFreq', def.params.lpFreq, color));
  lpCol.appendChild(buildKnob(mod, 'lpQ', def.params.lpQ, color));
  lpCol.appendChild(buildToggle(mod, 'lpOn', def.params.lpOn, color));
  knobsRow.appendChild(lpCol);
  container.appendChild(knobsRow);

  // --- Interacción de arrastre ---
  let dragging = null;

  function freqToX(freq) {
    const W = canvas.width;
    const margin = 30;
    const plotW = W - margin * 2;
    const minFreq = 20, maxFreq = 20000;
    return margin + (Math.log(freq / minFreq) / Math.log(maxFreq / minFreq)) * plotW;
  }

  function xToFreq(x) {
    const W = canvas.width;
    const margin = 30;
    const plotW = W - margin * 2;
    const minFreq = 20, maxFreq = 20000;
    const norm = (x - margin) / plotW;
    return minFreq * Math.exp(norm * Math.log(maxFreq / minFreq));
  }

  function drawCurve() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    const margin = 30;
    const plotW = W - margin * 2;
    const plotH = H - 25;
    const plotX = margin, plotY = 5;

    // Rejilla
    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 0.5;
    const freqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.fillStyle = '#c0c0c0';
    ctx.font = '10px "Share Tech Mono"';
    ctx.textAlign = 'center';
    freqs.forEach(f => {
      const x = freqToX(f);
      ctx.beginPath(); ctx.moveTo(x, plotY); ctx.lineTo(x, plotY + plotH); ctx.stroke();
      ctx.fillText(f < 1000 ? f : (f/1000)+'k', x, plotY + plotH + 12);
    });

    // Curva combinada
    if (mod.nodes && mod.nodes.hp && mod.nodes.lp && window.audioCtx) {
      const freqArray = new Float32Array(plotW);
      for (let i = 0; i < plotW; i++) {
        freqArray[i] = 20 * Math.pow(20000 / 20, i / plotW);
      }
      const mag1 = new Float32Array(plotW);
      const phase1 = new Float32Array(plotW);
      const mag2 = new Float32Array(plotW);
      const phase2 = new Float32Array(plotW);

      mod.nodes.hp.getFrequencyResponse(freqArray, mag1, phase1);
      mod.nodes.lp.getFrequencyResponse(freqArray, mag2, phase2);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      let first = true;
      for (let i = 0; i < plotW; i++) {
        const mag = mag1[i] * mag2[i];
        const db = 20 * Math.log10(Math.max(mag, 1e-6));
        const y = plotY + plotH - ((db + 42) / 44) * plotH;
        if (first) { ctx.moveTo(plotX + i, y); first = false; }
        else ctx.lineTo(plotX + i, y);
      }
      ctx.stroke();
    }

    // Puntos arrastrables
    const hpFreq = mod.params.hpFreq;
    const lpFreq = mod.params.lpFreq;
    const hpOn = mod.params.hpOn;
    const lpOn = mod.params.lpOn;

    [ { freq: hpFreq, type: 'hp', active: hpOn, color: '#ff4444' },
      { freq: lpFreq, type: 'lp', active: lpOn, color: '#4488ff' }
    ].forEach(p => {
      const x = freqToX(p.freq);
      const y = plotY + plotH / 2;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = p.active ? p.color : '#555';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // ** Forzar un primer dibujo inmediato **
  drawCurve();

  // Bucle de animación (redibuja constantemente mientras el módulo esté visible)
  function loop() {
    if (container.isConnected) {
      drawCurve();
    }
    requestAnimationFrame(loop);
  }
  loop();

  // Arrastre de puntos
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const hpX = freqToX(mod.params.hpFreq);
    const lpX = freqToX(mod.params.lpFreq);

    if (Math.abs(mx - hpX) < 12 && mod.params.hpOn) dragging = 'hp';
    else if (Math.abs(mx - lpX) < 12 && mod.params.lpOn) dragging = 'lp';
    else return;

    const onMouseMove = (ev) => {
      if (!dragging) return;
      ev.preventDefault();
      const rect2 = canvas.getBoundingClientRect();
      const mx2 = (ev.clientX - rect2.left) * (canvas.width / rect2.width);
      let newFreq = xToFreq(mx2);
      newFreq = Math.max(20, Math.min(20000, newFreq));

      const key = dragging === 'hp' ? 'hpFreq' : 'lpFreq';
      const pDef = def.params[key];
      const rounded = Math.round(newFreq / pDef.step) * pDef.step;
      const clamped = Math.min(pDef.max, Math.max(pDef.min, rounded));

      if (window.applyParam) window.applyParam(mod, key, clamped);
    };

    const onMouseUp = () => {
      dragging = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  return container;
}
