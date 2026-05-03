// js/modules/deesserpro.js
import { dbToGain } from '../utils.js';

export const label = 'DE-ESSER PRO';
export const color = '#dd66ff';

export const params = {
  frequency: { label:'FREQ', min:2000, max:12000, def:6000, step:50, unit:'Hz' },
  threshold: { label:'THRESH', min:-60, max:0, def:-18, step:0.5, unit:'dB' },
  ratio: { label:'RATIO', min:1, max:20, def:4, step:0.1, unit:':1' },
  attack: { label:'ATTACK', min:0, max:500, def:5, step:0.5, unit:'ms' },
  release: { label:'RELEASE', min:10, max:1000, def:150, step:1, unit:'ms' },
  mix: { label:'MIX', min:0, max:100, def:100, step:1, unit:'%' },
  output: { label:'OUTPUT', min:-18, max:6, def:0, step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Filtros para separar banda alta (sibilancia) de la baja
  // Usamos un highpass para la banda a comprimir y un lowpass para la banda baja (opcional)
  const filterHigh = ctx.createBiquadFilter();
  filterHigh.type = 'highpass';
  filterHigh.frequency.value = params.frequency - 500;
  filterHigh.Q.value = 1.2;

  const filterLow = ctx.createBiquadFilter();
  filterLow.type = 'lowpass';
  filterLow.frequency.value = params.frequency - 500;
  filterLow.Q.value = 1.2;

  input.connect(filterHigh);
  input.connect(filterLow);

  // Compresor para la banda alta
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = params.threshold;
  compressor.ratio.value = params.ratio;
  compressor.knee.value = 6;
  compressor.attack.value = params.attack / 1000;
  compressor.release.value = params.release / 1000;

  filterHigh.connect(compressor);

  // Mezcla: banda baja (sin comprimir) + banda alta comprimida
  const lowGain = ctx.createGain();
  const highGain = ctx.createGain();
  filterLow.connect(lowGain);
  compressor.connect(highGain);

  const wetSum = ctx.createGain();
  lowGain.connect(wetSum);
  highGain.connect(wetSum);
  wetSum.gain.value = params.mix / 100;

  // Señal seca (original)
  const dry = ctx.createGain();
  input.connect(dry);
  dry.gain.value = 1 - params.mix / 100;

  const finalSum = ctx.createGain();
  dry.connect(finalSum);
  wetSum.connect(finalSum);

  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(params.output);
  finalSum.connect(outGain);
  outGain.connect(output);

  return { input, output, filterHigh, filterLow, compressor, lowGain, highGain, wetSum, dry, finalSum, outGain };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'frequency':
      const cutoff = value - 500;
      r(nodes.filterHigh.frequency, cutoff);
      r(nodes.filterLow.frequency, cutoff);
      break;
    case 'threshold':
      r(nodes.compressor.threshold, value);
      break;
    case 'ratio':
      r(nodes.compressor.ratio, value);
      break;
    case 'attack':
      r(nodes.compressor.attack, value / 1000);
      break;
    case 'release':
      r(nodes.compressor.release, value / 1000);
      break;
    case 'mix':
      r(nodes.wetSum.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
    case 'output':
      r(nodes.outGain.gain, dbToGain(value));
      break;
  }
}

export const presets = {
  'Default': { frequency: 6000, threshold: -18, ratio: 4, attack: 5, release: 150, mix: 100, output: 0 },
  'Vocal De-ess': { frequency: 7000, threshold: -22, ratio: 3, attack: 3, release: 100, mix: 100, output: 0 },
  'Drum Harshness': { frequency: 5000, threshold: -15, ratio: 5, attack: 2, release: 80, mix: 100, output: 1 },
  'Subtle': { frequency: 6500, threshold: -28, ratio: 2.5, attack: 8, release: 200, mix: 80, output: 0 },
  'Aggressive': { frequency: 5500, threshold: -12, ratio: 8, attack: 1, release: 50, mix: 100, output: 2 },
  'Broadband': { frequency: 4000, threshold: -20, ratio: 4, attack: 5, release: 150, mix: 100, output: 0 }
};
