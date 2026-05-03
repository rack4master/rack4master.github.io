// js/ui/waveform.js
import { loopEnabled, loopStart, loopEnd } from '../core/state.js';

let wfImageData = null;

export function getWFRect(canvas) {
  return canvas.getBoundingClientRect();
}

export function paintWaveform(ctx, buffer, W, H) {
  ctx.clearRect(0, 0, W, H);
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.ceil(data.length / W));
  const mid = H / 2;
  const amp = mid * 0.88;

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += W / 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(W, mid);
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(255,140,0,0.55)');
  grad.addColorStop(0.5, 'rgba(255,140,0,0.85)');
  grad.addColorStop(1, 'rgba(255,140,0,0.55)');

  ctx.beginPath();
  ctx.moveTo(0, mid);
  for (let i = 0; i < W; i++) {
    let mn = 0, mx = 0;
    for (let j = 0; j < step; j++) {
      const v = data[i * step + j] || 0;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    ctx.lineTo(i, mid + mx * amp);
  }
  for (let i = W - 1; i >= 0; i--) {
    let mn = 0;
    for (let j = 0; j < step; j++) {
      const v = data[i * step + j] || 0;
      if (v < mn) mn = v;
    }
    ctx.lineTo(i, mid + mn * amp);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < W; i++) {
    let mx = 0;
    for (let j = 0; j < step; j++) {
      const v = Math.abs(data[i * step + j] || 0);
      if (v > mx) mx = v;
    }
    if (i === 0) ctx.moveTo(i, mid - mx * amp);
    else ctx.lineTo(i, mid - mx * amp);
  }
  ctx.strokeStyle = 'rgba(255,200,80,0.9)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawWaveformFull(canvas, buffer) {
  if (!buffer) return;
  const wrap = canvas.parentElement;
  const wr = wrap.getBoundingClientRect();
  const W = wr.width, H = wr.height;
  if (W <= 0 || H <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.save();
  ctx.scale(dpr, dpr);
  paintWaveform(ctx, buffer, W, H);
  ctx.restore();
  wfImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  drawOverlay(canvas, 0);
}

export function drawOverlay(canvas, playRatio) {
  if (!wfImageData) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.putImageData(wfImageData, 0, 0);
  ctx.save();
  ctx.scale(dpr, dpr);
  // Usar los valores actuales del estado importado
  const lsX = loopStart * W;
  const leX = loopEnd * W;
  if (loopEnabled) {
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(0, 0, lsX, H);
    ctx.fillRect(leX, 0, W - leX, H);
    ctx.fillStyle = 'rgba(255,220,80,0.06)';
    ctx.fillRect(lsX, 0, leX - lsX, H);
    paintHandle(ctx, lsX, W, H, '#ffcc00', 'S');
    paintHandle(ctx, leX, W, H, '#ff8800', 'E');
  }
  const px = playRatio * W;
  if (playRatio > 0.0001) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, px, H);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(px, 0);
  ctx.lineTo(px, H);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function paintHandle(ctx, x, canvasW, H, color, label) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, H);
  ctx.stroke();
  const fw = 18, fh = 15;
  const flagX = (x + fw + 2 > canvasW) ? x - fw : x;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(flagX, 3, fw, fh, 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, flagX + fw / 2, 3 + fh / 2);
  ctx.textAlign = 'left';
}

// Añadir roundRect si no existe
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x+r, y);
    this.lineTo(x+w-r, y);
    this.quadraticCurveTo(x+w, y, x+w, y+r);
    this.lineTo(x+w, y+h-r);
    this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    this.lineTo(x+r, y+h);
    this.quadraticCurveTo(x, y+h, x, y+h-r);
    this.lineTo(x, y+r);
    this.quadraticCurveTo(x, y, x+r, y);
    return this;
  };
}
