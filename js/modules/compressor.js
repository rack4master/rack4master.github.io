// js/modules/compressor.js
import { dbToGain } from '../utils.js';

export const label = 'COMPRESOR';
export const color = '#ffaa00';

export const params = {
  threshold: { label:'THRESH', min:-60, max:0, def:-18, step:0.5, unit:'dB' },
  ratio: { label:'RATIO', min:1, max:20, def:4, step:0.1, unit:':1' },
  knee: { label:'KNEE', min:0, max:40, def:10, step:0.5, unit:'dB' },
  attack: { label:'ATTACK', min:0, max:500, def:10, step:0.5, unit:'ms' },
  release: { label:'RELEASE', min:10, max:1000, def:150, step:1, unit:'ms' },
  makeup: { label:'MAKEUP', min:0, max:24, def:0, step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  const makeup = ctx.createGain();
  comp.threshold.value = params.threshold;
  comp.ratio.value = params.ratio;
  comp.knee.value = params.knee;
  comp.attack.value = params.attack / 1000;
  comp.release.value = params.release / 1000;
  makeup.gain.value = dbToGain(params.makeup);
  input.connect(comp);
  comp.connect(makeup);
  makeup.connect(output);
  return { input, output, comp, makeup };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'threshold': r(nodes.comp.threshold, value); break;
    case 'ratio': r(nodes.comp.ratio, value); break;
    case 'knee': r(nodes.comp.knee, value); break;
    case 'attack': r(nodes.comp.attack, value / 1000); break;
    case 'release': r(nodes.comp.release, value / 1000); break;
    case 'makeup': r(nodes.makeup.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default': { threshold: -18, ratio: 4, knee: 10, attack: 10, release: 150, makeup: 0 },
  'Vocal Leveler': { threshold: -24, ratio: 3, knee: 8, attack: 5, release: 80, makeup: 2 },
  'Drum Smash': { threshold: -12, ratio: 8, knee: 0, attack: 1, release: 50, makeup: 4 },
  'Bass Glue': { threshold: -20, ratio: 4, knee: 12, attack: 20, release: 200, makeup: 2 },
  'Master Bus': { threshold: -6, ratio: 2, knee: 6, attack: 30, release: 300, makeup: 0 },
  'Fast Limiter': { threshold: -10, ratio: 12, knee: 3, attack: 0.5, release: 100, makeup: 3 },
  'Smooth Opto': { threshold: -15, ratio: 2.5, knee: 15, attack: 15, release: 250, makeup: 1 }
};
