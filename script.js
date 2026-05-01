/* ============================================================
   MASTER RACK — script.js (i18n Ready, Privacy First, Optimized)
   Medidores con gradiente proporcional (canvas)
   ============================================================ */
'use strict';

const MODULE_DEFS = {
  gate: { label:'PUERTA DE RUIDO', color:'#4488ff', params:{ threshold:{ label:'THRESH', min:-96, max:0, def:-40, step:0.5, unit:'dB' }, attack:{ label:'ATTACK', min:0, max:500, def:5, step:0.5, unit:'ms' }, release:{ label:'RELEASE', min:0, max:1000, def:100, step:1, unit:'ms' }, ratio:{ label:'RATIO', min:1, max:20, def:12, step:0.1, unit:':1' }, knee:{ label:'KNEE', min:0, max:40, def:0, step:0.5, unit:'dB' } } },
  filter: { label:'FILTRO HP/LP', color:'#00d4b0', params:{ hpFreq:{ label:'HP FREQ', min:10, max:2000, def:80, step:1, unit:'Hz' }, hpQ:{ label:'HP Q', min:0.1, max:18, def:0.7, step:0.05, unit:'' }, hpOn:{ label:'HP ON', type:'toggle', def:true }, lpFreq:{ label:'LP FREQ', min:1000, max:22000, def:18000, step:10, unit:'Hz' }, lpQ:{ label:'LP Q', min:0.1, max:18, def:0.7, step:0.05, unit:'' }, lpOn:{ label:'LP ON', type:'toggle', def:true } } },
  deesser: { label:'DE-ESSER', color:'#cc44ff', params:{ freq:{ label:'FREQ', min:1000, max:12000, def:5000, step:50, unit:'Hz' }, bandwidth:{ label:'BW (Q)', min:0.1, max:15, def:2, step:0.1, unit:'' }, depth:{ label:'DEPTH', min:-30, max:0, def:-8, step:0.5, unit:'dB' }, threshold:{ label:'THRESH', min:-96, max:0, def:-20, step:0.5, unit:'dB' } } },
  eq: { label:'ECUALIZADOR 4-B', color:'#33dd77', wide:true, bands:[ { prefix:'b1', label:'B1 — LOW SHELF', type:'lowshelf', defFreq:80, defGain:0, defQ:1 }, { prefix:'b2', label:'B2 — LO-MID', type:'peaking', defFreq:500, defGain:0, defQ:1 }, { prefix:'b3', label:'B3 — HI-MID', type:'peaking', defFreq:3000, defGain:0, defQ:1 }, { prefix:'b4', label:'B4 — HI SHELF', type:'highshelf', defFreq:10000, defGain:0, defQ:1 } ], params:{ b1Freq:{ label:'FREQ', min:20, max:1000, def:80, step:1, unit:'Hz' }, b1Gain:{ label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' }, b1Q:{ label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' }, b2Freq:{ label:'FREQ', min:100, max:5000, def:500, step:5, unit:'Hz' }, b2Gain:{ label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' }, b2Q:{ label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' }, b3Freq:{ label:'FREQ', min:500, max:10000, def:3000, step:10, unit:'Hz' }, b3Gain:{ label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' }, b3Q:{ label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' }, b4Freq:{ label:'FREQ', min:2000, max:22000, def:10000, step:50, unit:'Hz' }, b4Gain:{ label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' }, b4Q:{ label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' } } },
  compressor: { label:'COMPRESOR', color:'#ffaa00', params:{ threshold:{ label:'THRESH', min:-60, max:0, def:-18, step:0.5, unit:'dB' }, ratio:{ label:'RATIO', min:1, max:20, def:4, step:0.1, unit:':1' }, knee:{ label:'KNEE', min:0, max:40, def:10, step:0.5, unit:'dB' }, attack:{ label:'ATTACK', min:0, max:500, def:10, step:0.5, unit:'ms' }, release:{ label:'RELEASE', min:10, max:1000, def:150, step:1, unit:'ms' }, makeup:{ label:'MAKEUP', min:0, max:24, def:0, step:0.5, unit:'dB' } } },
  limiter: { label:'LIMITADOR', color:'#ff3366', params:{ threshold:{ label:'THRESH', min:-30, max:0, def:-1, step:0.1, unit:'dB' }, release:{ label:'RELEASE', min:1, max:500, def:50, step:1, unit:'ms' }, makeup:{ label:'MAKEUP', min:0, max:18, def:0, step:0.5, unit:'dB' } } },
  chorus: { label:'CHORUS', color:'#3388ff', params:{ rate:{ label:'RATE', min:0.1, max:10, def:1.5, step:0.1, unit:'Hz' }, depth:{ label:'DEPTH', min:0.1, max:20, def:5, step:0.1, unit:'ms' }, mix:{ label:'MIX', min:0, max:100, def:50, step:1, unit:'%' } } },
  flanger: { label:'FLANGER', color:'#aa33ff', params:{ rate:{ label:'RATE', min:0.1, max:10, def:0.5, step:0.1, unit:'Hz' }, depth:{ label:'DEPTH', min:0.1, max:10, def:2, step:0.1, unit:'ms' }, feedback:{ label:'FEEDBK', min:0, max:90, def:50, step:1, unit:'%' }, mix:{ label:'MIX', min:0, max:100, def:50, step:1, unit:'%' } } },
  tremolo: { label:'TREMOLO', color:'#ff33aa', params:{ rate:{ label:'RATE', min:0.1, max:20, def:5, step:0.1, unit:'Hz' }, depth:{ label:'DEPTH', min:0, max:100, def:60, step:1, unit:'%' } } },
  reverb: { label:'REVERB', color:'#aa66ff', params:{ size:{ label:'SIZE', min:0.1, max:6, def:1.5, step:0.05, unit:'s' }, decay:{ label:'DECAY', min:0.5, max:8, def:2, step:0.1, unit:'x' }, predelay:{ label:'PRE-DLY', min:0, max:100, def:20, step:1, unit:'ms' }, mix:{ label:'MIX', min:0, max:100, def:30, step:1, unit:'%' } } },
  delay: { label:'DELAY', color:'#ffcc33', params:{ time:{ label:'TIME', min:10, max:1000, def:250, step:1, unit:'ms' }, feedback:{ label:'FEEDBK', min:0, max:95, def:40, step:1, unit:'%' }, tone:{ label:'TONE', min:500, max:8000, def:3500, step:50, unit:'Hz' }, mix:{ label:'MIX', min:0, max:100, def:30, step:1, unit:'%' } } },
  widener: { label:'WIDENER', color:'#44ccff', params:{ width:{ label:'WIDTH', min:0, max:30, def:10, step:0.5, unit:'ms' }, mix:{ label:'MIX', min:0, max:100, def:100, step:1, unit:'%' } } },
  saturator: { label:'SATURADOR', color:'#ff6633', params:{ drive:{ label:'DRIVE', min:1, max:100, def:10, step:0.5, unit:'x' }, tone:{ label:'TONE', min:-10, max:10, def:0, step:0.5, unit:'dB' }, mix:{ label:'MIX', min:0, max:100, def:50, step:1, unit:'%' }, output:{ label:'OUTPUT', min:-18, max:6, def:0, step:0.5, unit:'dB' } } },
};

let audioCtx = null;
let audioBuffer = null;
let sourceNode = null;
let analyserL = null;
let analyserR = null;
let chainInput = null;
let chainOutput = null;
let outputGainNode = null;
let startedAt = 0;
let pauseOffset = 0;
let isPlaying = false;
let rafId = null;
let vuRafId = null;
let modules = [];
let nextId = 0;
let activeModuleId = null;
let globalBypass = false;
let loopEnabled = false;
let loopStart = 0;
let loopEnd = 1;
let peakHold = 0;
let lufsSum = 0;
let lufsCount = 0;

// DOM ELEMENTS
const fileInput = document.getElementById('file-input');
const presetInput = document.getElementById('preset-input');
const btnPlay = document.getElementById('btn-play');
const btnStop = document.getElementById('btn-stop');
const btnLoop = document.getElementById('btn-loop');
const icoPlay = document.getElementById('ico-play');
const icoPause = document.getElementById('ico-pause');
const timeCurEl = document.getElementById('time-cur');
const timeTotEl = document.getElementById('time-tot');
const vuLEl = document.getElementById('vu-l');
const vuREl = document.getElementById('vu-r');
const dbLEl = document.getElementById('db-l');
const dbREl = document.getElementById('db-r');
const lufsValEl = document.getElementById('lufs-val');
const peakValEl = document.getElementById('peak-val');
const trackNameEl = document.getElementById('track-name');
const wfCanvas = document.getElementById('wf-canvas');
const wfWrap = document.getElementById('wf-wrap');
const wfEmpty = document.getElementById('wf-empty');
const chainArea = document.getElementById('chain-area');
const chainPlaceholder = document.getElementById('chain-placeholder');
const editorArea = document.getElementById('editor-area');
const editorPlaceholder = document.getElementById('editor-placeholder');
const sidebarList = document.getElementById('sidebar-list');
const btnSavePreset = document.getElementById('btn-save-preset');
const btnLoadPreset = document.getElementById('btn-load-preset');
const btnClear = document.getElementById('btn-clear');
const btnExportWav = document.getElementById('btn-export-wav');
const btnPeakRst = document.getElementById('btn-peak-rst');
const catSelect = document.getElementById('cat-select');
const outGainKnobEl = document.getElementById('out-gain-knob');
const outGainValEl = document.getElementById('out-gain-val');
const instrumentSelect = document.getElementById('instrument-select');
const btnGlobalBypass = document.getElementById('btn-global-bypass');

// ═══════════════════════════════════════════════════════════════
//  I18N ENGINE (TRADUCCIONES) - FIXED
// ═══════════════════════════════════════════════════════════════
let currentLang = 'en';

function getTranslation(key) {
  if (typeof LANG !== 'undefined' && LANG[currentLang] && LANG[currentLang][key]) {
    return LANG[currentLang][key];
  }
  return null;
}

function setLanguage(langCode) {
  if (typeof LANG === 'undefined' || !LANG[langCode]) {
    console.warn("Language dictionary not found for:", langCode);
    return;
  }
  currentLang = langCode;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (LANG[langCode][key]) {
      el.innerHTML = LANG[langCode][key];
    }
  });

  if (!audioBuffer && trackNameEl) {
    trackNameEl.textContent = getTranslation('ui.no_audio');
  }

  modules.forEach(m => {
    const translatedName = getTranslation('mod.' + m.type) || MODULE_DEFS[m.type].label;
    if(m.cardEl) m.cardEl.querySelector('.mod-title').textContent = translatedName;
    if(m.thumbEl) m.thumbEl.querySelector('.thumb-title').textContent = translatedName;
  });

  if (sidebarList) {
    sidebarList.querySelectorAll('.slot').forEach(slot => {
      const type = slot.dataset.type;
      const translatedName = getTranslation('mod.' + type) || MODULE_DEFS[type].label;
      const nameEl = slot.querySelector('.slot-name');
      if(nameEl) nameEl.textContent = translatedName;
    });
  }
}

// AUDIO CONTEXT & ROUTING
function ensureCtx() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyserL = audioCtx.createAnalyser(); analyserL.fftSize = 512;
  analyserR = audioCtx.createAnalyser(); analyserR.fftSize = 512;
  const splitter = audioCtx.createChannelSplitter(2);
  const merger = audioCtx.createChannelMerger(2);
  chainInput = audioCtx.createGain();
  chainOutput = audioCtx.createGain();
  outputGainNode = audioCtx.createGain(); outputGainNode.gain.value = 1.0;
  chainOutput.connect(outputGainNode);
  outputGainNode.connect(splitter);
  splitter.connect(analyserL, 0); splitter.connect(analyserR, 1);
  splitter.connect(merger, 0, 0); splitter.connect(merger, 1, 1);
  merger.connect(audioCtx.destination);
}

// FILE LOADING
fileInput.addEventListener('change', e => { if (e.target.files[0]) loadAudioFile(e.target.files[0]); });
wfWrap.addEventListener('dragover', e => { e.preventDefault(); wfWrap.classList.add('drag-over'); });
wfWrap.addEventListener('dragleave', () => wfWrap.classList.remove('drag-over'));
wfWrap.addEventListener('drop', e => { e.preventDefault(); wfWrap.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('audio/')) loadAudioFile(f); });
wfWrap.addEventListener('click', () => { if (!audioBuffer) fileInput.click(); });
document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('audio/')) loadAudioFile(f); });

async function loadAudioFile(file) {
  ensureCtx(); stopPlayback(); trackNameEl.textContent = '⟳ Decoding…';
  const ab = await file.arrayBuffer(); audioBuffer = await audioCtx.decodeAudioData(ab);
  trackNameEl.textContent = file.name; timeTotEl.textContent = fmtTime(audioBuffer.duration); timeCurEl.textContent = '00:00.0';
  pauseOffset = 0; loopStart = 0; loopEnd = 1; resetMeters(); drawWaveformFull();
  wfEmpty.classList.add('hidden'); btnPlay.disabled = false; btnStop.disabled = false;
}

let wfImageData = null;
function getWFRect() { return wfCanvas.getBoundingClientRect(); }
function drawWaveformFull() {
  if (!audioBuffer) return;
  const wr = wfWrap.getBoundingClientRect(); const W = wr.width, H = wr.height; if (W <= 0 || H <= 0) return;
  const dpr = window.devicePixelRatio || 1; wfCanvas.width = Math.round(W * dpr); wfCanvas.height = Math.round(H * dpr);
  const ctx2 = wfCanvas.getContext('2d', { willReadFrequently: true });
  ctx2.save(); ctx2.scale(dpr, dpr); _paintWaveform(ctx2, audioBuffer, W, H); ctx2.restore();
  wfImageData = ctx2.getImageData(0, 0, wfCanvas.width, wfCanvas.height); drawOverlay(0);
}
function _paintWaveform(ctx2, buffer, W, H) {
  ctx2.clearRect(0, 0, W, H); const data = buffer.getChannelData(0); const step = Math.max(1, Math.ceil(data.length / W)); const mid = H / 2; const amp = mid * 0.88;
  ctx2.strokeStyle = 'rgba(255,255,255,0.03)'; ctx2.lineWidth = 1;
  for (let x = 0; x < W; x += W / 8) { ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, H); ctx2.stroke(); }
  ctx2.beginPath(); ctx2.moveTo(0, mid); ctx2.lineTo(W, mid); ctx2.stroke();
  const grad = ctx2.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, 'rgba(255,140,0,0.55)'); grad.addColorStop(0.5, 'rgba(255,140,0,0.85)'); grad.addColorStop(1, 'rgba(255,140,0,0.55)');
  ctx2.beginPath(); ctx2.moveTo(0, mid);
  for (let i = 0; i < W; i++) { let mn=0, mx=0; for (let j=0; j<step; j++) { const v=data[i*step+j]||0; if(v<mn)mn=v; if(v>mx)mx=v; } ctx2.lineTo(i, mid + mx * amp); }
  for (let i = W-1; i >= 0; i--) { let mn=0; for (let j=0; j<step; j++) { const v=data[i*step+j]||0; if(v<mn)mn=v; } ctx2.lineTo(i, mid + mn * amp); }
  ctx2.closePath(); ctx2.fillStyle = grad; ctx2.fill();
  ctx2.beginPath();
  for (let i = 0; i < W; i++) { let mx=0; for (let j=0; j<step; j++) { const v=Math.abs(data[i*step+j]||0); if(v>mx)mx=v; } i===0 ? ctx2.moveTo(i, mid-mx*amp) : ctx2.lineTo(i, mid-mx*amp); }
  ctx2.strokeStyle = 'rgba(255,200,80,0.9)'; ctx2.lineWidth = 1; ctx2.stroke();
}
function drawOverlay(playRatio) {
  if (!audioBuffer || !wfImageData) return;
  const dpr = window.devicePixelRatio || 1; const W = wfCanvas.width / dpr; const H = wfCanvas.height / dpr;
  const ctx2 = wfCanvas.getContext('2d', { willReadFrequently: true });
  ctx2.putImageData(wfImageData, 0, 0); ctx2.save(); ctx2.scale(dpr, dpr);
  const lsX = loopStart * W; const leX = loopEnd * W;
  if (loopEnabled) {
    ctx2.fillStyle = 'rgba(0,0,0,0.52)'; ctx2.fillRect(0, 0, lsX, H); ctx2.fillRect(leX, 0, W - leX, H);
    ctx2.fillStyle = 'rgba(255,220,80,0.06)'; ctx2.fillRect(lsX, 0, leX - lsX, H);
    _paintHandle(ctx2, lsX, W, H, '#ffcc00', 'S'); _paintHandle(ctx2, leX, W, H, '#ff8800', 'E');
  }
  const px = playRatio * W;
  if (playRatio > 0.0001) { ctx2.fillStyle = 'rgba(0,0,0,0.28)'; ctx2.fillRect(0, 0, px, H); }
  ctx2.strokeStyle = 'rgba(255,255,255,0.88)'; ctx2.lineWidth = 1.5; ctx2.setLineDash([3, 3]);
  ctx2.beginPath(); ctx2.moveTo(px, 0); ctx2.lineTo(px, H); ctx2.stroke(); ctx2.setLineDash([]); ctx2.restore();
}
function _paintHandle(ctx2, x, canvasW, H, color, label) {
  ctx2.strokeStyle = color; ctx2.lineWidth = 2; ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, H); ctx2.stroke();
  const fw = 18, fh = 15; const flagX = (x + fw + 2 > canvasW) ? x - fw : x;
  ctx2.fillStyle = color; ctx2.beginPath(); ctx2.roundRect(flagX, 3, fw, fh, 2); ctx2.fill();
  ctx2.fillStyle = '#000'; ctx2.font = 'bold 9px monospace'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle'; ctx2.fillText(label, flagX + fw / 2, 3 + fh / 2); ctx2.textAlign = 'left';
}
window.addEventListener('resize', () => { if (audioBuffer) drawWaveformFull(); });

const HANDLE_HIT = 14; let wfDragging = null;
wfCanvas.addEventListener('mousedown', e => {
  if (!audioBuffer) return; const rect = getWFRect(); const x = e.clientX - rect.left; const W = rect.width;
  const lsX = loopStart * W; const leX = loopEnd * W;
  if (loopEnabled && Math.abs(x - lsX) < HANDLE_HIT) wfDragging = 'loopStart';
  else if (loopEnabled && Math.abs(x - leX) < HANDLE_HIT) wfDragging = 'loopEnd';
  else { wfDragging = 'seek'; seekTo(x / W); } e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (!wfDragging || !audioBuffer) return;
  const rect = getWFRect(); const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  const curRatio = isPlaying ? (audioCtx.currentTime - startedAt) / audioBuffer.duration : pauseOffset / audioBuffer.duration;
  if (wfDragging === 'seek') seekTo(ratio);
  else if (wfDragging === 'loopStart') { loopStart = Math.min(ratio, loopEnd - 0.02); drawOverlay(clamp(curRatio, 0, 1)); }
  else if (wfDragging === 'loopEnd') { loopEnd = Math.max(ratio, loopStart + 0.02); drawOverlay(clamp(curRatio, 0, 1)); }
});
window.addEventListener('mouseup', () => { wfDragging = null; wfCanvas.style.cursor = ''; });
wfCanvas.addEventListener('mousemove', e => {
  if (!audioBuffer || wfDragging) return; if (!loopEnabled) { wfCanvas.style.cursor = 'pointer'; return; }
  const rect = getWFRect(); const x = e.clientX - rect.left; const W = rect.width;
  const near = Math.abs(x - loopStart*W) < HANDLE_HIT || Math.abs(x - loopEnd*W) < HANDLE_HIT;
  wfCanvas.style.cursor = near ? 'ew-resize' : 'pointer';
});
function seekTo(ratio) {
  const r = clamp(ratio, 0, 1); const t = r * audioBuffer.duration; const wasPlaying = isPlaying;
  stopPlayback(false); pauseOffset = t; timeCurEl.textContent = fmtTime(t); drawOverlay(r);
  if (wasPlaying) startPlayback(t);
}

// TRANSPORT
btnLoop && btnLoop.addEventListener('click', () => {
  loopEnabled = !loopEnabled; btnLoop.classList.toggle('is-loop', loopEnabled);
  const cur = audioBuffer ? clamp((isPlaying ? audioCtx.currentTime - startedAt : pauseOffset) / audioBuffer.duration, 0, 1) : 0;
  drawOverlay(cur);
});
btnPlay.addEventListener('click', () => { ensureCtx(); if (audioCtx.state === 'suspended') audioCtx.resume(); isPlaying ? pausePlayback() : startPlayback(pauseOffset); });
btnStop.addEventListener('click', () => stopPlayback());
function startPlayback(offset = 0) {
  if (!audioBuffer) return; ensureCtx(); if (audioCtx.state === 'suspended') audioCtx.resume();
  if (loopEnabled) { const ls = loopStart * audioBuffer.duration; const le = loopEnd * audioBuffer.duration; if (offset < ls || offset >= le) offset = ls; }
  sourceNode = audioCtx.createBufferSource(); sourceNode.buffer = audioBuffer; sourceNode.connect(chainInput);
  startedAt = audioCtx.currentTime - offset; isPlaying = true; rewireChain(); sourceNode.start(0, offset);
  setPlayUI(true); sourceNode.onended = () => { if (isPlaying && !loopEnabled) stopPlayback(); }; startTimeDisplay(); startVU();
}
function pausePlayback() {
  if (!isPlaying) return; pauseOffset = audioCtx.currentTime - startedAt;
  try { sourceNode && sourceNode.stop(); } catch(e){}
  sourceNode = null; isPlaying = false; setPlayUI(false); cancelAnimationFrame(rafId); cancelAnimationFrame(vuRafId);
}
function stopPlayback(resetOffset = true) {
  try { sourceNode && sourceNode.stop(); } catch(e){}
  sourceNode = null; isPlaying = false;
  if (resetOffset) { pauseOffset = 0; timeCurEl.textContent = '00:00.0'; if (audioBuffer) drawOverlay(0); }
  setPlayUI(false); cancelAnimationFrame(rafId); cancelAnimationFrame(vuRafId);
  // Limpiar canvas de medidores visualmente
  const canvasL = vuLEl?.querySelector('canvas');
  const canvasR = vuREl?.querySelector('canvas');
  if (canvasL && canvasR) {
    const ctxL = canvasL.getContext('2d');
    const ctxR = canvasR.getContext('2d');
    ctxL.clearRect(0, 0, canvasL.width, canvasL.height);
    ctxR.clearRect(0, 0, canvasR.width, canvasR.height);
  }
}
function setPlayUI(playing) { icoPlay.style.display = playing ? 'none' : ''; icoPause.style.display = playing ? '' : 'none'; btnPlay.classList.toggle('is-playing', playing); }
function startTimeDisplay() {
  cancelAnimationFrame(rafId);
  function tick() {
    if (!isPlaying) return;
    const cur = audioCtx.currentTime - startedAt; const dur = audioBuffer.duration; const ratio = clamp(cur / dur, 0, 1);
    timeCurEl.textContent = fmtTime(Math.min(cur, dur)); drawOverlay(ratio);
    if (loopEnabled && cur >= loopEnd * dur) { try { sourceNode && sourceNode.stop(); } catch(e){} sourceNode = null; startPlayback(loopStart * dur); return; }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

// ═══════════════════════════════════════════════════════════════
//  MEDIDORES CON GRADIENTE PROPORCIONAL (CANVAS)
// ═══════════════════════════════════════════════════════════════
function initMeterCanvases() {
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
  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // Gradiente fijo en todo el ancho del canvas
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#22ff66');    // verde
  grad.addColorStop(0.45, '#ffcc00'); // naranja
  grad.addColorStop(1, '#ff2244');    // rojo

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Tapar la parte no activa
  const cut = w * (percent / 100);
  if (cut < w) {
    ctx.fillStyle = '#0c0c10'; // mismo color que el fondo del medidor
    ctx.fillRect(cut, 0, w - cut, h);
  }
}

function startVU() {
  cancelAnimationFrame(vuRafId);

  // Asegurar que existen los canvas
  if (!vuLEl || !vuREl) return;
  let canvasL = vuLEl.querySelector('canvas');
  let canvasR = vuREl.querySelector('canvas');
  if (!canvasL || !canvasR) {
    initMeterCanvases();   // función que ya debe existir
    canvasL = vuLEl.querySelector('canvas');
    canvasR = vuREl.querySelector('canvas');
    if (!canvasL || !canvasR) return;
  }

  const bufL = new Float32Array(analyserL.fftSize);
  const bufR = new Float32Array(analyserR.fftSize);

  function tick() {
    if (!isPlaying) return;

    // Obtener datos del analizador
    analyserL.getFloatTimeDomainData(bufL);
    analyserR.getFloatTimeDomainData(bufR);

    // Pico instantáneo (máximo absoluto en el bloque)
    let peakL = 0, peakR = 0;
    for (let i = 0; i < bufL.length; i++) {
      peakL = Math.max(peakL, Math.abs(bufL[i]));
      peakR = Math.max(peakR, Math.abs(bufR[i]));
    }
    // Limitar a 0 dBFS (1.0)
    peakL = Math.min(1.0, peakL);
    peakR = Math.min(1.0, peakR);

    // Convertir a dB
    const peakDbL = 20 * Math.log10(Math.max(peakL, 1e-6));
    const peakDbR = 20 * Math.log10(Math.max(peakR, 1e-6));

    // Escala de -60 dB a 0 dB -> 0% a 100% (con curva suave)
    const dbToPercent = (db) => {
      const minDb = -60;
      const maxDb = 0;
      let p = (db - minDb) / (maxDb - minDb);
      p = Math.min(1, Math.max(0, p));
      p = Math.pow(p, 1.2);   // curva para mejor respuesta en niveles bajos
      return p * 100;
    };

    const percentL = dbToPercent(peakDbL);
    const percentR = dbToPercent(peakDbR);

    // Dibujar las barras (solo ancho, el color lo da el gradiente tapado)
    drawMeterBar(canvasL, percentL);
    drawMeterBar(canvasR, percentR);

    // ---- Textos RMS (estables) ----
    const rmsL = Math.sqrt(bufL.reduce((s, v) => s + v * v, 0) / bufL.length);
    const rmsR = Math.sqrt(bufR.reduce((s, v) => s + v * v, 0) / bufR.length);
    const dbL = 20 * Math.log10(Math.max(rmsL, 1e-6));
    const dbR = 20 * Math.log10(Math.max(rmsR, 1e-6));
    if (dbLEl) dbLEl.textContent = dbL.toFixed(1);
    if (dbREl) dbREl.textContent = dbR.toFixed(1);

    // ---- Pico HOLD (con caída lenta) ----
    const globalPeak = Math.min(1.0, Math.max(peakL, peakR));
    if (globalPeak > peakHold) {
      peakHold = globalPeak;
    } else {
      peakHold = Math.max(0, peakHold * 0.999); // decaimiento
    }
    const peakDbHold = 20 * Math.log10(Math.max(peakHold, 1e-6));
    if (peakValEl) {
      peakValEl.textContent = peakDbHold.toFixed(1) + ' dB';
      peakValEl.classList.toggle('clip', peakHold >= 0.99);
    }

    // ---- LUFS aproximado (mono) ----
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

function resetMeters() {
  peakHold = 0;
  lufsSum = 0;
  lufsCount = 0;
  peakValEl.textContent = '—';
  lufsValEl.textContent = '—';
  peakValEl.classList.remove('clip');
  dbLEl.textContent = '—';
  dbREl.textContent = '—';
  if (vuLEl && vuREl) {
    const cL = vuLEl.querySelector('canvas');
    const cR = vuREl.querySelector('canvas');
    if (cL && cR) {
      const ctxL = cL.getContext('2d');
      const ctxR = cR.getContext('2d');
      ctxL.clearRect(0, 0, cL.width, cL.height);
      ctxR.clearRect(0, 0, cR.width, cR.height);
    }
  }
}
window.addEventListener('resize', () => resizeMeterCanvases());

// CHAIN WIRING
function rewireChain() {
  if (!audioCtx) return;
  try { chainInput.disconnect(); } catch(e){}
  modules.forEach(m => { try { m.nodes.output.disconnect(); } catch(e){} });
  const domIds = [...chainArea.querySelectorAll('.mod-thumb')].map(el => +el.dataset.id);
  const ordered = domIds.map(id => modules.find(m => m.id === id)).filter(Boolean);
  const active = globalBypass ? [] : ordered.filter(m => !m.bypassed);
  if (active.length === 0) { chainInput.connect(chainOutput); }
  else {
    chainInput.connect(active[0].nodes.input);
    for (let i = 0; i < active.length-1; i++) active[i].nodes.output.connect(active[i+1].nodes.input);
    active[active.length-1].nodes.output.connect(chainOutput);
  }
}

function buildReverbIR(ctx, size, decay) { const len = Math.max(1, Math.floor(ctx.sampleRate * size)); const buf = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) { d[i] = (Math.random()*2-1) * Math.pow(Math.max(1 - i/len, 0), decay); } } return buf; }
function buildSatCurve(drive) { const n = 512, curve = new Float32Array(n); const d = Math.max(1, drive); for (let i = 0; i < n; i++) { const x = i * 2/n - 1; curve[i] = Math.tanh(x * d) / Math.tanh(d > 0 ? d : 1); } return curve; }

function buildAudioNodes(type, params, offlineCtx = null) {
  const ctx = offlineCtx || audioCtx; if (!offlineCtx) ensureCtx();
  const input = ctx.createGain(); const output = ctx.createGain(); let extra = {};
  if (type === 'gate') { const comp = ctx.createDynamicsCompressor(); comp.threshold.value=params.threshold; comp.ratio.value=params.ratio; comp.knee.value=params.knee; comp.attack.value=params.attack/1000; comp.release.value=params.release/1000; input.connect(comp); comp.connect(output); extra={comp}; }
  else if (type === 'filter') { const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=params.hpOn?params.hpFreq:10; hp.Q.value=params.hpQ; const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=params.lpOn?params.lpFreq:22050; lp.Q.value=params.lpQ; input.connect(hp); hp.connect(lp); lp.connect(output); extra={hp,lp}; }
  else if (type === 'deesser') { const notch=ctx.createBiquadFilter(); notch.type='peaking'; notch.frequency.value=params.freq; notch.Q.value=params.bandwidth; notch.gain.value=params.depth; input.connect(notch); notch.connect(output); extra={notch}; }
  else if (type === 'eq') { const b1=ctx.createBiquadFilter(); b1.type='lowshelf'; b1.frequency.value=params.b1Freq; b1.gain.value=params.b1Gain; b1.Q.value=params.b1Q; const b2=ctx.createBiquadFilter(); b2.type='peaking'; b2.frequency.value=params.b2Freq; b2.gain.value=params.b2Gain; b2.Q.value=params.b2Q; const b3=ctx.createBiquadFilter(); b3.type='peaking'; b3.frequency.value=params.b3Freq; b3.gain.value=params.b3Gain; b3.Q.value=params.b3Q; const b4=ctx.createBiquadFilter(); b4.type='highshelf'; b4.frequency.value=params.b4Freq; b4.gain.value=params.b4Gain; b4.Q.value=params.b4Q; input.connect(b1); b1.connect(b2); b2.connect(b3); b3.connect(b4); b4.connect(output); extra={b1,b2,b3,b4}; }
  else if (type === 'compressor') { const comp=ctx.createDynamicsCompressor(); const makeup=ctx.createGain(); comp.threshold.value=params.threshold; comp.ratio.value=params.ratio; comp.knee.value=params.knee; comp.attack.value=params.attack/1000; comp.release.value=params.release/1000; makeup.gain.value=dbToGain(params.makeup); input.connect(comp); comp.connect(makeup); makeup.connect(output); extra={comp,makeup}; }
  else if (type === 'limiter') { const comp=ctx.createDynamicsCompressor(); const makeup=ctx.createGain(); comp.threshold.value=params.threshold; comp.ratio.value=20; comp.knee.value=0; comp.attack.value=0.0005; comp.release.value=params.release/1000; makeup.gain.value=dbToGain(params.makeup); input.connect(comp); comp.connect(makeup); makeup.connect(output); extra={comp,makeup}; }
  else if (type === 'chorus') { const dry=ctx.createGain(), wet=ctx.createGain(); const delay=ctx.createDelay(1.0); delay.delayTime.value=0.025; const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=params.rate; const lfoGain=ctx.createGain(); lfoGain.gain.value=params.depth/1000; lfo.connect(lfoGain); lfoGain.connect(delay.delayTime); lfo.start(0); dry.gain.value=1-params.mix/100; wet.gain.value=params.mix/100; input.connect(dry); input.connect(delay); delay.connect(wet); dry.connect(output); wet.connect(output); extra={dry,wet,delay,lfo,lfoGain}; }
  else if (type === 'flanger') { const dry=ctx.createGain(), wet=ctx.createGain(); const delay=ctx.createDelay(1.0); delay.delayTime.value=0.005; const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=params.rate; const lfoGain=ctx.createGain(); lfoGain.gain.value=params.depth/1000; lfo.connect(lfoGain); lfoGain.connect(delay.delayTime); lfo.start(0); const fb=ctx.createGain(); fb.gain.value=params.feedback/100; delay.connect(fb); fb.connect(delay); dry.gain.value=1-params.mix/100; wet.gain.value=params.mix/100; input.connect(dry); input.connect(delay); delay.connect(wet); dry.connect(output); wet.connect(output); extra={dry,wet,delay,lfo,lfoGain,fb}; }
  else if (type === 'tremolo') { const tremGain=ctx.createGain(); tremGain.gain.value=1-(params.depth/200); const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=params.rate; const lfoGain=ctx.createGain(); lfoGain.gain.value=params.depth/200; lfo.connect(lfoGain); lfoGain.connect(tremGain.gain); lfo.start(0); input.connect(tremGain); tremGain.connect(output); extra={tremGain,lfo,lfoGain}; }
  else if (type === 'reverb') { const dry=ctx.createGain(); const wet=ctx.createGain(); const preDly=ctx.createDelay(0.15); const conv=ctx.createConvolver(); dry.gain.value=1-params.mix/100; wet.gain.value=params.mix/100; preDly.delayTime.value=params.predelay/1000; conv.buffer=buildReverbIR(ctx, params.size, params.decay); input.connect(dry); input.connect(preDly); preDly.connect(conv); conv.connect(wet); dry.connect(output); wet.connect(output); extra={dry,wet,preDly,conv}; }
  else if (type === 'delay') { const dry=ctx.createGain(); const wet=ctx.createGain(); const dlyNode=ctx.createDelay(2.0); const fbGain=ctx.createGain(); const toneF=ctx.createBiquadFilter(); toneF.type='lowpass'; dry.gain.value=1-params.mix/100; wet.gain.value=params.mix/100; dlyNode.delayTime.value=params.time/1000; fbGain.gain.value=params.feedback/100; toneF.frequency.value=params.tone; input.connect(dry); input.connect(dlyNode); dlyNode.connect(toneF); toneF.connect(fbGain); fbGain.connect(dlyNode); toneF.connect(wet); dry.connect(output); wet.connect(output); extra={dry,wet,dlyNode,fbGain,toneF}; }
  else if (type === 'widener') { const split=ctx.createChannelSplitter(2); const merge=ctx.createChannelMerger(2); const dlyR=ctx.createDelay(0.05); const dryG=ctx.createGain(); const wetG=ctx.createGain(); dryG.gain.value=1-params.mix/100; wetG.gain.value=params.mix/100; dlyR.delayTime.value=params.width/1000; input.connect(dryG); dryG.connect(output); input.connect(split); const wetMerge=ctx.createChannelMerger(2); split.connect(wetMerge, 0, 0); split.connect(dlyR, 0); dlyR.connect(wetMerge, 0, 1); wetMerge.connect(wetG); wetG.connect(output); extra={dryG,wetG,split,dlyR,wetMerge}; }
  else if (type === 'saturator') { const dry=ctx.createGain(); const wet=ctx.createGain(); const shaper=ctx.createWaveShaper(); shaper.oversample='4x'; const toneF=ctx.createBiquadFilter(); toneF.type='highshelf'; toneF.frequency.value=3000; toneF.gain.value=params.tone; const outGn=ctx.createGain(); dry.gain.value=1-params.mix/100; wet.gain.value=params.mix/100; shaper.curve=buildSatCurve(params.drive); outGn.gain.value=dbToGain(params.output); input.connect(dry); input.connect(shaper); shaper.connect(toneF); toneF.connect(wet); dry.connect(outGn); wet.connect(outGn); outGn.connect(output); extra={dry,wet,shaper,toneF,outGn}; }
  return { input, output, ...extra };
}

function applyParam(mod, key, value) {
  mod.params[key] = value; if (!audioCtx) return;
  const t = audioCtx.currentTime; const n = mod.nodes; const r = (p,v) => p.setTargetAtTime(v, t, 0.008);
  switch(mod.type) {
    case 'gate': if(key==='threshold')r(n.comp.threshold,value); if(key==='ratio')r(n.comp.ratio,value); if(key==='knee')r(n.comp.knee,value); if(key==='attack')r(n.comp.attack,value/1000); if(key==='release')r(n.comp.release,value/1000); break;
    case 'filter': if(key==='hpFreq')r(n.hp.frequency,value); if(key==='hpQ')r(n.hp.Q,value); if(key==='hpOn')r(n.hp.frequency,value?mod.params.hpFreq:10); if(key==='lpFreq')r(n.lp.frequency,value); if(key==='lpQ')r(n.lp.Q,value); if(key==='lpOn')r(n.lp.frequency,value?mod.params.lpFreq:22050); break;
    case 'deesser': if(key==='freq')r(n.notch.frequency,value); if(key==='bandwidth')r(n.notch.Q,value); if(key==='depth')r(n.notch.gain,value); break;
    case 'eq': if(key==='b1Freq')r(n.b1.frequency,value); if(key==='b1Gain')r(n.b1.gain,value); if(key==='b1Q')r(n.b1.Q,value); if(key==='b2Freq')r(n.b2.frequency,value); if(key==='b2Gain')r(n.b2.gain,value); if(key==='b2Q')r(n.b2.Q,value); if(key==='b3Freq')r(n.b3.frequency,value); if(key==='b3Gain')r(n.b3.gain,value); if(key==='b3Q')r(n.b3.Q,value); if(key==='b4Freq')r(n.b4.frequency,value); if(key==='b4Gain')r(n.b4.gain,value); if(key==='b4Q')r(n.b4.Q,value); break;
    case 'compressor': if(key==='threshold')r(n.comp.threshold,value); if(key==='ratio')r(n.comp.ratio,value); if(key==='knee')r(n.comp.knee,value); if(key==='attack')r(n.comp.attack,value/1000); if(key==='release')r(n.comp.release,value/1000); if(key==='makeup')r(n.makeup.gain,dbToGain(value)); break;
    case 'limiter': if(key==='threshold')r(n.comp.threshold,value); if(key==='release')r(n.comp.release,value/1000); if(key==='makeup')r(n.makeup.gain,dbToGain(value)); break;
    case 'chorus': if(key==='rate')r(n.lfo.frequency,value); if(key==='depth')r(n.lfoGain.gain,value/1000); if(key==='mix'){ r(n.wet.gain,value/100); r(n.dry.gain,1-value/100); } break;
    case 'flanger': if(key==='rate')r(n.lfo.frequency,value); if(key==='depth')r(n.lfoGain.gain,value/1000); if(key==='feedback')r(n.fb.gain,value/100); if(key==='mix'){ r(n.wet.gain,value/100); r(n.dry.gain,1-value/100); } break;
    case 'tremolo': if(key==='rate')r(n.lfo.frequency,value); if(key==='depth'){ r(n.tremGain.gain, 1-value/200); r(n.lfoGain.gain, value/200); } break;
    case 'reverb': if(key==='size'||key==='decay')n.conv.buffer=buildReverbIR(audioCtx,mod.params.size,mod.params.decay); if(key==='predelay')r(n.preDly.delayTime,value/1000); if(key==='mix'){ r(n.wet.gain,value/100); r(n.dry.gain,1-value/100); } break;
    case 'delay': if(key==='time')r(n.dlyNode.delayTime,value/1000); if(key==='feedback')r(n.fbGain.gain,value/100); if(key==='tone')r(n.toneF.frequency,value); if(key==='mix'){ r(n.wet.gain,value/100); r(n.dry.gain,1-value/100); } break;
    case 'widener': if(key==='width')r(n.dlyR.delayTime,value/1000); if(key==='mix'){ r(n.wetG.gain,value/100); r(n.dryG.gain,1-value/100); } break;
    case 'saturator': if(key==='drive')n.shaper.curve=buildSatCurve(value); if(key==='tone')r(n.toneF.gain,value); if(key==='mix'){ r(n.wet.gain,value/100); r(n.dry.gain,1-value/100); } if(key==='output')r(n.outGn.gain,dbToGain(value)); break;
  }
}

function buildModuleThumb(mod) {
  const def = MODULE_DEFS[mod.type];
  const translatedLabel = getTranslation('mod.' + mod.type) || def.label;
  const thumb = document.createElement('div');
  thumb.className = 'mod-thumb';
  thumb.dataset.id = mod.id;
  thumb.style.setProperty('--mc', def.color);

  // LED de power (simula encendido/apagado según bypass)
  const led = document.createElement('div');
  led.className = 'power-led';

  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.textContent = '⠿';

  const title = document.createElement('div');
  title.className = 'thumb-title';
  title.textContent = translatedLabel;

  const controls = document.createElement('div');
  controls.className = 'thumb-controls';

  const bypassBtn = document.createElement('button');
  bypassBtn.className = 'thumb-btn byp-btn';
  bypassBtn.dataset.id = mod.id;
  bypassBtn.textContent = 'BYP';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'thumb-btn rm-btn';
  removeBtn.dataset.id = mod.id;
  removeBtn.textContent = '✕';

  controls.appendChild(bypassBtn);
  controls.appendChild(removeBtn);

  thumb.appendChild(led);
  thumb.appendChild(dragHandle);
  thumb.appendChild(title);
  thumb.appendChild(controls);

  // Eventos
  thumb.addEventListener('click', (e) => {
    if (!e.target.classList.contains('thumb-btn')) setActiveModule(mod.id);
  });
  bypassBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBypass(mod.id);
  });
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeModule(mod.id);
  });

  return thumb;
}

function buildModuleCard(mod) {
  const def = MODULE_DEFS[mod.type];
  const translatedLabel = getTranslation('mod.' + mod.type) || def.label;
  const color = def.color;
  const card = document.createElement('div');
  card.className = 'mod-card' + (def.wide ? ' is-wide' : '');
  card.dataset.id = mod.id;
  card.style.setProperty('--mc', color);

  // Strip superior (color de módulo)
  const strip = document.createElement('div');
  strip.className = 'mod-strip';
  card.appendChild(strip);

  // Cabecera
  const hd = document.createElement('div');
  hd.className = 'mod-hd';
  const led = document.createElement('div');
  led.className = 'mod-led';
  led.id = `led-${mod.id}`;
  const titleSpan = document.createElement('span');
  titleSpan.className = 'mod-title';
  titleSpan.textContent = translatedLabel;
  const bypassBtn = document.createElement('button');
  bypassBtn.className = 'btn-byp';
  bypassBtn.dataset.id = mod.id;
  bypassBtn.textContent = 'BYP';
  hd.appendChild(led);
  hd.appendChild(titleSpan);
  hd.appendChild(bypassBtn);
  card.appendChild(hd);

  bypassBtn.addEventListener('click', () => toggleBypass(mod.id));

  // Cuerpo (parámetros)
  const body = document.createElement('div');
  body.className = 'mod-body';

  if (mod.type === 'eq') {
    def.bands.forEach(band => {
      const col = document.createElement('div');
      col.className = 'band-col';
      const sep = document.createElement('div');
      sep.className = 'band-sep';
      sep.textContent = band.label;
      col.appendChild(sep);
      ['Freq','Gain','Q'].forEach(s => {
        col.appendChild(buildKnob(mod, band.prefix + s, def.params[band.prefix + s], color));
      });
      body.appendChild(col);
    });
  } else if (mod.type === 'filter') {
    const c1 = document.createElement('div');
    c1.className = 'band-col';
    const s1 = document.createElement('div');
    s1.className = 'band-sep';
    s1.textContent = 'HIGH-PASS';
    c1.appendChild(s1);
    c1.appendChild(buildKnob(mod, 'hpFreq', def.params.hpFreq, color));
    c1.appendChild(buildKnob(mod, 'hpQ', def.params.hpQ, color));
    c1.appendChild(buildToggle(mod, 'hpOn', def.params.hpOn, color));
    body.appendChild(c1);

    const c2 = document.createElement('div');
    c2.className = 'band-col';
    const s2 = document.createElement('div');
    s2.className = 'band-sep';
    s2.textContent = 'LOW-PASS';
    c2.appendChild(s2);
    c2.appendChild(buildKnob(mod, 'lpFreq', def.params.lpFreq, color));
    c2.appendChild(buildKnob(mod, 'lpQ', def.params.lpQ, color));
    c2.appendChild(buildToggle(mod, 'lpOn', def.params.lpOn, color));
    body.appendChild(c2);
  } else {
    const row = document.createElement('div');
    row.className = 'knob-row';
    Object.entries(def.params).forEach(([key, pDef]) => {
      row.appendChild(buildKnob(mod, key, pDef, color));
    });
    body.appendChild(row);
  }
  card.appendChild(body);

  return card;
}

function buildKnob(mod, key, pDef, color) {
  const wrap=document.createElement('div'); wrap.className='knob-wrap';
  const knob=document.createElement('div'); knob.className='knob'; const ind=document.createElement('div'); ind.className='knob-ind'; const arc=document.createElement('div'); arc.className='knob-arc';
  const val=document.createElement('div'); val.className='knob-val'; const lbl=document.createElement('div'); lbl.className='knob-lbl'; lbl.textContent=pDef.label;
  knob.appendChild(ind); knob.appendChild(arc); wrap.appendChild(knob); wrap.appendChild(val); wrap.appendChild(lbl);
  setKnobDisplay(knob,val,mod.params[key],pDef);
  let sy, sv;
  knob.addEventListener('mousedown', e => { e.preventDefault(); sy=e.clientY; sv=mod.params[key]; const range=pDef.max-pDef.min;
    const onMove=ev=>{ const raw=sv+(sy-ev.clientY)*range/240; const v=clamp(Math.round(raw/pDef.step)*pDef.step, pDef.min, pDef.max); applyParam(mod,key,v); setKnobDisplay(knob,val,v,pDef); };
    const onUp=()=>{ document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
    document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp);
  });
  knob.addEventListener('wheel',e=>{ e.preventDefault(); const v=clamp(mod.params[key]+Math.sign(-e.deltaY)*pDef.step,pDef.min,pDef.max); applyParam(mod,key,v); setKnobDisplay(knob,val,v,pDef); },{passive:false});
  knob.addEventListener('dblclick',()=>{ applyParam(mod,key,pDef.def); setKnobDisplay(knob,val,pDef.def,pDef); });
  return wrap;
}

function setKnobDisplay(knob,valEl,value,pDef) {
  const norm=(value-pDef.min)/(pDef.max-pDef.min); knob.querySelector('.knob-ind').style.transform=`rotate(${-135+norm*270}deg)`; let d;
  if(pDef.unit==='Hz') d=value>=1000?(value/1000).toFixed(1)+'k':Math.round(value)+'';
  else if(pDef.unit==='dB') d=(value>=0?'+':'')+value.toFixed(1); else if(pDef.unit===':1') d=value.toFixed(1);
  else if(pDef.unit==='ms') d=Math.round(value)+''; else if(pDef.unit==='s') d=value.toFixed(2); else if(pDef.unit==='x') d=value.toFixed(1); else d=value.toFixed(2);
  valEl.textContent=d+(pDef.unit&&pDef.unit!==':1'?' '+pDef.unit:(pDef.unit===':1'?':1':''));
}

function buildToggle(mod, key, pDef, color) {
  const wrap=document.createElement('div'); wrap.className='tog-wrap';
  const tog=document.createElement('div'); tog.className='tog'+(mod.params[key]?' on':''); tog.style.setProperty('--mc',color);
  const val=document.createElement('div'); val.className='tog-val'; val.textContent=mod.params[key]?'ON':'OFF';
  const lbl=document.createElement('div'); lbl.className='tog-lbl'; lbl.textContent=pDef.label;
  tog.addEventListener('click',()=>{ const v=!mod.params[key]; applyParam(mod,key,v); tog.classList.toggle('on',v); val.textContent=v?'ON':'OFF'; });
  wrap.appendChild(tog); wrap.appendChild(val); wrap.appendChild(lbl); return wrap;
}

function addModule(type, paramOverrides={}, startBypassed=false) {
  ensureCtx(); const def=MODULE_DEFS[type]; const id=++nextId; const params={};
  Object.entries(def.params).forEach(([k,p])=>{ params[k]=paramOverrides[k]!==undefined?paramOverrides[k]:p.def; });
  const nodes=buildAudioNodes(type,params);
  const mod = { id, type, params, nodes, bypassed: false, thumbEl: null, cardEl: null };
  modules.push(mod);
  const thumb = buildModuleThumb(mod); mod.thumbEl = thumb; chainArea.appendChild(thumb);
  const card = buildModuleCard(mod); mod.cardEl = card; editorArea.appendChild(card);
  updatePlaceholder(); rewireChain(); if(startBypassed) toggleBypass(id); setActiveModule(id); return mod;
}

function setActiveModule(id) {
  activeModuleId = id;
  modules.forEach(m => { m.cardEl.style.display = 'none'; m.thumbEl.classList.remove('active'); });
  if (id) { const mod = modules.find(m => m.id === id); if(mod) { mod.cardEl.style.display = 'flex'; mod.thumbEl.classList.add('active'); editorPlaceholder.style.display = 'none'; } }
  else { editorPlaceholder.style.display = 'flex'; }
}

function removeModule(id) {
  const idx=modules.findIndex(m=>m.id===id); if(idx===-1)return; const mod=modules[idx];
  try{mod.nodes.output.disconnect();}catch(e){}
  mod.thumbEl && mod.thumbEl.remove(); mod.cardEl && mod.cardEl.remove(); modules.splice(idx,1);
  if (activeModuleId === id) setActiveModule(null); updatePlaceholder(); rewireChain();
}

function toggleBypass(id) {
  const mod=modules.find(m=>m.id===id); if(!mod)return; mod.bypassed=!mod.bypassed;
  mod.cardEl.classList.toggle('bypassed', mod.bypassed);
  const cardBtn = mod.cardEl.querySelector('.btn-byp'); cardBtn.classList.toggle('bypassed', mod.bypassed); cardBtn.textContent=mod.bypassed?'ON':'BYP';
  mod.cardEl.querySelector('.mod-led').classList.toggle('off', mod.bypassed);
  mod.thumbEl.classList.toggle('bypassed', mod.bypassed);
  const thumbBypBtn = mod.thumbEl.querySelector('.byp-btn'); thumbBypBtn.classList.toggle('bypassed', mod.bypassed); thumbBypBtn.textContent=mod.bypassed?'ON':'BYP';
  rewireChain();
}

function clearChain() { [...modules].forEach(m=>removeModule(m.id)); }
function updatePlaceholder() { chainPlaceholder.classList.toggle('hidden',modules.length>0); }

Sortable.create(sidebarList, { group:{name:'rack',pull:'clone',put:false}, sort:false, animation:150, ghostClass:'sortable-ghost', chosenClass:'sortable-chosen', dragClass:'sortable-drag' });
Sortable.create(chainArea, {
  group:{name:'rack', pull:false, put:true}, animation:200, direction: 'horizontal', handle:'.drag-handle', emptyInsertThreshold: 100, ghostClass:'sortable-ghost', chosenClass:'sortable-chosen', dragClass:'sortable-drag',
  onAdd(evt) {
    const t = evt.item.dataset.type; const insertIndex = evt.newIndex; evt.item.remove();
    if(t) {
      const mod = addModule(t); const targetNode = chainArea.children[insertIndex];
      if (targetNode && targetNode !== mod.thumbEl) { chainArea.insertBefore(mod.thumbEl, targetNode); }
      const ids = [...chainArea.querySelectorAll('.mod-thumb')].map(el=>+el.dataset.id); modules.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id)); rewireChain();
    }
  },
  onUpdate() { const ids=[...chainArea.querySelectorAll('.mod-thumb')].map(el=>+el.dataset.id); modules.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id)); rewireChain(); }
});
sidebarList.querySelectorAll('.slot').forEach(slot=>{ slot.querySelector('.slot-btn').addEventListener('click',e=>{ e.stopPropagation(); addModule(slot.dataset.type); }); slot.addEventListener('dblclick',()=>addModule(slot.dataset.type)); });
catSelect && catSelect.addEventListener('change', () => { const val = catSelect.value; sidebarList.querySelectorAll('.slot').forEach(slot => { const cat = slot.dataset.cat || 'all'; slot.classList.toggle('cat-hidden', val !== 'all' && cat !== val); }); });

let outGainDb = 0;
function applyOutGain(db) {
  outGainDb = clamp(db, -18, 6); if (outputGainNode) { ensureCtx(); outputGainNode.gain.setTargetAtTime(dbToGain(outGainDb), audioCtx.currentTime, 0.008); }
  const norm = (outGainDb + 18) / 24; const angle = -135 + norm * 270;
  const indEl = outGainKnobEl.querySelector('.knob-ind'); if (indEl) indEl.style.transform = `rotate(${angle}deg)`;
  outGainValEl.textContent = (outGainDb>=0?'+':'') + outGainDb.toFixed(1) + ' dB';
}
if (outGainKnobEl) {
  let ogY, ogV;
  outGainKnobEl.addEventListener('mousedown', e => { e.preventDefault(); ogY=e.clientY; ogV=outGainDb; const onMove=ev=>applyOutGain(ogV+(ogY-ev.clientY)*24/240); const onUp=()=>{ document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); }; document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp); });
  outGainKnobEl.addEventListener('wheel',e=>{ e.preventDefault(); applyOutGain(outGainDb+Math.sign(-e.deltaY)*0.5); },{passive:false}); outGainKnobEl.addEventListener('dblclick',()=>applyOutGain(0)); applyOutGain(0);
}

btnSavePreset.addEventListener('click',()=>{
  const data={ version:'1.2', loop:{enabled:loopEnabled,start:loopStart,end:loopEnd}, outputGainDb: outGainDb, modules:modules.map(m=>({type:m.type,params:{...m.params},bypassed:m.bypassed})) };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='master-rack-preset.json'; a.click(); URL.revokeObjectURL(url);
});
btnLoadPreset.addEventListener('click',()=>presetInput.click());
presetInput.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f)return; const reader=new FileReader(); reader.onload=ev=>{ try{loadPreset(JSON.parse(ev.target.result));}catch(err){alert('Invalid preset');} presetInput.value=''; }; reader.readAsText(f); });
function loadPreset(data) { clearChain(); if(data.loop){ loopEnabled=!!data.loop.enabled; loopStart=data.loop.start||0; loopEnd=data.loop.end||1; btnLoop&&btnLoop.classList.toggle('is-loop',loopEnabled); } if(data.outputGainDb!=null) applyOutGain(data.outputGainDb); (data.modules||[]).forEach(item=>addModule(item.type,item.params||{},item.bypassed)); }

btnExportWav && btnExportWav.addEventListener('click', async ()=>{
  if(!audioBuffer){alert('Load an audio file first');return;} ensureCtx(); btnExportWav.disabled=true; btnExportWav.textContent='⟳ Rendering…';
  const offCtx=new OfflineAudioContext(audioBuffer.numberOfChannels,audioBuffer.length,audioBuffer.sampleRate); const offIn=offCtx.createGain(); const offOut=offCtx.createGain(); offOut.connect(offCtx.destination);
  const domIds=[...chainArea.querySelectorAll('.mod-thumb')].map(el=>+el.dataset.id); const active=globalBypass ? [] : domIds.map(id=>modules.find(m=>m.id===id)).filter(m=>m&&!m.bypassed);
  const offMods=active.map(m=>buildAudioNodes(m.type, m.params, offCtx));
  if(offMods.length===0){offIn.connect(offOut);} else{ offIn.connect(offMods[0].input); for(let i=0;i<offMods.length-1;i++)offMods[i].output.connect(offMods[i+1].input); offMods[offMods.length-1].output.connect(offOut); }
  const offGain=offCtx.createGain(); offGain.gain.value=dbToGain(outGainDb); const lastOut=offMods.length>0?offMods[offMods.length-1].output:offIn; lastOut.disconnect(); lastOut.connect(offGain); offGain.connect(offOut);
  const src=offCtx.createBufferSource(); src.buffer=audioBuffer; src.connect(offIn); src.start(0); const rendered=await offCtx.startRendering();
  const blob=new Blob([encodeWAV(rendered)],{type:'audio/wav'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='master-rack-export.wav'; a.click(); URL.revokeObjectURL(url);
  btnExportWav.disabled=false; btnExportWav.innerHTML=`<svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 1v7M3 5l3 3 3-3M1 11h10"/></svg> WAV`;
});
function encodeWAV(buffer) {
  const nc=buffer.numberOfChannels,sr=buffer.sampleRate,len=buffer.length; const ab=new ArrayBuffer(44+len*nc*2),v=new DataView(ab); const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF');v.setUint32(4,36+len*nc*2,true);ws(8,'WAVE');ws(12,'fmt '); v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,nc,true); v.setUint32(24,sr,true);v.setUint32(28,sr*nc*2,true);v.setUint16(32,nc*2,true);v.setUint16(34,16,true); ws(36,'data');v.setUint32(40,len*nc*2,true);
  const ch=[];for(let c=0;c<nc;c++)ch.push(buffer.getChannelData(c)); let off=44;
  for(let i=0;i<len;i++)for(let c=0;c<nc;c++){ const s=Math.max(-1,Math.min(1,ch[c][i]));v.setInt16(off,s<0?s*0x8000:s*0x7FFF,true);off+=2; } return ab;
}

btnClear.addEventListener('click', () => {
  if (!confirm('Clear all modules and audio?')) return;
  stopPlayback(true);
  clearChain();
  audioBuffer = null;
  wfImageData = null;
  const ctx2 = wfCanvas.getContext('2d');
  ctx2.clearRect(0, 0, wfCanvas.width, wfCanvas.height);
  wfEmpty.classList.remove('hidden');
  trackNameEl.textContent = getTranslation('ui.no_audio');
  timeCurEl.textContent = '00:00.0';
  timeTotEl.textContent = '00:00.0';
  btnPlay.disabled = true;
  btnStop.disabled = true;
  resetMeters();
  applyOutGain(0);
});
function clamp(v,mn,mx){return Math.min(mx,Math.max(mn,v));} function dbToGain(db){return Math.pow(10,db/20);} function fmtTime(s){ const m=Math.floor(s/60),sc=(s%60).toFixed(1).padStart(4,'0'); return `${String(m).padStart(2,'0')}:${sc}`; }

if (btnGlobalBypass) {
  const powerSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`;
  btnGlobalBypass.style.cssText = "width: 22px; height: 22px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--green); color: #000; border: 1px solid var(--green); cursor: pointer; transition: all 0.15s;";
  btnGlobalBypass.innerHTML = powerSvg;
  btnGlobalBypass.addEventListener('click', () => { globalBypass = !globalBypass; btnGlobalBypass.style.background = globalBypass ? 'transparent' : 'var(--green)'; btnGlobalBypass.style.color = globalBypass ? 'var(--tx3)' : '#000'; btnGlobalBypass.style.borderColor = globalBypass ? 'var(--brd2)' : 'var(--green)'; rewireChain(); });
}

if (instrumentSelect) {
  instrumentSelect.addEventListener('change', (e) => {
    clearChain(); const val = e.target.value;
    if (val === 'full') { addModule('eq'); addModule('compressor'); addModule('widener'); addModule('limiter'); }
    else if (val === 'drums') { addModule('gate'); addModule('eq'); addModule('compressor'); addModule('reverb'); }
    else if (val === 'guitar') { addModule('gate'); addModule('compressor'); addModule('saturator'); addModule('eq'); addModule('chorus'); }
    else if (val === 'voices') { addModule('deesser'); addModule('eq'); addModule('compressor'); addModule('delay'); addModule('reverb'); }
    else if (val === 'keys') { addModule('eq'); addModule('chorus'); addModule('widener'); addModule('delay'); addModule('reverb'); }
  });
}

// ═══════════════════════════════════════════════════════════════
//  MODALS & MENU
// ═══════════════════════════════════════════════════════════════
const btnMenu = document.getElementById('btn-menu');
const dropdownMenu = document.getElementById('dropdown-menu');
const btnTheme = document.getElementById('btn-theme');

if (btnMenu && dropdownMenu) {
  btnMenu.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('hidden'); });
  document.addEventListener('click', (e) => { if (!dropdownMenu.contains(e.target)) dropdownMenu.classList.add('hidden'); });
}
if (btnTheme) { btnTheme.addEventListener('click', () => { document.body.classList.toggle('light-theme'); dropdownMenu.classList.add('hidden'); }); }

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const footLinks = document.querySelectorAll('.foot-link');

if (modalOverlay) {
  footLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); const type = link.dataset.modal;
      modalTitle.textContent = getTranslation('foot.' + type) || "INFO";
      modalBody.innerHTML = getTranslation('modal.' + type) || "...";
      modalOverlay.classList.remove('hidden');
    });
  });
  modalClose.addEventListener('click', () => modalOverlay.classList.add('hidden'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });
}

const btnHelp = document.getElementById('btn-help');
if (btnHelp) {
  btnHelp.addEventListener('click', () => {
    dropdownMenu.classList.add('hidden');
    const w = 780, h = 620;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);
    window.open('help.html', 'rack4master_help', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`);
  });
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
updatePlaceholder();
setActiveModule(null);
initMeterCanvases();                // <-- Inicializar canvas de medidores
resizeMeterCanvases();

// Idioma por defecto
const defaultLang = 'en';
const langSelect = document.getElementById('lang-select');
if (langSelect) {
  langSelect.value = defaultLang;
  langSelect.addEventListener('click', (e) => e.stopPropagation());
  langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });
}
setLanguage(defaultLang);
