// js/core/state.js
export let modules = [];
export let nextId = 0;
export let activeModuleId = null;
export let globalBypass = false;
export let loopEnabled = false;
export let loopStart = 0;
export let loopEnd = 1;
export let audioBuffer = null;
export let isPlaying = false;
export let startedAt = 0;
export let pauseOffset = 0;

// --- NUEVO: Slots A/B ---
export let slotA = null;   // objeto { modules, outputGainDb, loop } o null
export let slotB = null;
export let activeSlot = 'A'; // 'A' o 'B'
// -----------------------

export function addModuleToState(mod) { modules.push(mod); nextId = mod.id; }
export function removeModuleFromState(id) { const idx = modules.findIndex(m => m.id === id); if (idx !== -1) modules.splice(idx, 1); }
export function updateModuleBypass(id, bypassed) { const mod = modules.find(m => m.id === id); if (mod) mod.bypassed = bypassed; }
export function setActiveModuleId(id) { activeModuleId = id; }
export function setGlobalBypass(value) { globalBypass = value; }
export function setLoopEnabled(value) { loopEnabled = value; }
export function setLoopStart(value) { loopStart = value; }
export function setLoopEnd(value) { loopEnd = value; }
export function setAudioBuffer(buf) { audioBuffer = buf; }
export function setIsPlaying(value) { isPlaying = value; }
export function setStartedAt(value) { startedAt = value; }
export function setPauseOffset(value) { pauseOffset = value; }

// Actualiza el orden del array de módulos según el orden visual del DOM (usado por Sortable)
export function setModuleOrder(orderedModules) { modules = orderedModules; }

// --- NUEVO: setters de slots ---
export function setSlotA(data) { slotA = data; }
export function setSlotB(data) { slotB = data; }
export function setActiveSlot(slot) { activeSlot = slot; }
// ------------------------------
