// js/modules/deesser.js
// NUEVO: fusión de deesser.js (estático) + deesserpro.js (dinámico)
// Implementación dinámica: split-band compressor en la banda de sibilancia.
// El de-esser estático anterior era un notch fijo (cortaba SIEMPRE, no solo
// cuando había sibilancia). Este corta solo cuando el nivel supera el umbral.

import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'DE-ESSER';
export const color = '#cc55ff';

export const params = {
  frequency: { label:'FREQ',    min:2000, max:12000, def:6500, step:50,  unit:'Hz' },
  threshold: { label:'THRESH',  min:-60,  max:0,     def:-18,  step:0.5, unit:'dB' },
  ratio:     { label:'RATIO',   min:1,    max:20,    def:4,    step:0.1, unit:':1' },
  attack:    { label:'ATTACK',  min:0,    max:100,   def:3,    step:0.5, unit:'ms' },
  release:   { label:'RELEASE', min:10,   max:500,   def:100,  step:1,   unit:'ms' },
  mix:       { label:'MIX',     min:0,    max:100,   def:100,  step:1,   unit:'%'  },
  output:    { label:'OUTPUT',  min:-18,  max:6,     def:0,    step:0.5, unit:'dB' }
};

export function buildNodes(ctx, p) {
  const input  = ctx.createGain();
  const output = ctx.createGain();

  // Split: banda alta (sibilancia) y banda baja
  // Crossover más estrecho (Q=2) para mejor selectividad de sibilancia
  const cutoff = Math.max(500, p.frequency - 500);
  const filterHigh = ctx.createBiquadFilter();
  filterHigh.type = 'highpass';
  filterHigh.frequency.value = cutoff;
  filterHigh.Q.value = 2.0;   // mejor selectividad (antes: 1.2)

  const filterLow  = ctx.createBiquadFilter();
  filterLow.type   = 'lowpass';
  filterLow.frequency.value = cutoff;
  filterLow.Q.value = 2.0;

  input.connect(filterHigh);
  input.connect(filterLow);

  // Compresor en la banda alta (sibilancia)
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = p.threshold;
  comp.ratio.value     = p.ratio;
  comp.knee.value      = 4;
  comp.attack.value    = p.attack  / 1000;
  comp.release.value   = p.release / 1000;
  filterHigh.connect(comp);

  // Mezcla wet: banda baja sin procesar + banda alta comprimida
  const lowGain  = ctx.createGain();
  const highGain = ctx.createGain();
  filterLow.connect(lowGain);
  comp.connect(highGain);
  const wetSum = ctx.createGain();
  lowGain.connect(wetSum);
  highGain.connect(wetSum);
  wetSum.gain.value = p.mix / 100;

  // Señal seca (bypass parcial)
  const dry = ctx.createGain();
  input.connect(dry);
  dry.gain.value = 1 - p.mix / 100;

  const finalSum = ctx.createGain();
  dry.connect(finalSum);
  wetSum.connect(finalSum);

  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(p.output);
  finalSum.connect(outGain);
  outGain.connect(output);

  return { input, output, filterHigh, filterLow, comp, lowGain, highGain, wetSum, dry, finalSum, outGain };
}

export function updateParam(nodes, key, value, currentTime, allParams) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'frequency': {
      const cutoff = Math.max(500, value - 500);
      r(nodes.filterHigh.frequency, cutoff);
      r(nodes.filterLow.frequency,  cutoff);
      break;
    }
    case 'threshold': r(nodes.comp.threshold, value); break;
    case 'ratio':     r(nodes.comp.ratio,     value); break;
    case 'attack':    r(nodes.comp.attack,     value / 1000); break;
    case 'release':   r(nodes.comp.release,    value / 1000); break;
    case 'mix':
      r(nodes.wetSum.gain, value / 100);
      r(nodes.dry.gain,    1 - value / 100);
      break;
    case 'output': r(nodes.outGain.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default':        { frequency:6500, threshold:-18, ratio:4,   attack:3, release:100, mix:100, output:0 },
  'Female Voice':   { frequency:7500, threshold:-22, ratio:3.5, attack:2, release:80,  mix:100, output:0 },
  'Male Voice':     { frequency:5500, threshold:-20, ratio:4,   attack:4, release:120, mix:100, output:0 },
  'Vocal Gentle':   { frequency:7000, threshold:-28, ratio:2.5, attack:5, release:150, mix:80,  output:0 },
  'Aggressive':     { frequency:5500, threshold:-12, ratio:8,   attack:1, release:50,  mix:100, output:1 },
  'Drum Harshness': { frequency:5000, threshold:-15, ratio:5,   attack:2, release:80,  mix:100, output:1 },
  'Broadband':      { frequency:4000, threshold:-20, ratio:4,   attack:5, release:150, mix:100, output:0 }
};

// ----------------------------------------------------------------
// UI: medidor de GR de la banda + knobs
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def   = window.MODULE_DEFS['deesser'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Medidor GR
  const grRow = document.createElement('div');
  grRow.style.cssText = 'display:flex; align-items:center; gap:8px;';
  const grTrack = document.createElement('div');
  grTrack.style.cssText = 'width:160px; height:8px; background:#0a0a0e; border-radius:4px; border:1px solid #2a2a35; overflow:hidden;';
  const grFill = document.createElement('div');
  grFill.style.cssText = 'height:100%; width:0; background:#cc55ff; border-radius:4px; transition:width .08s linear;';
  grTrack.appendChild(grFill);
  const grLabel = document.createElement('span');
  grLabel.style.cssText = 'font-family:"Share Tech Mono",monospace; font-size:9px; color:#888;';
  grLabel.textContent = 'GR';
  grRow.appendChild(grLabel);
  grRow.appendChild(grTrack);
  container.appendChild(grRow);

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:10px; justify-content:center; flex-wrap:wrap;';
  ['frequency','threshold','ratio','attack','release','mix','output'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  function updateGR() {
    if (!mod.nodes?.comp) { requestAnimationFrame(updateGR); return; }
    const pct = Math.min(1, Math.abs(mod.nodes.comp.reduction) / 30);
    grFill.style.width = (pct * 100) + '%';
    requestAnimationFrame(updateGR);
  }
  updateGR();

  return container;
}
