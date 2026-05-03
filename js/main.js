// js/main.js
import { clamp, dbToGain, fmtTime } from './utils.js';
import { MODULE_DEFS } from './modules/defs.js';
import { buildAudioNodes, ensureCtx, rewireChain, applyParam } from './core/audio.js';
import { buildModuleThumb } from './ui/thumb.js';
import { buildModuleCard } from './ui/card.js';
import { drawWaveformFull, drawOverlay } from './ui/waveform.js';
import { initMeters, startVU, stopVU, resetMeters } from './ui/meters.js';
import { setKnobDisplay } from './ui/knobs.js';
import { renderOffline, downloadWav } from './export.js';
import { INSTRUMENT_PRESETS } from './presets.js';
import {
  modules, nextId, activeModuleId, globalBypass,
  loopEnabled, loopStart, loopEnd, audioBuffer, isPlaying, startedAt, pauseOffset,
  setActiveModuleId, setGlobalBypass, setLoopEnabled, setLoopStart, setLoopEnd,
  setAudioBuffer, setIsPlaying, setStartedAt, setPauseOffset,
  addModuleToState, removeModuleFromState, updateModuleBypass,
  setModuleOrder
} from './core/state.js';

// --------------------------------------------------------------
// Idioma
// --------------------------------------------------------------
let currentLang = 'en';
window.currentLang = currentLang;

window.getTranslation = (key) => {
  if (typeof LANG !== 'undefined' && LANG[currentLang] && LANG[currentLang][key]) {
    return LANG[currentLang][key];
  }
  return null;
};

function updateAllTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translation = window.getTranslation(key);
    if (!translation) return;

    // Para optgroup usamos el atributo label, NO innerHTML (así no borramos los option)
    if (el.tagName === 'OPTGROUP') {
      el.label = translation;
      return;
    }

    // Para el resto de elementos, actualizamos el contenido
    el.innerHTML = translation;
  });

  document.querySelectorAll('.slot').forEach(slot => {
    const type = slot.dataset.type;
    if (type) {
      const nameEl = slot.querySelector('.slot-name');
      if (nameEl) {
        const translated = window.getTranslation('mod.' + type);
        if (translated) nameEl.textContent = translated;
      }
    }
  });

  modules.forEach(mod => {
    const newName = window.getTranslation('mod.' + mod.type) || MODULE_DEFS[mod.type].label;
    if (mod.thumbEl) mod.thumbEl.querySelector('.thumb-title').textContent = newName;
    if (mod.cardEl) mod.cardEl.querySelector('.mod-title').textContent = newName;
  });
}

window.MODULE_DEFS = MODULE_DEFS;
window.applyParam = applyParam;
window.rewireChain = rewireChain;
window.ensureCtx = ensureCtx;
window.startVU = startVU;
window.resetMeters = resetMeters;
window.setKnobDisplay = setKnobDisplay;

// --------------------------------------------------------------
// Control de habilitado/deshabilitado de controles del módulo
// --------------------------------------------------------------
function updateModuleControlsState(mod) {
  const disabled = mod.bypassed || globalBypass;
  const card = mod.cardEl;
  const thumb = mod.thumbEl;
  if (card) card.classList.toggle('module-disabled', disabled);
  if (thumb) thumb.classList.toggle('module-disabled', disabled);
}

// --------------------------------------------------------------
// RESET MODULE PARAMS
// --------------------------------------------------------------

function resetModuleParams(mod) {
  if (mod.bypassed || globalBypass) return;

  const def = MODULE_DEFS[mod.type];
  if (!def) return;

  const updates = [];
  for (const [key, p] of Object.entries(def.params)) {
    const defValue = p.def;
    if (mod.params[key] !== defValue) {
      updates.push({ key, value: defValue });
    }
  }
  if (updates.length === 0) return;

  for (const { key, value } of updates) {
    applyParam(mod, key, value);
  }

  requestAnimationFrame(() => {
    const card = mod.cardEl;
    if (card && window.setKnobDisplay) {
      const knobWraps = card.querySelectorAll('.knob-wrap');
      knobWraps.forEach(wrap => {
        const key = wrap.getAttribute('data-key');
        if (key && mod.params[key] !== undefined) {
          const value = mod.params[key];
          const min = parseFloat(wrap.getAttribute('data-min'));
          const max = parseFloat(wrap.getAttribute('data-max'));
          const step = parseFloat(wrap.getAttribute('data-step'));
          const unit = wrap.getAttribute('data-unit');
          const pDef = { min, max, step, unit };
          const knob = wrap.querySelector('.knob');
          const valEl = wrap.querySelector('.knob-val');
          if (knob && valEl) {
            window.setKnobDisplay(knob, valEl, value, pDef);
          }
        }
      });
    }
  });

  // Resetear el selector de presets a "Presets"
  if (mod.presetSelect) {
    mod.presetSelect.value = '';
  }
}

window.resetModuleParams = (id) => {
  const mod = modules.find(m => m.id === id);
  if (mod) resetModuleParams(mod);
};

// --------------------------------------------------------------
// Gestión de módulos
// --------------------------------------------------------------
function addModule(type, paramOverrides = {}, startBypassed = false) {
  if (!audioBuffer) {
    console.warn('No audio loaded. Cannot add module.');
    return null;
  }
  ensureCtx();
  const def = MODULE_DEFS[type];
  if (!def) { console.error(`Módulo "${type}" no definido`); return null; }
  const id = nextId + 1;
  const params = {};
  for (const [key, p] of Object.entries(def.params)) {
    params[key] = paramOverrides[key] !== undefined ? paramOverrides[key] : p.def;
  }
  const nodes = buildAudioNodes(type, params);
  const mod = { id, type, params, nodes, bypassed: startBypassed, thumbEl: null, cardEl: null };
  addModuleToState(mod);
  const thumb = buildModuleThumb(mod);
  mod.thumbEl = thumb;
  document.getElementById('chain-area').appendChild(thumb);
  const card = buildModuleCard(mod);
  mod.cardEl = card;
  document.getElementById('editor-area').appendChild(card);
  const placeholder = document.getElementById('chain-placeholder');
  if (placeholder) placeholder.classList.toggle('hidden', modules.length > 0);
  rewireChain();
  if (startBypassed) toggleBypass(id);
  setActiveModule(id);
  updateModuleControlsState(mod);
  return mod;
}

function toggleBypass(id) {
  if (globalBypass) return;
  const mod = modules.find(m => m.id === id);
  if (!mod) return;
  const newState = !mod.bypassed;
  updateModuleBypass(id, newState);
  if (mod.thumbEl) {
    mod.thumbEl.classList.toggle('bypassed', newState);
    const btn = mod.thumbEl.querySelector('.byp-btn');
    if (btn) { btn.textContent = newState ? 'ON' : 'BYP'; btn.classList.toggle('bypassed', newState); }
  }
  if (mod.cardEl) {
    mod.cardEl.classList.toggle('bypassed', newState);
    const btn = mod.cardEl.querySelector('.btn-byp');
    if (btn) { btn.textContent = newState ? 'ON' : 'BYP'; btn.classList.toggle('bypassed', newState); }
    const led = mod.cardEl.querySelector('.mod-led');
    if (led) led.classList.toggle('off', newState);
  }
  updateModuleControlsState(mod);
  rewireChain();
}

function setActiveModule(id) {
  setActiveModuleId(id);
  modules.forEach(m => {
    if (m.cardEl) m.cardEl.style.display = 'none';
    if (m.thumbEl) m.thumbEl.classList.remove('active');
  });
  if (id) {
    const mod = modules.find(m => m.id === id);
    if (mod && mod.cardEl && mod.thumbEl) {
      mod.cardEl.style.display = 'flex';
      mod.thumbEl.classList.add('active');
      const ph = document.getElementById('editor-placeholder');
      if (ph) ph.style.display = 'none';
    }
  } else {
    const ph = document.getElementById('editor-placeholder');
    if (ph) ph.style.display = 'flex';
  }
}

function removeModule(id) {
  const mod = modules.find(m => m.id === id);
  if (!mod) return;
  try { mod.nodes.output.disconnect(); } catch(e) {}
  if (mod.thumbEl) mod.thumbEl.remove();
  if (mod.cardEl) mod.cardEl.remove();
  removeModuleFromState(id);
  if (activeModuleId === id) setActiveModule(null);
  const ph = document.getElementById('chain-placeholder');
  if (ph) ph.classList.toggle('hidden', modules.length > 0);
  rewireChain();
}

window.addModule = addModule;
window.toggleBypass = toggleBypass;
window.setActiveModule = setActiveModule;
window.removeModule = removeModule;

// --------------------------------------------------------------
// Sortable y eventos laterales
// --------------------------------------------------------------
function initSidebarDrag() {
  const sidebar = document.getElementById('sidebar-list');
  if (sidebar && window.Sortable) {
    new Sortable(sidebar, { group: { name: 'rack', pull: 'clone', put: false }, sort: false, animation: 150 });
  }

  function handleAddClick(e) {
    e.stopPropagation();
    if (!audioBuffer) return;
    const slot = e.currentTarget.closest('.slot');
    const type = slot?.dataset.type;
    if (type) addModule(type);
  }
  document.querySelectorAll('.slot .slot-btn').forEach(btn => {
    if (btn.hasAttribute('data-listener')) return;
    btn.addEventListener('click', handleAddClick);
    btn.setAttribute('data-listener', 'true');
  });

  document.querySelectorAll('.slot-info-btn').forEach(btn => {
    if (btn.hasAttribute('data-info-listener')) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const moduleType = btn.getAttribute('data-module');
      if (moduleType && window.showModuleInfo) window.showModuleInfo(moduleType);
    });
    btn.setAttribute('data-info-listener', 'true');
  });

  function handleSlotDblClick(e) {
    const slot = e.currentTarget;
    const type = slot.dataset.type;
    if (type && audioBuffer) addModule(type);
  }
  document.querySelectorAll('.slot').forEach(slot => {
    if (slot.hasAttribute('data-dbl-listener')) return;
    slot.addEventListener('dblclick', handleSlotDblClick);
    slot.setAttribute('data-dbl-listener', 'true');
  });
}

function initChainDropZone() {
  const chain = document.getElementById('chain-area');
  if (chain && window.Sortable) {
    new Sortable(chain, {
      group: { name: 'rack', pull: false, put: true },
      animation: 200,
      direction: 'horizontal',
      handle: '.drag-handle',
      emptyInsertThreshold: 100,
      onAdd: (evt) => {
        if (!audioBuffer) return;
        const type = evt.item.dataset.type;
        const insertIndex = evt.newIndex;
        evt.item.remove();
        if (type) {
          addModule(type);
          const thumbs = [...chain.querySelectorAll('.mod-thumb')];
          const newThumb = thumbs[thumbs.length - 1];
          if (insertIndex < thumbs.length - 1) {
            chain.insertBefore(newThumb, thumbs[insertIndex]);
          }
          const newOrder = [...chain.querySelectorAll('.mod-thumb')].map(el => +el.dataset.id);
          setModuleOrder(newOrder.map(id => modules.find(m => m.id === id)).filter(Boolean));
        }
      },
      onUpdate: () => {
        const newOrder = [...chain.querySelectorAll('.mod-thumb')].map(el => +el.dataset.id);
        setModuleOrder(newOrder.map(id => modules.find(m => m.id === id)).filter(Boolean));
        rewireChain();
      }
    });
  }
}

// --------------------------------------------------------------
// Control global de habilitación de la interfaz según audio cargado
// --------------------------------------------------------------
function refreshControlsState() {
  const hasAudio = !!audioBuffer;
  const body = document.body;

  if (hasAudio) {
    body.classList.remove('controls-disabled');
  } else {
    body.classList.add('controls-disabled');
  }

  const playBtn = document.getElementById('btn-play');
  const stopBtn = document.getElementById('btn-stop');
  const loopBtn = document.getElementById('btn-loop');
  const exportBtn = document.getElementById('btn-export-wav');
  const savePresetBtnElem = document.getElementById('btn-save-preset');
  const loadPresetBtnElem = document.getElementById('btn-load-preset');
  const instrumentSelect = document.getElementById('instrument-select');
  const globalBypassBtnEl = document.getElementById('btn-global-bypass');
  const resetPeakBtnEl = document.getElementById('btn-peak-rst');
  const clearModulesBtn = document.getElementById('btn-clear-modules');

  if (playBtn) playBtn.disabled = !hasAudio;
  if (stopBtn) stopBtn.disabled = !hasAudio;
  if (loopBtn) loopBtn.disabled = !hasAudio;
  if (exportBtn) exportBtn.disabled = !hasAudio;
  if (savePresetBtnElem) savePresetBtnElem.disabled = !hasAudio;
  if (loadPresetBtnElem) loadPresetBtnElem.disabled = !hasAudio;
  if (instrumentSelect) instrumentSelect.disabled = !hasAudio;
  if (globalBypassBtnEl) globalBypassBtnEl.disabled = !hasAudio;
  if (resetPeakBtnEl) resetPeakBtnEl.disabled = !hasAudio;
  if (clearModulesBtn) clearModulesBtn.disabled = false;
}

// --------------------------------------------------------------
// Transporte
// --------------------------------------------------------------
let sourceNode = null, rafId = null;
const fileInput = document.getElementById('file-input');
const btnPlay = document.getElementById('btn-play');
const btnStop = document.getElementById('btn-stop');
const btnLoop = document.getElementById('btn-loop');
const timeCurEl = document.getElementById('time-cur');
const timeTotEl = document.getElementById('time-tot');
const trackNameEl = document.getElementById('track-name');
const wfCanvas = document.getElementById('wf-canvas');
const wfEmpty = document.getElementById('wf-empty');
const wfWrap = document.getElementById('wf-wrap');

function updatePlayPauseIcon() {
  const playIcon = document.getElementById('ico-play');
  const pauseIcon = document.getElementById('ico-pause');
  if (playIcon && pauseIcon) {
    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
    } else {
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
    }
  }
}

async function loadAudioFile(file) {
  ensureCtx();
  stopPlayback(true);
  trackNameEl.textContent = '⟳ Decoding…';
  const ab = await file.arrayBuffer();
  setAudioBuffer(await window.audioCtx.decodeAudioData(ab));
  trackNameEl.textContent = file.name;
  timeTotEl.textContent = fmtTime(audioBuffer.duration);
  timeCurEl.textContent = '00:00.0';
  setPauseOffset(0);
  setLoopStart(0);
  setLoopEnd(1);
  resetMeters();
  drawWaveformFull(wfCanvas, audioBuffer);
  wfEmpty.classList.add('hidden');
  updatePlayPauseIcon();
  refreshControlsState();
}

function stopPlayback(resetOffset = true) {
  try { sourceNode && sourceNode.stop(); } catch(e) {}
  sourceNode = null;
  setIsPlaying(false);
  updatePlayPauseIcon();
  if (resetOffset) {
    setPauseOffset(0);
    timeCurEl.textContent = '00:00.0';
    drawOverlay(wfCanvas, 0);
  }
  if (rafId) cancelAnimationFrame(rafId);
  resetMeters();
}

function startPlayback(offset = 0) {
  if (!audioBuffer) return;
  ensureCtx();
  if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
  if (loopEnabled) {
    const ls = loopStart * audioBuffer.duration;
    const le = loopEnd * audioBuffer.duration;
    if (offset < ls || offset >= le) offset = ls;
  }
  sourceNode = window.audioCtx.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.connect(window.audioCtx.chainInput);
  setStartedAt(window.audioCtx.currentTime - offset);
  setIsPlaying(true);
  updatePlayPauseIcon();
  rewireChain();
  sourceNode.start(0, offset);
  if (rafId) cancelAnimationFrame(rafId);
  startTimeDisplay();
  startVU();
  sourceNode.onended = () => { if (isPlaying && !loopEnabled) stopPlayback(true); };
}

function pausePlayback() {
  if (!isPlaying) return;
  setPauseOffset(window.audioCtx.currentTime - startedAt);
  try { sourceNode && sourceNode.stop(); } catch(e) {}
  sourceNode = null;
  setIsPlaying(false);
  updatePlayPauseIcon();
  if (rafId) cancelAnimationFrame(rafId);
  stopVU();
}

function startTimeDisplay() {
  function tick() {
    if (!isPlaying) return;
    const cur = window.audioCtx.currentTime - startedAt;
    const dur = audioBuffer.duration;
    const ratio = clamp(cur / dur, 0, 1);
    timeCurEl.textContent = fmtTime(Math.min(cur, dur));
    drawOverlay(wfCanvas, ratio);
    if (loopEnabled && cur >= loopEnd * dur) {
      try { sourceNode && sourceNode.stop(); } catch(e) {}
      sourceNode = null;
      startPlayback(loopStart * dur);
      return;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

function seekTo(ratio) {
  const r = clamp(ratio, 0, 1);
  const t = r * audioBuffer.duration;
  const was = isPlaying;
  stopPlayback(false);
  setPauseOffset(t);
  timeCurEl.textContent = fmtTime(t);
  drawOverlay(wfCanvas, r);
  if (was) startPlayback(t);
}

fileInput?.addEventListener('change', e => e.target.files[0] && loadAudioFile(e.target.files[0]));
btnPlay?.addEventListener('click', () => {
  if (!audioBuffer) return;
  ensureCtx();
  if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
  isPlaying ? pausePlayback() : startPlayback(pauseOffset);
});
btnStop?.addEventListener('click', () => {
  if (!audioBuffer) return;
  stopPlayback(true);
});
btnLoop?.addEventListener('click', () => {
  if (!audioBuffer) return;
  setLoopEnabled(!loopEnabled);
  btnLoop.classList.toggle('is-loop', loopEnabled);
  if (audioBuffer) {
    const cur = isPlaying ? (window.audioCtx.currentTime - startedAt) / audioBuffer.duration : pauseOffset / audioBuffer.duration;
    drawOverlay(wfCanvas, clamp(cur, 0, 1));
  }
});
wfCanvas?.addEventListener('click', (e) => {
  if (!audioBuffer) return;
  const rect = wfCanvas.getBoundingClientRect();
  const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  seekTo(ratio);
});
wfWrap?.addEventListener('dragover', e => { e.preventDefault(); wfWrap.classList.add('drag-over'); });
wfWrap?.addEventListener('dragleave', () => wfWrap.classList.remove('drag-over'));
wfWrap?.addEventListener('drop', e => {
  e.preventDefault();
  wfWrap.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('audio/')) loadAudioFile(f);
});
wfWrap?.addEventListener('click', () => { if (!audioBuffer && fileInput) fileInput.click(); });

// Loop handles
let wfDragging = null;
const HANDLE_HIT = 14;
if (wfCanvas) {
  wfCanvas.addEventListener('mousedown', (e) => {
    if (!audioBuffer) return;
    const rect = wfCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const W = rect.width;
    const lsX = loopStart * W, leX = loopEnd * W;
    if (loopEnabled && Math.abs(x - lsX) < HANDLE_HIT) wfDragging = 'loopStart';
    else if (loopEnabled && Math.abs(x - leX) < HANDLE_HIT) wfDragging = 'loopEnd';
    else { wfDragging = 'seek'; seekTo(x / W); }
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!wfDragging || !audioBuffer) return;
    const rect = wfCanvas.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const curRatio = isPlaying ? (window.audioCtx.currentTime - startedAt) / audioBuffer.duration : pauseOffset / audioBuffer.duration;
    if (wfDragging === 'seek') seekTo(ratio);
    else if (wfDragging === 'loopStart') setLoopStart(Math.min(ratio, loopEnd - 0.02));
    else if (wfDragging === 'loopEnd') setLoopEnd(Math.max(ratio, loopStart + 0.02));
    drawOverlay(wfCanvas, clamp(curRatio, 0, 1));
  });
  window.addEventListener('mouseup', () => { wfDragging = null; wfCanvas.style.cursor = ''; });
  wfCanvas.addEventListener('mousemove', (e) => {
    if (!audioBuffer || wfDragging) return;
    if (!loopEnabled) { wfCanvas.style.cursor = 'pointer'; return; }
    const rect = wfCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const W = rect.width;
    const near = Math.abs(x - loopStart*W) < HANDLE_HIT || Math.abs(x - loopEnd*W) < HANDLE_HIT;
    wfCanvas.style.cursor = near ? 'ew-resize' : 'pointer';
  });
}

// --------------------------------------------------------------
// OUTPUT GAIN KNOB
// --------------------------------------------------------------
let outGainDb = 0;
function applyOutGain(db) {
  if (!audioBuffer) return;
  outGainDb = Math.min(6, Math.max(-18, db));
  if (window.audioCtx && window.audioCtx.outputGainNode) {
    window.audioCtx.outputGainNode.gain.setTargetAtTime(Math.pow(10, outGainDb/20), window.audioCtx.currentTime, 0.008);
  }
  const norm = (outGainDb + 18) / 24;
  const angle = -135 + norm * 270;
  const ind = document.querySelector('#out-gain-knob .knob-ind');
  if (ind) ind.style.transform = `rotate(${angle}deg)`;
  const val = document.getElementById('out-gain-val');
  if (val) val.textContent = (outGainDb >= 0 ? '+' : '') + outGainDb.toFixed(1) + ' dB';
}
const outKnob = document.getElementById('out-gain-knob');
if (outKnob) {
  let startY, startVal;
  outKnob.addEventListener('mousedown', (e) => {
    if (!audioBuffer) return;
    e.preventDefault();
    startY = e.clientY;
    startVal = outGainDb;
    const onMove = (ev) => {
      if (!audioBuffer) return;
      const delta = startY - ev.clientY;
      applyOutGain(startVal + delta * 0.1);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  outKnob.addEventListener('wheel', e => {
    if (!audioBuffer) return;
    e.preventDefault();
    applyOutGain(outGainDb + (e.deltaY > 0 ? -0.5 : 0.5));
  });
  outKnob.addEventListener('dblclick', () => {
    if (!audioBuffer) return;
    applyOutGain(0);
  });
  applyOutGain(0);
}

// --------------------------------------------------------------
// GLOBAL BYPASS
// --------------------------------------------------------------
const globalBypassBtn = document.getElementById('btn-global-bypass');
if (globalBypassBtn) {
  globalBypassBtn.style.background = 'var(--green)';
  globalBypassBtn.addEventListener('click', () => {
    if (!audioBuffer) return;
    const newState = !globalBypass;
    setGlobalBypass(newState);
    if (newState) {
      globalBypassBtn.style.background = 'transparent';
      globalBypassBtn.style.borderColor = 'var(--brd2)';
      globalBypassBtn.style.color = 'var(--tx3)';
    } else {
      globalBypassBtn.style.background = 'var(--green)';
      globalBypassBtn.style.borderColor = 'var(--green)';
      globalBypassBtn.style.color = '#000';
    }
    modules.forEach(mod => {
      if (mod.thumbEl) {
        if (newState) mod.thumbEl.classList.add('global-bypassed');
        else mod.thumbEl.classList.remove('global-bypassed');
      }
      if (mod.cardEl) {
        if (newState) mod.cardEl.classList.add('global-bypassed');
        else mod.cardEl.classList.remove('global-bypassed');
      }
      updateModuleControlsState(mod);
    });
    rewireChain();
  });
}

// --------------------------------------------------------------
// CLEAR MODULES
// --------------------------------------------------------------
const clearModulesBtn = document.getElementById('btn-clear-modules');
if (clearModulesBtn) {
  clearModulesBtn.addEventListener('click', () => {
    if (confirm(window.getTranslation('ui.confirm_clear_modules') || 'Remove all modules from the chain?')) {
      [...modules].forEach(m => removeModule(m.id));
      const instrumentSelect = document.getElementById('instrument-select');
      if (instrumentSelect) instrumentSelect.value = '';
    }
  });
}

// --------------------------------------------------------------
// CLEAR ALL
// --------------------------------------------------------------
const clearAllBtn = document.getElementById('btn-clear');
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Clear all project? All audio and modules will be lost.')) {
      stopPlayback(true);
      resetMeters();
      applyOutGain(0);
      [...modules].forEach(m => removeModule(m.id));
      setAudioBuffer(null);
      setLoopEnabled(false);
      if (btnLoop) btnLoop.classList.remove('is-loop');
      setLoopStart(0);
      setLoopEnd(1);
      const ctx = wfCanvas?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, wfCanvas.width, wfCanvas.height);
      if (wfEmpty) wfEmpty.classList.remove('hidden');
      if (trackNameEl) trackNameEl.textContent = window.getTranslation('ui.no_audio') || '— No audio loaded —';
      if (timeCurEl) timeCurEl.textContent = '00:00.0';
      if (timeTotEl) timeTotEl.textContent = '00:00.0';
      const instrumentSelect = document.getElementById('instrument-select');
      if (instrumentSelect) instrumentSelect.value = '';
      refreshControlsState();
    }
  });
}

// --------------------------------------------------------------
// RESET PEAK BUTTON
// --------------------------------------------------------------
const resetPeakBtn = document.getElementById('btn-peak-rst');
if (resetPeakBtn) {
  resetPeakBtn.addEventListener('click', () => {
    if (!audioBuffer) return;
    resetMeters();
    resetPeakBtn.style.transition = 'background 0.1s ease, border-color 0.1s ease, color 0.1s ease';
    resetPeakBtn.style.background = 'var(--amber)';
    resetPeakBtn.style.borderColor = 'var(--amber)';
    resetPeakBtn.style.color = '#000';
    setTimeout(() => {
      resetPeakBtn.style.background = '';
      resetPeakBtn.style.borderColor = '';
      resetPeakBtn.style.color = '';
      setTimeout(() => resetPeakBtn.style.transition = '', 150);
    }, 150);
  });
}

// --------------------------------------------------------------
// PRESETS DE INSTRUMENTOS (usando js/presets.js)
// --------------------------------------------------------------
const instrumentSelect = document.getElementById('instrument-select');
if (instrumentSelect) {
  instrumentSelect.addEventListener('change', (e) => {
    if (!audioBuffer) return;
    const val = e.target.value;
    if (!val) return;

    if (val === 'empty') {
      if (confirm(window.getTranslation('ui.confirm_clear_modules') || 'Remove all modules from the chain?')) {
        [...modules].forEach(m => removeModule(m.id));
      } else {
        instrumentSelect.value = '';
      }
      return;
    }

    const chain = INSTRUMENT_PRESETS[val];
    if (!chain) return;

    const presetName = instrumentSelect.options[instrumentSelect.selectedIndex].textContent;
    if (!confirm(`Replace current chain with the "${presetName}" preset?`)) {
      instrumentSelect.value = '';
      return;
    }

    [...modules].forEach(m => removeModule(m.id));
    chain.forEach(type => addModule(type));

    if (modules.length > 0) {
      setActiveModule(modules[0].id);
    }
  });
}

// --------------------------------------------------------------
// GUARDAR / CARGAR PRESET
// --------------------------------------------------------------
const savePresetBtnElem = document.getElementById('btn-save-preset');
const loadPresetBtnElem = document.getElementById('btn-load-preset');
const presetInput = document.getElementById('preset-input');

function savePreset() {
  if (!audioBuffer) return;
  const data = {
    version: '1.2',
    loop: { enabled: loopEnabled, start: loopStart, end: loopEnd },
    outputGainDb: outGainDb,
    modules: modules.map(m => ({ type: m.type, params: { ...m.params }, bypassed: m.bypassed }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rack4master-preset.json';
  a.click();
  URL.revokeObjectURL(url);
}

function loadPresetFromFile(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      [...modules].forEach(m => removeModule(m.id));
      if (data.loop) {
        setLoopEnabled(!!data.loop.enabled);
        setLoopStart(data.loop.start || 0);
        setLoopEnd(data.loop.end || 1);
        if (btnLoop) btnLoop.classList.toggle('is-loop', loopEnabled);
      }
      if (data.outputGainDb !== undefined) applyOutGain(data.outputGainDb);
      (data.modules || []).forEach(item => addModule(item.type, item.params || {}, item.bypassed));
      if (modules.length > 0) setActiveModule(modules[0].id);
      refreshControlsState();
    } catch (err) { alert('Invalid preset'); }
    presetInput.value = '';
  };
  reader.readAsText(file);
}

savePresetBtnElem?.addEventListener('click', () => { if (audioBuffer) savePreset(); });
loadPresetBtnElem?.addEventListener('click', () => presetInput?.click());
presetInput?.addEventListener('change', e => { if (e.target.files[0]) loadPresetFromFile(e.target.files[0]); });

// --------------------------------------------------------------
// EXPORTAR WAV (usando js/export.js)
// --------------------------------------------------------------
const exportWavBtn = document.getElementById('btn-export-wav');
if (exportWavBtn) {
  exportWavBtn.addEventListener('click', async () => {
    if (!audioBuffer) { alert('Load an audio file first'); return; }
    ensureCtx();

    exportWavBtn.disabled = true;
    exportWavBtn.textContent = '⟳ Rendering…';

    try {
      const chainArea = document.getElementById('chain-area');
      const rendered = await renderOffline(audioBuffer, modules, globalBypass, outGainDb, chainArea);
      downloadWav(rendered);
    } catch (err) {
      console.error(err);
      alert('Error exporting audio');
    }

    exportWavBtn.disabled = false;
    exportWavBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 1v7M3 5l3 3 3-3M1 11h10"/></svg> WAV';
  });
}

// --------------------------------------------------------------
// MENÚ, IDIOMA, TEMA, AYUDA
// --------------------------------------------------------------
const menuBtn = document.getElementById('btn-menu');
const dropdown = document.getElementById('dropdown-menu');
if (menuBtn && dropdown) {
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('hidden'); });
  document.addEventListener('click', (e) => { if (!dropdown.contains(e.target) && e.target !== menuBtn) dropdown.classList.add('hidden'); });
}
const langSelect = document.getElementById('lang-select');
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    window.currentLang = currentLang;
    updateAllTranslations();
  });
}
const themeBtn = document.getElementById('btn-theme');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
  });
}
const helpBtn = document.getElementById('btn-help');
if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    window.open('help.html', '_blank');
  });
}

// --------------------------------------------------------------
// FILTRO POR CATEGORÍAS
// --------------------------------------------------------------
const catSelect = document.getElementById('cat-select');
if (catSelect) {
  catSelect.addEventListener('change', () => {
    const value = catSelect.value;
    document.querySelectorAll('.slot').forEach(slot => {
      const cat = slot.dataset.cat || 'all';
      slot.classList.toggle('cat-hidden', value !== 'all' && cat !== value);
    });
  });
}

// --------------------------------------------------------------
// BOTÓN ORDENACIÓN ALFABÉTICA
// --------------------------------------------------------------
function sortModulesList(direction) {
  const container = document.getElementById('sidebar-list');
  const slots = Array.from(container.querySelectorAll('.slot'));
  slots.sort((a, b) => {
    const nameA = a.querySelector('.slot-name')?.innerText || '';
    const nameB = b.querySelector('.slot-name')?.innerText || '';
    return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
  slots.forEach(slot => container.appendChild(slot));
}

const sortBtn = document.getElementById('sort-modules-btn');
if (sortBtn) {
  let sortOrder = 'asc';
  sortBtn.addEventListener('click', () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortBtn.textContent = sortOrder === 'asc' ? 'A-Z' : 'Z-A';
    sortModulesList(sortOrder);
  });
}

// --------------------------------------------------------------
// MODALES (footer links)
// --------------------------------------------------------------
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const footLinks = document.querySelectorAll('.foot-link');

if (modalOverlay && footLinks.length) {
  footLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const type = link.dataset.modal;
      modalTitle.textContent = window.getTranslation('foot.' + type) || type.toUpperCase();
      let content = window.getTranslation('modal.' + type) || 'Contenido no disponible.';
      if (type === 'legal') {
        content += '<br><br><b>Created by:</b> Francesc Llorens Cerdà';
      }
      modalBody.innerHTML = content;
      modalOverlay.classList.remove('hidden');
    });
  });
  modalClose.addEventListener('click', () => modalOverlay.classList.add('hidden'));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
  });
}

// --------------------------------------------------------------
// Modal de atajos de teclado (rediseñado)
// --------------------------------------------------------------
const shortcutsBtn = document.getElementById('btn-shortcuts');
if (shortcutsBtn && modalOverlay && modalTitle && modalBody) {
  shortcutsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modalTitle.textContent = window.getTranslation('menu.shortcuts') || '⌨️ Keyboard shortcuts';
    modalBody.innerHTML = `
      <style>
        .shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 24px;
          font-family: var(--fnt-ui);
        }
        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-bottom: 1px dashed var(--brd);
          padding: 6px 0;
        }
        .shortcut-item.long {
          grid-column: span 2;
        }
        kbd {
          background: var(--surf2);
          border: 1px solid var(--brd);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: var(--fnt-mono);
          font-weight: bold;
          color: var(--amber);
          font-size: 0.85rem;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .shortcuts-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .shortcut-item.long {
            grid-column: span 1;
          }
        }
      </style>
      <div class="shortcuts-grid">
        <div class="shortcut-item"><span>▶ Play / Pause</span><kbd>Espacio</kbd></div>
        <div class="shortcut-item"><span>⏹ Stop</span><kbd>S</kbd></div>
        <div class="shortcut-item"><span>🔄 Loop</span><kbd>L</kbd></div>
        <div class="shortcut-item"><span>◀ Retroceder 5s</span><kbd>←</kbd></div>
        <div class="shortcut-item"><span>▶ Avanzar 5s</span><kbd>→</kbd></div>
        <div class="shortcut-item"><span>⏮ Inicio</span><kbd>Home</kbd></div>
        <div class="shortcut-item"><span>⏭ Fin</span><kbd>End</kbd></div>
        <div class="shortcut-item"><span>🔘 Bypass Global</span><kbd>B</kbd></div>
        <div class="shortcut-item"><span>🔄 Reset picos</span><kbd>R</kbd></div>
        <div class="shortcut-item long"><span>🗑 Eliminar módulo activo</span><kbd>Delete / Backspace</kbd></div>
        <div class="shortcut-item"><span>🎛 Reset knob</span><kbd>Doble clic</kbd></div>
      </div>
    `;
    modalOverlay.classList.remove('hidden');
    if (dropdown) dropdown.classList.add('hidden');
  });
}

// --------------------------------------------------------------
// DESCRIPCIONES DE MÓDULOS
// --------------------------------------------------------------
window.moduleDescriptions = {
  gate: 'Puerta de Ruido: Atenúa el sonido cuando la señal cae por debajo de un umbral. Útil para limpiar ruido de fondo en pistas de voz, guitarra o batería. En mastering se usa ocasionalmente para eliminar ruido residual.',
  compressor: 'Compresor: Reduce el rango dinámico, haciendo las partes suaves más audibles y controlando los picos. Ideal para bajo, voz, batería y para dar pegada a la mezcla. En mastering se usa para glue y control general.',
  limiter: 'Limitador: Evita que la señal supere un nivel máximo (techo), permitiendo subir la sonoridad sin distorsión. Esencial en mastering para alcanzar niveles comerciales.',
  tremolo: 'Tremolo: Modula la amplitud de la señal a una velocidad determinada. Añade movimiento y ritmo. Útil en guitarras, pads o para efectos creativos, no es común en mastering.',
  filter: 'Filtro HP/LP: Elimina frecuencias bajas (high‑pass) o altas (low‑pass). Útil para limpiar subgraves incontrolados (HP) o suavizar agudos excesivos (LP).',
  deesser: 'De-esser (clásico): Reduce sibilancias (eses) mediante un filtro notch estático. Adecuado para correcciones rápidas pero menos preciso que el De-esser Pro.',
  eq: 'Ecualizador 4 bandas: Ajusta frecuencias bajas, medios y agudos con control de ganancia, frecuencia y Q. Herramienta fundamental para dar forma al tono.',
  chorus: 'Chorus: Crea una sensación de anchura y movimiento simulando varias voces ligeramente desafinadas. Común en guitarras, sintetizadores y coros, pero no típico en mastering.',
  flanger: 'Flanger: Genera un efecto de barrido tipo “jet” al mezclar la señal con una copia retardada modulada. Más usado en producción que en mastering.',
  reverb: 'Reverberación: Añade sensación de espacio. En mastering se usa con sutileza para dar profundidad o glue, aunque no es muy común.',
  delay: 'Delay: Repite la señal con un retardo. En mastering se usa ocasionalmente para efectos creativos, pero normalmente se aplica en mezcla.',
  widener: 'Widener: Ensancha la imagen estéreo al añadir un pequeño retardo a un canal. Útil para dar amplitud sin perder compatibilidad mono.',
  saturator: 'Saturator: Añade armónicos y calidez mediante distorsión suave. Ideal para dar carácter a buses o pistas individuales. En mastering se usa con cuidado.',
  midside: 'Mid/Side: Procesa por separado el centro (Mid) y los laterales (Side). Perfecto para ensanchar la imagen estéreo, centrar bajos o realzar los laterales sin afectar el centro.',
  softclipper: 'Soft Clipper: Recorta los picos de forma suave, aumentando la sonoridad sin distorsión agresiva. Útil antes del limitador para ganar nivel sin que el limitador trabaje en exceso.',
  exciter: 'Exciter Armónico: Añade armónicos de orden par para dar brillo y claridad sin ecualización agresiva. Muy útil para voces apagadas, pistas con falta de aire, o para dar vida a mezclas oscuras.',
  deesserpro: 'De-esser Pro: Reduce sibilancias dinámicamente mediante compresión por sidechain. Más preciso y transparente que el de-esser clásico. Indispensable en voces y también útil en pistas con platos de batería.',
  multiband: 'Compresor Multibanda: Divide el espectro en tres bandas (bajos, medios, agudos) y comprime cada una independientemente. Perfecto para controlar problemas de frecuencia sin afectar al resto, como domar graves excesivos o pulir agudos sin perder pegada.'
};

window.showModuleInfo = (moduleType) => {
  const desc = window.moduleDescriptions[moduleType];
  if (!desc) return;
  let title = '';
  switch (moduleType) {
    case 'gate': title = 'Puerta de Ruido (Noise Gate)'; break;
    case 'compressor': title = 'Compresor'; break;
    case 'limiter': title = 'Limitador'; break;
    case 'tremolo': title = 'Tremolo'; break;
    case 'filter': title = 'Filtro HP/LP'; break;
    case 'deesser': title = 'De-esser (clásico)'; break;
    case 'eq': title = 'Ecualizador 4 bandas'; break;
    case 'chorus': title = 'Chorus'; break;
    case 'flanger': title = 'Flanger'; break;
    case 'reverb': title = 'Reverberación'; break;
    case 'delay': title = 'Delay'; break;
    case 'widener': title = 'Widener'; break;
    case 'saturator': title = 'Saturador'; break;
    case 'midside': title = 'Mid/Side'; break;
    case 'softclipper': title = 'Soft Clipper'; break;
    case 'exciter': title = 'Exciter Armónico'; break;
    case 'deesserpro': title = 'De-esser Pro'; break;
    case 'multiband': title = 'Compresor Multibanda'; break;
    default: title = moduleType;
  }
  if (modalOverlay && modalTitle && modalBody) {
    modalTitle.textContent = title;
    modalBody.innerHTML = `<p>${desc}</p>`;
    modalOverlay.classList.remove('hidden');
  }
};

// --------------------------------------------------------------
// INICIALIZACIÓN FINAL
// --------------------------------------------------------------
initSidebarDrag();
initChainDropZone();
initMeters();
updateAllTranslations();

updatePlayPauseIcon();
refreshControlsState();

window.addEventListener('keydown', (e) => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  const key = e.key;
  const isSpace = key === ' ' || key === 'Space' || key === 'Spacebar';

  if (isSpace) {
    e.preventDefault();
    if (audioBuffer && btnPlay && !btnPlay.disabled) {
      if (isPlaying) pausePlayback();
      else startPlayback(pauseOffset);
    }
  }
  else if (key === 's' || key === 'S') {
    e.preventDefault();
    if (audioBuffer && btnStop && !btnStop.disabled) stopPlayback(true);
  }
  else if (key === 'l' || key === 'L') {
    e.preventDefault();
    if (audioBuffer && btnLoop && !btnLoop.disabled) btnLoop.click();
  }
  else if (key === 'ArrowLeft') {
    e.preventDefault();
    if (audioBuffer) {
      let newTime = (isPlaying ? (window.audioCtx.currentTime - startedAt) : pauseOffset) - 5;
      newTime = Math.max(0, newTime);
      seekTo(newTime / audioBuffer.duration);
    }
  }
  else if (key === 'ArrowRight') {
    e.preventDefault();
    if (audioBuffer) {
      let newTime = (isPlaying ? (window.audioCtx.currentTime - startedAt) : pauseOffset) + 5;
      newTime = Math.min(audioBuffer.duration, newTime);
      seekTo(newTime / audioBuffer.duration);
    }
  }
  else if (key === 'Home') {
    e.preventDefault();
    if (audioBuffer) seekTo(0);
  }
  else if (key === 'End') {
    e.preventDefault();
    if (audioBuffer) seekTo(1);
  }
  else if (key === 'b' || key === 'B') {
    e.preventDefault();
    if (audioBuffer && globalBypassBtn && !globalBypassBtn.disabled) globalBypassBtn.click();
  }
  else if (key === 'r' || key === 'R') {
    e.preventDefault();
    if (audioBuffer && resetPeakBtn && !resetPeakBtn.disabled) resetPeakBtn.click();
  }
  else if (key === 'Delete' || key === 'Del' || key === 'Backspace') {
    e.preventDefault();
    if (activeModuleId) {
      const activeMod = modules.find(m => m.id === activeModuleId);
      if (activeMod && window.removeModule) window.removeModule(activeMod.id);
    }
  }
});

console.log('RACK4MASTER - OK (controles habilitados solo después de cargar audio)');
