// js/ui/meters.js
import { clamp } from '../utils.js';
import { isPlaying } from '../core/state.js';

let vuLEl, vuREl, dbLEl, dbREl, lufsValEl, peakValEl;
let peakHold = 0;
let lufsSum = 0;
let lufsCount = 0;
let vuRafId = null;

export function initMeters() {
  vuLEl = document.getElementById('vu-l');
  vuREl = document.getElementById('vu-r');
  dbLEl = document.getElementById('db-l');
  dbREl = document.getElementById('db-r');
  lufsValEl = document.getElementById('lufs-val');
  peakValEl = document.getElementById('peak-val');

  if (!vuLEl || !vuREl) return;
  [vuLEl, vuREl].forEach(meter => {
    meter.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    meter.appendChild(canvas);
    meter.style.background = 'transparent';
    meter.style.overflow = 'hidden';
  });
  resizeMeterCanvases();
  window.addEventListener('resize', resizeMeterCanvases);
}

function resizeMeterCanvases() {
  if (!vuLEl || !vuREl) return;
  [vuLEl, vuREl].forEach(meter => {
    const canvas = meter.querySelector('canvas');
    if (canvas) {
      canvas.width = meter.clientWidth;
      canvas.height = meter.clientHeight;
    }
  });
}

function drawMeterBar(canvas, percent) {
  if (!canvas) return;
  const w = canvas.width, h = canvas.height;
  if (w === 0 || h === 0) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#22ff66');
  grad.addColorStop(0.45, '#ffcc00');
  grad.addColorStop(1, '#ff2244');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const cut = w * (percent / 100);
  if (cut < w) {
    ctx.fillStyle = '#0c0c10';
    ctx.fillRect(cut, 0, w - cut, h);
  }
}

export function startVU() {
  if (vuRafId) cancelAnimationFrame(vuRafId);
  if (!window.audioCtx || !window.audioCtx.analyserL || !window.audioCtx.analyserR) return;
  const analyserL = window.audioCtx.analyserL;
  const analyserR = window.audioCtx.analyserR;

  // Arrays reutilizables (fuera del closure para evitar GC)
  const bufL = new Float32Array(analyserL.fftSize);
  const bufR = new Float32Array(analyserR.fftSize);

  function tick() {
    if (!isPlaying) return;
    analyserL.getFloatTimeDomainData(bufL);
    analyserR.getFloatTimeDomainData(bufR);
    let peakL = 0, peakR = 0;
    for (let i = 0; i < bufL.length; i++) {
      peakL = Math.max(peakL, Math.abs(bufL[i]));
      peakR = Math.max(peakR, Math.abs(bufR[i]));
    }
    peakL = Math.min(1.0, peakL);
    peakR = Math.min(1.0, peakR);
    const peakDbL = 20 * Math.log10(Math.max(peakL, 1e-6));
    const peakDbR = 20 * Math.log10(Math.max(peakR, 1e-6));
    const dbToPercent = (db) => {
      const minDb = -60, maxDb = 0;
      let p = (db - minDb) / (maxDb - minDb);
      p = Math.min(1, Math.max(0, p));
      p = Math.pow(p, 1.2);
      return p * 100;
    };
    const percentL = dbToPercent(peakDbL);
    const percentR = dbToPercent(peakDbR);
    const canvasL = vuLEl?.querySelector('canvas');
    const canvasR = vuREl?.querySelector('canvas');
    drawMeterBar(canvasL, percentL);
    drawMeterBar(canvasR, percentR);

    const rmsL = Math.sqrt(bufL.reduce((s,v)=>s+v*v,0)/bufL.length);
    const rmsR = Math.sqrt(bufR.reduce((s,v)=>s+v*v,0)/bufR.length);
    const dbL = 20 * Math.log10(Math.max(rmsL, 1e-6));
    const dbR = 20 * Math.log10(Math.max(rmsR, 1e-6));
    if (dbLEl) dbLEl.textContent = dbL.toFixed(1);
    if (dbREl) dbREl.textContent = dbR.toFixed(1);

    const globalPeak = Math.min(1.0, Math.max(peakL, peakR));
    if (globalPeak > peakHold) peakHold = globalPeak;
    else peakHold = Math.max(0, peakHold * 0.999);
    const peakDbHold = 20 * Math.log10(Math.max(peakHold, 1e-6));
    if (peakValEl) {
      peakValEl.textContent = peakDbHold.toFixed(1) + ' dB';
      peakValEl.classList.toggle('clip', peakHold >= 0.99);
    }

    lufsSum += (rmsL * rmsL + rmsR * rmsR) * 0.5;
    lufsCount += 1;
    if (lufsCount % 8 === 0 && lufsValEl) {
      const lufs = lufsCount > 0 ? -0.691 + 10 * Math.log10(Math.max(lufsSum / lufsCount, 1e-10)) : -Infinity;
      lufsValEl.textContent = isFinite(lufs) ? lufs.toFixed(1) + ' LU' : '—';
    }
    vuRafId = requestAnimationFrame(tick);
  }
  vuRafId = requestAnimationFrame(tick);
}

// Nueva función para detener la animación explícitamente
export function stopVU() {
  if (vuRafId) {
    cancelAnimationFrame(vuRafId);
    vuRafId = null;
  }
}

export function resetMeters() {
  peakHold = 0;
  lufsSum = 0;
  lufsCount = 0;
  if (peakValEl) peakValEl.textContent = '—';
  if (lufsValEl) lufsValEl.textContent = '—';
  if (peakValEl) peakValEl.classList.remove('clip');
  if (dbLEl) dbLEl.textContent = '—';
  if (dbREl) dbREl.textContent = '—';
  const cL = vuLEl?.querySelector('canvas');
  const cR = vuREl?.querySelector('canvas');
  if (cL && cR) {
    const ctxL = cL.getContext('2d');
    const ctxR = cR.getContext('2d');
    ctxL.clearRect(0, 0, cL.width, cL.height);
    ctxR.clearRect(0, 0, cR.width, cR.height);
  }
}
