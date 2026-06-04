// js/modules/eq.js
import { buildKnob, setKnobDisplay } from '../ui/knobs.js';

export const label = 'ECUALIZADOR 4-B';
export const color = '#33dd77';
export const wide = true;

export const bands = [
  { prefix: 'b1', label: 'B1 — LOW SHELF',  type: 'lowshelf',  defFreq: 80,    defGain: 0, defQ: 1, color: '#ff5555' },
  { prefix: 'b2', label: 'B2 — LO‑MID',     type: 'peaking',   defFreq: 500,   defGain: 0, defQ: 1, color: '#ffaa00' },
  { prefix: 'b3', label: 'B3 — HI‑MID',     type: 'peaking',   defFreq: 3000,  defGain: 0, defQ: 1, color: '#44dd66' },
  { prefix: 'b4', label: 'B4 — HI SHELF',   type: 'highshelf', defFreq: 10000, defGain: 0, defQ: 1, color: '#4488ff' }
];

export const params = {
  b1Freq: { label:'FREQ', min:20,   max:1000,  def:80,    step:1,   unit:'Hz' },
  b1Gain: { label:'GAIN', min:-18,  max:18,    def:0,     step:0.5, unit:'dB' },
  b1Q:    { label:'Q',    min:0.1,  max:10,    def:1,     step:0.1, unit:'' },
  b2Freq: { label:'FREQ', min:100,  max:5000,  def:500,   step:5,   unit:'Hz' },
  b2Gain: { label:'GAIN', min:-18,  max:18,    def:0,     step:0.5, unit:'dB' },
  b2Q:    { label:'Q',    min:0.1,  max:10,    def:1,     step:0.1, unit:'' },
  b3Freq: { label:'FREQ', min:500,  max:10000, def:3000,  step:10,  unit:'Hz' },
  b3Gain: { label:'GAIN', min:-18,  max:18,    def:0,     step:0.5, unit:'dB' },
  b3Q:    { label:'Q',    min:0.1,  max:10,    def:1,     step:0.1, unit:'' },
  b4Freq: { label:'FREQ', min:2000, max:22000, def:10000, step:50,  unit:'Hz' },
  b4Gain: { label:'GAIN', min:-18,  max:18,    def:0,     step:0.5, unit:'dB' },
  b4Q:    { label:'Q',    min:0.1,  max:10,    def:1,     step:0.1, unit:'' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const b1 = ctx.createBiquadFilter(); b1.type = 'lowshelf';  b1.frequency.value = params.b1Freq; b1.gain.value = params.b1Gain; b1.Q.value = params.b1Q;
  const b2 = ctx.createBiquadFilter(); b2.type = 'peaking';   b2.frequency.value = params.b2Freq; b2.gain.value = params.b2Gain; b2.Q.value = params.b2Q;
  const b3 = ctx.createBiquadFilter(); b3.type = 'peaking';   b3.frequency.value = params.b3Freq; b3.gain.value = params.b3Gain; b3.Q.value = params.b3Q;
  const b4 = ctx.createBiquadFilter(); b4.type = 'highshelf'; b4.frequency.value = params.b4Freq; b4.gain.value = params.b4Gain; b4.Q.value = params.b4Q;
  input.connect(b1); b1.connect(b2); b2.connect(b3); b3.connect(b4); b4.connect(output);
  return { input, output, b1, b2, b3, b4 };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'b1Freq': r(nodes.b1.frequency, value); break;
    case 'b1Gain': r(nodes.b1.gain, value); break;
    case 'b1Q':    r(nodes.b1.Q, value); break;
    case 'b2Freq': r(nodes.b2.frequency, value); break;
    case 'b2Gain': r(nodes.b2.gain, value); break;
    case 'b2Q':    r(nodes.b2.Q, value); break;
    case 'b3Freq': r(nodes.b3.frequency, value); break;
    case 'b3Gain': r(nodes.b3.gain, value); break;
    case 'b3Q':    r(nodes.b3.Q, value); break;
    case 'b4Freq': r(nodes.b4.frequency, value); break;
    case 'b4Gain': r(nodes.b4.gain, value); break;
    case 'b4Q':    r(nodes.b4.Q, value); break;
  }
}

export const presets = {
  'Default': {
    b1Freq: 80, b1Gain: 0, b1Q: 1,
    b2Freq: 500, b2Gain: 0, b2Q: 1,
    b3Freq: 3000, b3Gain: 0, b3Q: 1,
    b4Freq: 10000, b4Gain: 0, b4Q: 1
  },
  'Vocal Warm': {
    b1Freq: 120, b1Gain: 2, b1Q: 0.8,
    b2Freq: 400, b2Gain: 1, b2Q: 1.2,
    b3Freq: 4000, b3Gain: -1, b3Q: 1.5,
    b4Freq: 12000, b4Gain: 2, b4Q: 1
  },
  'Radio Ready': {
    b1Freq: 100, b1Gain: -2, b1Q: 0.7,
    b2Freq: 300, b2Gain: -1, b2Q: 1,
    b3Freq: 4000, b3Gain: 3, b3Q: 1.2,
    b4Freq: 12000, b4Gain: 4, b4Q: 1
  },
  'Bass Cut': {
    b1Freq: 150, b1Gain: -4, b1Q: 0.9,
    b2Freq: 400, b2Gain: -1, b2Q: 1,
    b3Freq: 3000, b3Gain: 0, b3Q: 1,
    b4Freq: 10000, b4Gain: 0, b4Q: 1
  },
  'Treble Boost': {
    b1Freq: 80, b1Gain: 0, b1Q: 1,
    b2Freq: 500, b2Gain: 0, b2Q: 1,
    b3Freq: 5000, b3Gain: 2, b3Q: 1.2,
    b4Freq: 14000, b4Gain: 4, b4Q: 1
  },
  'Mid Scoop': {
    b1Freq: 100, b1Gain: 3, b1Q: 0.8,
    b2Freq: 600, b2Gain: -3, b2Q: 2,
    b3Freq: 4000, b3Gain: 2, b3Q: 1.2,
    b4Freq: 12000, b4Gain: 2, b4Q: 1
  },
  'LP Smile': {
    b1Freq: 120, b1Gain: 4, b1Q: 0.7,
    b2Freq: 800, b2Gain: -2, b2Q: 1.5,
    b3Freq: 5000, b3Gain: -2, b3Q: 1.5,
    b4Freq: 15000, b4Gain: 4, b4Q: 1
  },
  'Tape Saturation EQ': {
    b1Freq: 60, b1Gain: -1, b1Q: 0.9,
    b2Freq: 400, b2Gain: -2, b2Q: 1,
    b3Freq: 3000, b3Gain: 1, b3Q: 1.2,
    b4Freq: 12000, b4Gain: 2, b4Q: 1
  }
};

// ----------------------------------------------------------------
// UI personalizada del EQ 4‑Band (curva con 4 nodos arrastrables)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['eq'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; max-width:100%;';

  // Canvas para la curva
  const canvas = document.createElement('canvas');
  canvas.className = 'eq-canvas';
  canvas.width = 320;
  canvas.height = 140;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block; width:100%; height:auto; max-width:320px; touch-action:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // --- Columnas con todos los knobs (Freq, Gain, Q por banda) ---
  const knobsContainer = document.createElement('div');
  knobsContainer.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; gap:10px;';

  def.bands.forEach(band => {
    const col = document.createElement('div');
    col.className = 'band-col';
    const sep = document.createElement('div');
    sep.className = 'band-sep';
    sep.textContent = band.label;
    col.appendChild(sep);
    ['Freq', 'Gain', 'Q'].forEach(s => {
      const key = band.prefix + s;
      if (def.params[key]) {
        col.appendChild(buildKnob(mod, key, def.params[key], band.color));
      }
    });
    knobsContainer.appendChild(col);
  });
  container.appendChild(knobsContainer);

  // --- Interacción de arrastre ---
  let dragging = null; // 'b1', 'b2', 'b3', 'b4'

  function freqToX(freq) {
    const W = canvas.width;
    const margin = 35;
    const plotW = W - margin * 2;
    const minFreq = 20, maxFreq = 22000;
    return margin + (Math.log(freq / minFreq) / Math.log(maxFreq / minFreq)) * plotW;
  }

  function xToFreq(x) {
    const W = canvas.width;
    const margin = 35;
    const plotW = W - margin * 2;
    const minFreq = 20, maxFreq = 22000;
    const norm = (x - margin) / plotW;
    return minFreq * Math.exp(norm * Math.log(maxFreq / minFreq));
  }

  function drawCurve() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    const margin = 35;
    const plotW = W - margin * 2;
    const plotH = H - 30;
    const plotX = margin, plotY = 8;

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
      ctx.fillText(f < 1000 ? f : (f/1000)+'k', x, plotY + plotH + 14);
    });

    // Líneas horizontales de dB
    for (let db = -18; db <= 18; db += 6) {
      const y = plotY + plotH - ((db + 18) / 36) * plotH;
      ctx.beginPath(); ctx.moveTo(plotX, y); ctx.lineTo(plotX + plotW, y); ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.textAlign = 'right';
      ctx.fillText(db, plotX - 6, y + 4);
    }

    // Curva combinada de los 4 filtros
    if (mod.nodes && mod.nodes.b1 && mod.nodes.b2 && mod.nodes.b3 && mod.nodes.b4 && window.audioCtx) {
      const freqArray = new Float32Array(plotW);
      for (let i = 0; i < plotW; i++) {
        freqArray[i] = 20 * Math.pow(22000 / 20, i / plotW);
      }

      const mags = [[], [], [], []];
      [mod.nodes.b1, mod.nodes.b2, mod.nodes.b3, mod.nodes.b4].forEach((filter, idx) => {
        mags[idx] = new Float32Array(plotW);
        const phase = new Float32Array(plotW);
        filter.getFrequencyResponse(freqArray, mags[idx], phase);
      });

      ctx.beginPath();
      ctx.strokeStyle = '#ffd966';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffd966';
      ctx.shadowBlur = 4;
      let first = true;
      for (let i = 0; i < plotW; i++) {
        let combinedMag = 1.0;
        for (let j = 0; j < 4; j++) combinedMag *= mags[j][i];
        const db = 20 * Math.log10(Math.max(combinedMag, 1e-6));
        const y = plotY + plotH - ((db + 18) / 36) * plotH;
        if (first) { ctx.moveTo(plotX + i, y); first = false; }
        else ctx.lineTo(plotX + i, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Nodos arrastrables
    def.bands.forEach(band => {
      const freq = mod.params[band.prefix + 'Freq'];
      const gain = mod.params[band.prefix + 'Gain'];
      const x = freqToX(freq);
      const y = plotY + plotH - ((gain + 18) / 36) * plotH;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = band.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // Dibujo inicial
  drawCurve();

  // Bucle de animación constante (para reflejar cambios desde knobs y presets)
  function loop() {
    if (container.isConnected) {
      drawCurve();
    }
    requestAnimationFrame(loop);
  }
  loop();

  // Eventos de arrastre
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const band of def.bands) {
      const freq = mod.params[band.prefix + 'Freq'];
      const gain = mod.params[band.prefix + 'Gain'];
      const x = freqToX(freq);
      const plotH = canvas.height - 30;
      const plotY = 8;
      const y = plotY + plotH - ((gain + 18) / 36) * plotH;
      const dist = Math.hypot(mx - x, my - y);
      if (dist < 10) {
        dragging = band.prefix;
        break;
      }
    }

    if (!dragging) return;

    const onMouseMove = (ev) => {
      if (!dragging) return;
      ev.preventDefault();
      const rect2 = canvas.getBoundingClientRect();
      const scaleX2 = canvas.width / rect2.width;
      const scaleY2 = canvas.height / rect2.height;
      const mx2 = (ev.clientX - rect2.left) * scaleX2;
      const my2 = (ev.clientY - rect2.top) * scaleY2;

      const margin = 35;
      const plotW = canvas.width - margin * 2;
      const plotH = canvas.height - 30;
      const plotX = margin, plotY = 8;

      // Frecuencia (log) y ganancia (lineal) a partir de las coordenadas
      let newFreq = xToFreq(mx2);
      newFreq = Math.max(20, Math.min(22000, newFreq));
      const gainNorm = (plotY + plotH - my2) / plotH;
      let newGain = gainNorm * 36 - 18;
      newGain = Math.max(-18, Math.min(18, newGain));

      const freqKey = dragging + 'Freq';
      const gainKey = dragging + 'Gain';
      const pFreq = def.params[freqKey];
      const pGain = def.params[gainKey];

      const roundedFreq = Math.round(newFreq / pFreq.step) * pFreq.step;
      const roundedGain = Math.round(newGain / pGain.step) * pGain.step;

      if (window.applyParam) {
        window.applyParam(mod, freqKey, Math.min(pFreq.max, Math.max(pFreq.min, roundedFreq)));
        window.applyParam(mod, gainKey, Math.min(pGain.max, Math.max(pGain.min, roundedGain)));
      }

      // Actualizar knobs visualmente
      const freqWrap = container.querySelector(`[data-key="${freqKey}"]`);
      const gainWrap = container.querySelector(`[data-key="${gainKey}"]`);
      if (freqWrap) {
        const knob = freqWrap.querySelector('.knob');
        const valEl = freqWrap.querySelector('.knob-val');
        if (knob && valEl) setKnobDisplay(knob, valEl, mod.params[freqKey], pFreq);
      }
      if (gainWrap) {
        const knob = gainWrap.querySelector('.knob');
        const valEl = gainWrap.querySelector('.knob-val');
        if (knob && valEl) setKnobDisplay(knob, valEl, mod.params[gainKey], pGain);
      }
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
