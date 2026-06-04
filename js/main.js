// js/main.js
import { clamp, dbToGain, fmtTime } from './utils.js';
import { MODULE_DEFS, MODULE_MIGRATION } from './modules/defs.js';
import { buildAudioNodes, ensureCtx, rewireChain, applyParam } from './core/audio.js';
import { buildModuleThumb } from './ui/thumb.js';
import { buildModuleCard } from './ui/card.js';
import { drawWaveformFull, drawOverlay } from './ui/waveform.js';
import { initMeters, startVU, stopVU, resetMeters } from './ui/meters.js';
import { setKnobDisplay } from './ui/knobs.js';
import { renderOffline, downloadWav } from './export.js';
import { INSTRUMENT_PRESETS } from './presets.js';
import { initSpectrum, startSpectrumLoop, stopSpectrumLoop, resizeSpectrum, setSpectrumMode } from './ui/spectrum.js';
import { analyzeAndRecommend } from './assistant.js';
import {
  modules, nextId, activeModuleId, globalBypass,
  loopEnabled, loopStart, loopEnd, audioBuffer, isPlaying, startedAt, pauseOffset,
  setActiveModuleId, setGlobalBypass, setLoopEnabled, setLoopStart, setLoopEnd,
  setAudioBuffer, setIsPlaying, setStartedAt, setPauseOffset,
  addModuleToState, removeModuleFromState, updateModuleBypass,
  setModuleOrder,
  slotA, slotB, activeSlot,
  setSlotA, setSlotB, setActiveSlot
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
    if (el.tagName === 'OPTGROUP') {
      el.label = translation;
      return;
    }
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

// --- Función Solo (para miniaturas y tarjetas) ---
let soloedModuleId = null;
let preSoloBypass = new Map();

function toggleSolo(id) {
  if (globalBypass) return;  // FIX: solo no tiene efecto con bypass global activo
  const mod = modules.find(m => m.id === id);
  if (!mod) return;

  if (soloedModuleId === id) {
    preSoloBypass.forEach((wasBypassed, moduleId) => {
      const m = modules.find(m => m.id === moduleId);
      if (m) {
        updateModuleBypass(moduleId, wasBypassed);
        if (m.thumbEl) {
          m.thumbEl.classList.toggle('bypassed', wasBypassed);
          const btn = m.thumbEl.querySelector('.byp-btn');
          if (btn) { btn.textContent = wasBypassed ? 'ON' : 'BYP'; btn.classList.toggle('bypassed', wasBypassed); }
        }
        if (m.cardEl) {
          m.cardEl.classList.toggle('bypassed', wasBypassed);
          const btn = m.cardEl.querySelector('.btn-byp');
          if (btn) { btn.textContent = wasBypassed ? 'ON' : 'BYP'; btn.classList.toggle('bypassed', wasBypassed); }
          const led = m.cardEl.querySelector('.mod-led');
          if (led) led.classList.toggle('off', wasBypassed);
        }
        updateModuleControlsState(m);
      }
    });
    soloedModuleId = null;
    preSoloBypass.clear();

    modules.forEach(m => {
      if (m.thumbEl) {
        const soloBtnThumb = m.thumbEl.querySelector('.solo-btn');
        if (soloBtnThumb) soloBtnThumb.classList.remove('active');
      }
      if (m.cardEl) {
        const soloBtnCard = m.cardEl.querySelector('.btn-solo');
        if (soloBtnCard) soloBtnCard.classList.remove('active');
      }
    });
    rewireChain();
    return;
  }

  preSoloBypass.clear();
  modules.forEach(m => {
    preSoloBypass.set(m.id, m.bypassed);
  });

  modules.forEach(m => {
    if (m.id === id) {
      if (m.bypassed) {
        updateModuleBypass(m.id, false);
        if (m.thumbEl) {
          m.thumbEl.classList.remove('bypassed');
          const btn = m.thumbEl.querySelector('.byp-btn');
          if (btn) { btn.textContent = 'BYP'; btn.classList.remove('bypassed'); }
        }
        if (m.cardEl) {
          m.cardEl.classList.remove('bypassed');
          const btn = m.cardEl.querySelector('.btn-byp');
          if (btn) { btn.textContent = 'BYP'; btn.classList.remove('bypassed'); }
          const led = m.cardEl.querySelector('.mod-led');
          if (led) led.classList.remove('off');
        }
      }
    } else {
      updateModuleBypass(m.id, true);
      if (m.thumbEl) {
        m.thumbEl.classList.add('bypassed');
        const btn = m.thumbEl.querySelector('.byp-btn');
        if (btn) { btn.textContent = 'ON'; btn.classList.add('bypassed'); }
      }
      if (m.cardEl) {
        m.cardEl.classList.add('bypassed');
        const btn = m.cardEl.querySelector('.btn-byp');
        if (btn) { btn.textContent = 'ON'; btn.classList.add('bypassed'); }
        const led = m.cardEl.querySelector('.mod-led');
        if (led) led.classList.add('off');
      }
      updateModuleControlsState(m);
    }
  });

  soloedModuleId = id;

  modules.forEach(m => {
    if (m.thumbEl) {
      const soloBtnThumb = m.thumbEl.querySelector('.solo-btn');
      if (soloBtnThumb) soloBtnThumb.classList.toggle('active', m.id === id);
    }
    if (m.cardEl) {
      const soloBtnCard = m.cardEl.querySelector('.btn-solo');
      if (soloBtnCard) soloBtnCard.classList.toggle('active', m.id === id);
    }
  });
  updateModuleControlsState(mod);
  rewireChain();
}

window.toggleSolo = toggleSolo;

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

  sortModulesList('asc');
  document.getElementById('sort-modules-btn').textContent = 'Z‑A';
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

  const btnSlotA = document.getElementById('btn-slot-a');
  const btnSlotB = document.getElementById('btn-slot-b');
  const btnToggleSpectrum = document.getElementById('btn-toggle-spectrum');
  const catSelect = document.getElementById('cat-select');
  const sortBtn = document.getElementById('sort-modules-btn');

  const btnToggleWaveform = document.getElementById('btn-toggle-waveform');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnToggleChain = document.getElementById('btn-toggle-chain');

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

  if (btnSlotA) btnSlotA.disabled = !hasAudio;
  if (btnSlotB) btnSlotB.disabled = !hasAudio;
  if (btnToggleSpectrum) btnToggleSpectrum.disabled = !hasAudio;
  if (catSelect) catSelect.disabled = !hasAudio;
  if (sortBtn) sortBtn.disabled = !hasAudio;

  if (btnToggleWaveform) btnToggleWaveform.disabled = !hasAudio;
  if (btnToggleSidebar) btnToggleSidebar.disabled = !hasAudio;
  if (btnToggleChain) btnToggleChain.disabled = !hasAudio;

  // FIX: sincronizar visual del botón global bypass con estado real
  const gbBtn = document.getElementById('btn-global-bypass');
  if (gbBtn) {
    if (globalBypass) {
      gbBtn.style.background = 'transparent';
      gbBtn.style.borderColor = 'var(--brd2)';
      gbBtn.style.color = 'var(--tx3)';
    } else {
      gbBtn.style.background = hasAudio ? 'var(--green)' : 'var(--surf2)';
      gbBtn.style.borderColor = hasAudio ? 'var(--green)' : 'var(--brd2)';
      gbBtn.style.color = hasAudio ? '#000' : 'var(--tx3)';
    }
  }
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
  // Redibujar waveform si se redimensiona la ventana
  if (!window._wfResizeListener) {
    window._wfResizeListener = true;
    window.addEventListener('resize', () => { if (audioBuffer) drawWaveformFull(wfCanvas, audioBuffer); });
  }

  if (typeof spectrumVisible !== 'undefined' && spectrumVisible) {
    const specCanvas = document.getElementById('spectrum-canvas');
    if (specCanvas) {
      const ctx = specCanvas.getContext('2d');
      ctx.clearRect(0, 0, specCanvas.width, specCanvas.height);
    }
    stopSpectrumLoop();
    resizeSpectrum();
    startSpectrumLoop();
  }
  const resultsList = document.getElementById('spectrum-results-list');
  if (resultsList) {
    resultsList.innerHTML = '<div class="spectrum-results-empty">Run analysis to see recommendations</div>';
  }
  const applyBtn = document.getElementById('btn-apply-recommendations');
  if (applyBtn) applyBtn.classList.add('hidden');
  const copyBtn = document.getElementById('btn-copy-results');
  if (copyBtn) copyBtn.classList.add('hidden');
  if (typeof lastRecommendations !== 'undefined') lastRecommendations = [];

  soloedModuleId = null;
  preSoloBypass.clear();
  modules.forEach(m => {
    if (m.thumbEl) {
      const soloBtn = m.thumbEl.querySelector('.solo-btn');
      if (soloBtn) soloBtn.classList.remove('active');
    }
    if (m.cardEl) {
      const soloBtn = m.cardEl.querySelector('.btn-solo');
      if (soloBtn) soloBtn.classList.remove('active');
    }
  });
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
  stopSpectrumLoop();
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
  if (spectrumVisible) startSpectrumLoop();
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
  stopSpectrumLoop();
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
// OUTPUT GAIN KNOB (bug solucionado: doble clic vuelve exactamente a 0 dB)
// --------------------------------------------------------------
let outGainDb = 0;
function renderOutGainVisual() {
  const norm  = (outGainDb + 12) / 24;   // 0 dB → 0.5 → angle = 0° exacto
  const angle = -135 + norm * 270;
  const ind = document.querySelector('#out-gain-knob .knob-ind');
  if (ind) ind.style.transform = `rotate(${angle}deg)`;
  const val = document.getElementById('out-gain-val');
  if (val) val.textContent = (outGainDb >= 0 ? '+' : '') + outGainDb.toFixed(1) + ' dB';
}
function applyOutGain(db) {
  outGainDb = Math.round(db * 2) / 2;
  outGainDb = Math.min(12, Math.max(-12, outGainDb));
  renderOutGainVisual();
  if (!audioBuffer) return;
  if (window.audioCtx && window.audioCtx.outputGainNode) {
    window.audioCtx.outputGainNode.gain.setTargetAtTime(
      Math.pow(10, outGainDb / 20), window.audioCtx.currentTime, 0.008
    );
  }
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
    applyOutGain(0);
  });
  renderOutGainVisual();   // posición correcta en el arranque, sin audio cargado
}

// --------------------------------------------------------------
// GLOBAL BYPASS
// --------------------------------------------------------------
const globalBypassBtn = document.getElementById('btn-global-bypass');
if (globalBypassBtn) {
  // Estado visual inicial se aplica en refreshControlsState, no aquí
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

      setSlotA(null);
      setSlotB(null);
      if (activeSlot !== 'A') {
        setActiveSlot('A');
        updateABButtons();
      }

      if (typeof spectrumVisible !== 'undefined' && spectrumVisible) {
        stopSpectrumLoop();
        const specCanvas = document.getElementById('spectrum-canvas');
        if (specCanvas) {
          const ctx = specCanvas.getContext('2d');
          ctx.clearRect(0, 0, specCanvas.width, specCanvas.height);
        }
        spectrumPanel.classList.add('hidden');
        btnToggleSpectrum.classList.remove('active');
        btnToggleSpectrum.innerHTML = '▼ ' + (window.getTranslation('ui.spectrum_label') || 'SPECTRUM');
        spectrumVisible = false;
      }
      if (typeof spectrumResultsList !== 'undefined') {
        spectrumResultsList.innerHTML = '<div class="spectrum-results-empty">Run analysis to see recommendations</div>';
      }
      if (typeof btnApplyRecommendations !== 'undefined') {
        btnApplyRecommendations.classList.add('hidden');
      }
      const copyBtn = document.getElementById('btn-copy-results');
      if (copyBtn) copyBtn.classList.add('hidden');
      if (typeof lastRecommendations !== 'undefined') {
        lastRecommendations = [];
      }

      soloedModuleId = null;
      preSoloBypass.clear();
      modules.forEach(m => {
        if (m.thumbEl) {
          const soloBtn = m.thumbEl.querySelector('.solo-btn');
          if (soloBtn) soloBtn.classList.remove('active');
        }
        if (m.cardEl) {
          const soloBtn = m.cardEl.querySelector('.btn-solo');
          if (soloBtn) soloBtn.classList.remove('active');
        }
      });
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

      setSlotA(null);
      setSlotB(null);
      setActiveSlot('A');

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

      if (typeof spectrumVisible !== 'undefined' && spectrumVisible) {
        stopSpectrumLoop();
        const specCanvas = document.getElementById('spectrum-canvas');
        if (specCanvas) {
          const ctx = specCanvas.getContext('2d');
          ctx.clearRect(0, 0, specCanvas.width, specCanvas.height);
        }
        spectrumPanel.classList.add('hidden');
        btnToggleSpectrum.classList.remove('active');
        btnToggleSpectrum.innerHTML = '▼ ' + (window.getTranslation('ui.spectrum_label') || 'SPECTRUM');
        spectrumVisible = false;
      }
      if (typeof spectrumResultsList !== 'undefined') {
        spectrumResultsList.innerHTML = '<div class="spectrum-results-empty">Run analysis to see recommendations</div>';
      }
      if (typeof btnApplyRecommendations !== 'undefined') {
        btnApplyRecommendations.classList.add('hidden');
      }
      const copyBtn = document.getElementById('btn-copy-results');
      if (copyBtn) copyBtn.classList.add('hidden');
      if (typeof lastRecommendations !== 'undefined') {
        lastRecommendations = [];
      }

      soloedModuleId = null;
      preSoloBypass.clear();
      modules.forEach(m => {
        if (m.thumbEl) {
          const soloBtn = m.thumbEl.querySelector('.solo-btn');
          if (soloBtn) soloBtn.classList.remove('active');
        }
        if (m.cardEl) {
          const soloBtn = m.cardEl.querySelector('.btn-solo');
          if (soloBtn) soloBtn.classList.remove('active');
        }
      });

      updateABButtons();
      refreshControlsState();

      // Si el panel de la onda estaba colapsado, abrirlo para poder cargar otra pista
      const wfSection = document.querySelector('.wf-section');
      if (wfSection && wfSection.classList.contains('collapsed')) {
        wfSection.classList.remove('collapsed');
        const btnWf = document.getElementById('btn-toggle-waveform');
        if (btnWf) { btnWf.classList.remove('active'); btnWf.innerHTML = '▲'; }
      }
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
// FUNCIONES A/B
// --------------------------------------------------------------
function getCurrentSlotData() {
  return {
    modules: modules.map(m => ({
      type: m.type,
      params: { ...m.params },
      bypassed: m.bypassed
    })),
    outputGainDb: outGainDb,
    loop: {
      enabled: loopEnabled,
      start: loopStart,
      end: loopEnd
    }
  };
}

function restoreSlotData(data) {
  [...modules].forEach(m => removeModule(m.id));
  (data.modules || []).forEach(item => {
    const type = MODULE_MIGRATION[item.type] || item.type;
    addModule(type, item.params || {}, item.bypassed);
  });
  if (data.outputGainDb !== undefined) applyOutGain(data.outputGainDb);
  if (data.loop) {
    setLoopEnabled(!!data.loop.enabled);
    setLoopStart(data.loop.start || 0);
    setLoopEnd(data.loop.end || 1);
    if (btnLoop) btnLoop.classList.toggle('is-loop', loopEnabled);
  }
  if (modules.length > 0) setActiveModule(modules[0].id);
}

function switchToSlot(slotName) {
  if (activeSlot === slotName) return;

  if (activeSlot === 'A') setSlotA(getCurrentSlotData());
  else setSlotB(getCurrentSlotData());

  const targetData = slotName === 'A' ? slotA : slotB;

  if (!targetData || !targetData.modules || targetData.modules.length === 0) {
    const otherSlot = slotName === 'A' ? slotB : slotA;
    if (otherSlot && otherSlot.modules && otherSlot.modules.length > 0) {
      if (confirm(`Slot ${slotName} is empty. Copy modules from slot ${slotName === 'A' ? 'B' : 'A'}?`)) {
        const copyData = JSON.parse(JSON.stringify(otherSlot));
        if (slotName === 'A') setSlotA(copyData);
        else setSlotB(copyData);
        restoreSlotData(copyData);
        setActiveSlot(slotName);
        updateABButtons();
        return;
      }
    }
    [...modules].forEach(m => removeModule(m.id));
    setActiveSlot(slotName);
    updateABButtons();
    return;
  }

  setActiveSlot(slotName);
  restoreSlotData(targetData);
  updateABButtons();
}

function updateABButtons() {
  const btnA = document.getElementById('btn-slot-a');
  const btnB = document.getElementById('btn-slot-b');
  if (btnA) btnA.classList.toggle('active', activeSlot === 'A');
  if (btnB) btnB.classList.toggle('active', activeSlot === 'B');
}

document.getElementById('btn-slot-a')?.addEventListener('click', () => switchToSlot('A'));
document.getElementById('btn-slot-b')?.addEventListener('click', () => switchToSlot('B'));

// --------------------------------------------------------------
// PRESETS DE INSTRUMENTOS
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
    chain.forEach(item => {
      if (typeof item === 'string') {
        addModule(item);
      } else if (item && item.type) {
        addModule(item.type, item.params || {});
      }
    });

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

  if (activeSlot === 'A') setSlotA(getCurrentSlotData());
  else setSlotB(getCurrentSlotData());

  const data = {
    version: '2.0',
    slotA: slotA ? { ...slotA } : null,
    slotB: slotB ? { ...slotB } : null,
    activeSlot: activeSlot
  };

  const defaultName = 'rack4master-preset';
  const customName = prompt('Preset name:', defaultName);
  if (!customName) return;

  const fileName = customName.endsWith('.json') ? customName : customName + '.json';
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function loadPresetFromFile(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.version === '1.2' || !data.slotA) {
        [...modules].forEach(m => removeModule(m.id));
        if (data.loop) {
          setLoopEnabled(!!data.loop.enabled);
          setLoopStart(data.loop.start || 0);
          setLoopEnd(data.loop.end || 1);
          if (btnLoop) btnLoop.classList.toggle('is-loop', loopEnabled);
        }
        if (data.outputGainDb !== undefined) applyOutGain(data.outputGainDb);
        (data.modules || []).forEach(item => {
          // Migración: nombres de módulos antiguos → nuevos
          const type = MODULE_MIGRATION[item.type] || item.type;
          addModule(type, item.params || {}, item.bypassed);
        });
        if (modules.length > 0) setActiveModule(modules[0].id);
        setSlotA(getCurrentSlotData());
        setSlotB(null);
        setActiveSlot('A');
      } else {
        if (data.slotA) setSlotA(data.slotA);
        if (data.slotB) setSlotB(data.slotB);
        setActiveSlot(data.activeSlot || 'A');
        const slotData = data.activeSlot === 'B' ? data.slotB : data.slotA;
        if (slotData) restoreSlotData(slotData);
      }
      updateABButtons();
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
// EXPORTAR WAV - CON SELECCIÓN DE FORMATO
// --------------------------------------------------------------
let exportBitDepth = 16;
let exportSampleRate = 0; // 0 = original

// Inyectar estilos del diálogo (solo una vez)
function injectExportStyles() {
  if (document.getElementById('export-dialog-styles')) return;
  const style = document.createElement('style');
  style.id = 'export-dialog-styles';
  style.textContent = `
    .export-dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.72);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .export-dialog-box {
      background: var(--panel);
      border: 1px solid var(--border2);
      border-radius: 12px;
      padding: 24px 28px;
      min-width: 280px;
      max-width: 340px;
      font-family: var(--fnt-ui);
      color: var(--tx1);
    }
    .export-dialog-box h3 {
      font-family: var(--fnt-display);
      font-size: 1rem;
      letter-spacing: 2px;
      color: var(--amber);
      margin: 0 0 18px;
    }
    .efmt-label {
      font-size: 0.75rem;
      color: var(--tx3);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .efmt-group {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .efmt-opt {
      flex: 1;
      padding: 8px 0;
      border: 1px solid var(--border2);
      border-radius: 6px;
      background: transparent;
      color: var(--tx2);
      font-family: var(--fnt-ui);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .efmt-opt.sel {
      background: var(--amber);
      border-color: var(--amber);
      color: #000;
    }
    .efmt-actions {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }
    .efmt-cancel, .efmt-go {
      flex: 1;
      padding: 8px;
      border-radius: 6px;
      font-family: var(--fnt-ui);
      font-weight: 600;
      cursor: pointer;
      border: none;
    }
    .efmt-cancel {
      background: transparent;
      border: 1px solid var(--border2);
      color: var(--tx3);
    }
    .efmt-go {
      background: var(--green);
      color: #000;
    }
    .efmt-go:hover { filter: brightness(1.1); }
  `;
  document.head.appendChild(style);
}

function showExportDialog() {
  injectExportStyles();
  let dlg = document.getElementById('exportFmtDialog');
  if (!dlg) {
    const div = document.createElement('div');
    div.id = 'exportFmtDialog';
    div.className = 'export-dialog-overlay';
    div.innerHTML = `
      <div class="export-dialog-box">
        <h3>📀 Exportar WAV</h3>
        <div class="efmt-label">Profundidad de bits</div>
        <div class="efmt-group">
          <button class="efmt-opt" data-bits="16">16 bits</button>
          <button class="efmt-opt" data-bits="24">24 bits</button>
        </div>
        <div class="efmt-label">Frecuencia de muestreo</div>
        <div class="efmt-group">
          <button class="efmt-opt" data-sr="0">Original</button>
          <button class="efmt-opt" data-sr="48000">48.000 Hz</button>
        </div>
        <div class="efmt-actions">
          <button class="efmt-cancel">Cancelar</button>
          <button class="efmt-go">Descargar</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    dlg = div;

    dlg.querySelectorAll('.efmt-opt[data-bits]').forEach(btn => {
      btn.addEventListener('click', () => {
        exportBitDepth = parseInt(btn.dataset.bits, 10);
        dlg.querySelectorAll('.efmt-opt[data-bits]').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
      });
    });
    dlg.querySelectorAll('.efmt-opt[data-sr]').forEach(btn => {
      btn.addEventListener('click', () => {
        exportSampleRate = parseInt(btn.dataset.sr, 10);
        dlg.querySelectorAll('.efmt-opt[data-sr]').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
      });
    });
    dlg.querySelector('.efmt-cancel').addEventListener('click', () => {
      dlg.style.display = 'none';
    });
    dlg.querySelector('.efmt-go').addEventListener('click', async () => {
      dlg.style.display = 'none';
      await doExport(exportBitDepth, exportSampleRate);
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.style.display = 'none';
    });
  }

  // Sync visual state
  const bitsBtns = dlg.querySelectorAll('.efmt-opt[data-bits]');
  bitsBtns.forEach(btn => {
    const bits = parseInt(btn.dataset.bits, 10);
    btn.classList.toggle('sel', bits === exportBitDepth);
  });
  const srBtns = dlg.querySelectorAll('.efmt-opt[data-sr]');
  srBtns.forEach(btn => {
    const sr = parseInt(btn.dataset.sr, 10);
    btn.classList.toggle('sel', sr === exportSampleRate);
  });

  dlg.style.display = 'flex';
}

async function doExport(bitDepth, sampleRate) {
  if (!audioBuffer) return;
  const exportBtn = document.getElementById('btn-export-wav');
  if (!exportBtn) return;
  exportBtn.disabled = true;
  const originalText = exportBtn.innerHTML;
  exportBtn.innerHTML = '⟳ Renderizando...';
  try {
    const chainArea = document.getElementById('chain-area');
    const targetSR = (sampleRate === 48000) ? 48000 : null;
    const rendered = await renderOffline(audioBuffer, modules, globalBypass, outGainDb, chainArea, targetSR);
    downloadWav(rendered, bitDepth);
  } catch (err) {
    console.error(err);
    alert('Error al exportar el audio');
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = originalText;
  }
}

// Reemplazar el manejador original del botón de exportación
const originalExportBtn = document.getElementById('btn-export-wav');
if (originalExportBtn) {
  const newExportBtn = originalExportBtn.cloneNode(true);
  originalExportBtn.parentNode.replaceChild(newExportBtn, originalExportBtn);
  newExportBtn.addEventListener('click', () => {
    if (!audioBuffer) { alert('Carga un archivo de audio primero'); return; }
    showExportDialog();
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
// Modal de atajos de teclado
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
window.moduleDescriptions = new Proxy({}, {
  get: function(target, moduleType) {
    var key = 'info.' + moduleType + '.desc';
    var val = window.getTranslation ? window.getTranslation(key) : null;
    return val || null;
  }
});

window.showModuleInfo = (moduleType) => {
  var title = (window.getTranslation ? window.getTranslation('info.' + moduleType + '.title') : null)
              || moduleType;
  var desc  = (window.getTranslation ? window.getTranslation('info.' + moduleType + '.desc') : null)
              || '';
  if (!desc) return;
  if (modalOverlay && modalTitle && modalBody) {
    modalTitle.textContent = title;
    modalBody.innerHTML = '<p>' + desc + '</p>';
    modalOverlay.classList.remove('hidden');
  }
};

// --------------------------------------------------------------
// ESPECTRO Y ASISTENTE (panel desplegable)
// --------------------------------------------------------------
const btnToggleSpectrum = document.getElementById('btn-toggle-spectrum');
const btnSpectrumMode = document.getElementById('btn-spectrum-mode');
const spectrumPanel = document.getElementById('spectrum-panel');
const spectrumCanvas = document.getElementById('spectrum-canvas');
const btnAnalyze = document.getElementById('btn-analyze');
const spectrumResultsList = document.getElementById('spectrum-results-list');
const btnApplyRecommendations = document.getElementById('btn-apply-recommendations');

let spectrumVisible = false;
let lastRecommendations = [];
let spectrumMode = 'bars';

initSpectrum(spectrumCanvas);

btnToggleSpectrum.addEventListener('click', () => {
  spectrumVisible = !spectrumVisible;
  const label = window.getTranslation('ui.spectrum_label') || 'SPECTRUM';
  if (spectrumVisible) {
    spectrumPanel.classList.remove('hidden');
    btnToggleSpectrum.classList.add('active');
    btnToggleSpectrum.innerHTML = '▲ ' + label;
    resizeSpectrum();
    startSpectrumLoop();
  } else {
    spectrumPanel.classList.add('hidden');
    btnToggleSpectrum.classList.remove('active');
    btnToggleSpectrum.innerHTML = '▼ ' + label;
    stopSpectrumLoop();
  }
});

btnSpectrumMode.addEventListener('click', () => {
  if (spectrumMode === 'bars') {
    spectrumMode = 'line';
    btnSpectrumMode.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 7h3l2-4 2 8 2-4h3"/></svg>`;
    btnSpectrumMode.classList.add('active');
  } else {
    spectrumMode = 'bars';
    btnSpectrumMode.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="3" height="9" rx="0.5"/><rect x="5.5" y="1" width="3" height="12" rx="0.5"/><rect x="10" y="6" width="3" height="7" rx="0.5"/></svg>`;
    btnSpectrumMode.classList.remove('active');
  }
  setSpectrumMode(spectrumMode);
});

btnAnalyze.addEventListener('click', async () => {
  if (!audioBuffer) {
    alert('Load an audio file first');
    return;
  }
  btnAnalyze.disabled = true;
  btnAnalyze.textContent = '⟳ Analizando…';
  try {
    const recommendations = await analyzeAndRecommend(audioBuffer);
    lastRecommendations = recommendations;
    const copyBtn = document.getElementById('btn-copy-results');

    if (recommendations.length === 0) {
      spectrumResultsList.innerHTML = '<div class="spectrum-results-empty">✅ No significant problems detected.</div>';
      btnApplyRecommendations.classList.add('hidden');
      if (copyBtn) copyBtn.classList.add('hidden');
    } else {
      let html = '';
      recommendations.forEach(r => html += `<div class="spectrum-result-item">• ${r.reason}</div>`);
      spectrumResultsList.innerHTML = html;
      btnApplyRecommendations.classList.remove('hidden');
      if (copyBtn) {
        copyBtn.classList.remove('hidden');
        copyBtn.onclick = () => {
          const lines = recommendations.map(r => '• ' + r.reason);
          navigator.clipboard.writeText(lines.join('\n')).then(() => {
            copyBtn.textContent = '✓ Copiado';
            setTimeout(() => { copyBtn.textContent = '⎘ Copiar'; }, 1800);
          });
        };
      }
    }
    if (!spectrumVisible) btnToggleSpectrum.click();
  } catch (err) {
    console.error(err);
    spectrumResultsList.innerHTML = '<div class="spectrum-results-empty">❌ Error during analysis</div>';
    btnApplyRecommendations.classList.add('hidden');
    const copyBtn = document.getElementById('btn-copy-results');
    if (copyBtn) copyBtn.classList.add('hidden');
  } finally {
    btnAnalyze.disabled = false;
    btnAnalyze.textContent = '🔍 ANALYZE & RECOMMEND';
  }
});

btnApplyRecommendations.addEventListener('click', () => {
  if (lastRecommendations.length === 0) return;
  const old = [...modules];
  old.forEach(m => removeModule(m.id));
  lastRecommendations.forEach(r => addModule(r.type, r.params, false));
  spectrumResultsList.innerHTML = '<div class="spectrum-results-empty">✅ Chain applied! Tweak to taste.</div>';
  btnApplyRecommendations.classList.add('hidden');
  const copyBtn = document.getElementById('btn-copy-results');
  if (copyBtn) copyBtn.classList.add('hidden');
  lastRecommendations = [];
});

// --------------------------------------------------------------
// TOGGLES DE COLAPSAR PANELES (WAVEFORM / SIDEBAR / CHAIN)
// --------------------------------------------------------------
const btnToggleWaveform = document.getElementById('btn-toggle-waveform');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const btnToggleChain = document.getElementById('btn-toggle-chain');

if (btnToggleWaveform) {
  let spectrumWasOpen = false;  // recuerda si el espectro estaba abierto al colapsar
  btnToggleWaveform.addEventListener('click', () => {
    const wfSection = document.querySelector('.wf-section');
    if (!wfSection) return;
    const isCollapsed = wfSection.classList.toggle('collapsed');
    btnToggleWaveform.classList.toggle('active', isCollapsed);
    btnToggleWaveform.innerHTML = isCollapsed ? '▼' : '▲';

    if (isCollapsed) {
      // Guardar estado y cerrar espectro
      spectrumWasOpen = spectrumVisible;
      if (spectrumVisible) {
        stopSpectrumLoop();
        spectrumPanel.classList.add('hidden');
        btnToggleSpectrum.classList.remove('active');
        const label = window.getTranslation('ui.spectrum_label') || 'SPECTRUM';
        btnToggleSpectrum.innerHTML = '▼ ' + label;
        spectrumVisible = false;
      }
    } else {
      // Al reabrir la onda, restaurar espectro si estaba abierto
      if (spectrumWasOpen) {
        spectrumPanel.classList.remove('hidden');
        btnToggleSpectrum.classList.add('active');
        const label = window.getTranslation('ui.spectrum_label') || 'SPECTRUM';
        btnToggleSpectrum.innerHTML = '▲ ' + label;
        spectrumVisible = true;
        resizeSpectrum();
        if (audioBuffer) startSpectrumLoop();
      }
      spectrumWasOpen = false;
    }
  });
}

if (btnToggleSidebar) {
  btnToggleSidebar.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      btnToggleSidebar.classList.toggle('active');
      btnToggleSidebar.innerHTML = sidebar.classList.contains('collapsed') ? '◀' : '▶';
    }
  });
}

if (btnToggleChain) {
  btnToggleChain.addEventListener('click', () => {
    const chainSection = document.querySelector('.chain-section');
    if (chainSection) {
      chainSection.classList.toggle('collapsed');
      btnToggleChain.classList.toggle('active');
      btnToggleChain.innerHTML = chainSection.classList.contains('collapsed') ? '▲' : '▼';
    }
  });
}

// --------------------------------------------------------------
// INICIALIZACIÓN FINAL
// --------------------------------------------------------------
initSidebarDrag();
initChainDropZone();
initMeters();
updateAllTranslations();

updatePlayPauseIcon();
updateABButtons();
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
