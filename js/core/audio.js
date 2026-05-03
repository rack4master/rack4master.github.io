// js/core/audio.js
import { modules, globalBypass } from './state.js';
import { dbToGain } from '../utils.js';
import { MODULE_DEFS } from '../modules/defs.js';

// ------------------------------------------------------------
// Funciones auxiliares de construcción de buffers y curvas
// ------------------------------------------------------------
export function buildReverbIR(ctx, size, decay) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * size));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(Math.max(1 - i / len, 0), decay);
    }
  }
  return buf;
}

export function buildSatCurve(drive) {
  const n = 512;
  const curve = new Float32Array(n);
  const d = Math.max(1, drive);
  for (let i = 0; i < n; i++) {
    const x = i * 2 / n - 1;
    curve[i] = Math.tanh(x * d) / Math.tanh(d > 0 ? d : 1);
  }
  return curve;
}

// ------------------------------------------------------------
// Función que aplica un cambio de parámetro a un módulo
// ------------------------------------------------------------
export function applyParam(mod, key, value) {
  if (!mod || !mod.nodes) return;
  mod.params[key] = value;
  const t = window.audioCtx.currentTime;

  const moduleDef = MODULE_DEFS[mod.type];
  if (moduleDef && moduleDef.updateParam) {
    // Se pasa también mod.params como quinto argumento (usado por reverb)
    moduleDef.updateParam(mod.nodes, key, value, t, mod.params);
  } else {
    console.warn(`Módulo ${mod.type} no tiene updateParam`);
  }
}

// ------------------------------------------------------------
// Funciones de gestión del contexto y ruteo
// ------------------------------------------------------------
export function ensureCtx() {
  if (window.audioCtx) return;
  window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  window.audioCtx.analyserL = window.audioCtx.createAnalyser();
  window.audioCtx.analyserL.fftSize = 512;
  window.audioCtx.analyserR = window.audioCtx.createAnalyser();
  window.audioCtx.analyserR.fftSize = 512;
  const splitter = window.audioCtx.createChannelSplitter(2);
  const merger = window.audioCtx.createChannelMerger(2);
  window.audioCtx.chainInput = window.audioCtx.createGain();
  window.audioCtx.chainOutput = window.audioCtx.createGain();
  window.audioCtx.outputGainNode = window.audioCtx.createGain();
  window.audioCtx.outputGainNode.gain.value = 1.0;
  window.audioCtx.chainOutput.connect(window.audioCtx.outputGainNode);
  window.audioCtx.outputGainNode.connect(splitter);
  splitter.connect(window.audioCtx.analyserL, 0);
  splitter.connect(window.audioCtx.analyserR, 1);
  splitter.connect(merger, 0, 0);
  splitter.connect(merger, 1, 1);
  merger.connect(window.audioCtx.destination);
}

export function rewireChain() {
  if (!window.audioCtx) return;
  try { window.audioCtx.chainInput.disconnect(); } catch(e) {}
  modules.forEach(m => { try { m.nodes.output.disconnect(); } catch(e) {} });

  const active = globalBypass ? [] : modules.filter(m => !m.bypassed);

  if (active.length === 0) {
    window.audioCtx.chainInput.connect(window.audioCtx.chainOutput);
  } else {
    window.audioCtx.chainInput.connect(active[0].nodes.input);
    for (let i = 0; i < active.length-1; i++) active[i].nodes.output.connect(active[i+1].nodes.input);
    active[active.length-1].nodes.output.connect(window.audioCtx.chainOutput);
  }
}

// ------------------------------------------------------------
// Construcción de nodos de audio para cada tipo de módulo
// ------------------------------------------------------------
export function buildAudioNodes(type, params, offlineCtx = null) {
  const ctx = offlineCtx || window.audioCtx;
  if (!offlineCtx) ensureCtx();

  const moduleDef = MODULE_DEFS[type];
  if (moduleDef && moduleDef.buildNodes) {
    return moduleDef.buildNodes(ctx, params);
  } else {
    console.warn(`Módulo ${type} no tiene buildNodes`);
    // Fallback: un bypass directo
    const input = ctx.createGain();
    const output = ctx.createGain();
    input.connect(output);
    return { input, output };
  }
}
