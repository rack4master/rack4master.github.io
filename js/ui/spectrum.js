// js/ui/spectrum.js
let canvasState = null;
let rafId = null;
let currentMode = 'bars'; // 'bars' o 'line'

export function initSpectrum(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    canvasState = { ctx, w: rect.width, h: rect.height };
  }
  window.addEventListener('resize', resize);
  resize();
}

export function setSpectrumMode(mode) {
  currentMode = mode;
}

function freqToX(freq, maxFreq, plotX, plotW) {
  const f = Math.max(20, Math.min(freq, maxFreq));
  return plotX + (Math.log(f / 20) / Math.log(maxFreq / 20)) * plotW;
}

export function startSpectrumLoop() {
  if (!window.audioCtx || !window.audioCtx.analyserL || !window.audioCtx.analyserR) return;
  const analyserL = window.audioCtx.analyserL;
  const analyserR = window.audioCtx.analyserR;
  const binCount = analyserL.frequencyBinCount;
  const bufL = new Uint8Array(binCount);
  const bufR = new Uint8Array(binCount);
  const maxFreq = window.audioCtx.sampleRate / 2;
  const binWidth = maxFreq / binCount;

  try {
    analyserL.minDecibels = -60;
    analyserL.maxDecibels = 0;
    analyserR.minDecibels = -60;
    analyserR.maxDecibels = 0;
  } catch(e) {}

  function draw() {
    if (!canvasState) { rafId = requestAnimationFrame(draw); return; }
    const ctx = canvasState.ctx;
    const w = canvasState.w;
    const h = canvasState.h;

    analyserL.getByteFrequencyData(bufL);
    analyserR.getByteFrequencyData(bufR);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, w, h);

    const marginLeft = 40;
    const marginBottom = 22;
    const marginTop = 8;
    const marginRight = 12;
    const plotW = w - marginLeft - marginRight;
    const plotH = h - marginTop - marginBottom;
    const plotX = marginLeft;
    const plotY = marginTop;

    // Cuadrícula
    ctx.strokeStyle = 'rgba(180, 180, 200, 0.18)';
    ctx.lineWidth = 0.5;
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '10px "Share Tech Mono", monospace';

    const freqLabels = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.textAlign = 'center';
    freqLabels.forEach(f => {
      if (f > maxFreq) return;
      const x = freqToX(f, maxFreq, plotX, plotW);
      ctx.beginPath();
      ctx.moveTo(x, plotY);
      ctx.lineTo(x, plotY + plotH);
      ctx.stroke();
      ctx.fillText(f < 1000 ? f : (f / 1000) + 'k', x, plotY + plotH + 14);
    });

    const dBs = [-60, -40, -20, 0];
    ctx.textAlign = 'right';
    dBs.forEach(db => {
      const y = plotY + plotH - ((db + 60) / 60) * plotH;
      ctx.beginPath();
      ctx.moveTo(plotX, y);
      ctx.lineTo(plotX + plotW, y);
      ctx.stroke();
      ctx.fillText(db, plotX - 5, y + 3);
    });

    // Construir puntos del espectro, anclando el primero al borde izquierdo
    const points = [];
    const firstAvg = (bufL[1] + bufR[1]) / 2;
    const firstY = plotY + plotH - (firstAvg / 255) * plotH;
    points.push({ x: plotX, y: Math.max(plotY, Math.min(plotY + plotH, firstY)), avg: firstAvg });

    for (let i = 1; i < binCount; i++) {
      const freq = (i + 0.5) * binWidth;
      if (freq > maxFreq) break;
      const avg = (bufL[i] + bufR[i]) / 2;
      const px = freqToX(freq, maxFreq, plotX, plotW);
      const py = plotY + plotH - (avg / 255) * plotH;
      points.push({ x: px, y: Math.max(plotY, Math.min(plotY + plotH, py)), avg });
    }

    if (currentMode === 'bars') {
      for (let pi = 0; pi < points.length; pi++) {
        const p = points[pi];
        const barH = plotY + plotH - p.y;
        if (barH <= 0) continue;
        const nextX = (pi + 1 < points.length) ? points[pi + 1].x : plotX + plotW;
        const bw = Math.max(1, nextX - p.x);
        const hue = (pi / points.length) * 140 + 200;
        ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
        ctx.fillRect(p.x, p.y, bw, barH);
      }
    } else {
      ctx.beginPath();
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ff8c00';
      ctx.shadowBlur = 4;
      ctx.moveTo(points[0].x, points[0].y);
      for (let li = 1; li < points.length; li++) {
        ctx.lineTo(points[li].x, points[li].y);
      }
      ctx.lineTo(plotX + plotW, plotY + plotH);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);
}

export function stopSpectrumLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

export function resizeSpectrum() {
  if (!canvasState || !canvasState.ctx) return;
  const canvas = canvasState.ctx.canvas;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvasState.ctx.setTransform(1, 0, 0, 1, 0, 0);
  canvasState.ctx.scale(dpr, dpr);
  canvasState.w = rect.width;
  canvasState.h = rect.height;
}
