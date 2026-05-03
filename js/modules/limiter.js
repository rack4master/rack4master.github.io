// js/modules/limiter.js
import { dbToGain } from '../utils.js';

export const label = 'LIMITADOR';
export const color = '#ff3366';

export const params = {
  threshold: { label:'THRESH', min:-30, max:0, def:-1, step:0.1, unit:'dB' },
  release: { label:'RELEASE', min:1, max:500, def:50, step:1, unit:'ms' },
  makeup: { label:'MAKEUP', min:0, max:18, def:0, step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  const makeup = ctx.createGain();
  comp.threshold.value = params.threshold;
  comp.ratio.value = 20;
  comp.knee.value = 0;
  comp.attack.value = 0.0005;
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
    case 'release': r(nodes.comp.release, value / 1000); break;
    case 'makeup': r(nodes.makeup.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default': { threshold: -1, release: 50, makeup: 0 },
  'Brickwall': { threshold: -0.5, release: 20, makeup: 0 },
  'Safe Limiter': { threshold: -3, release: 100, makeup: 2 },
  'Aggressive': { threshold: -0.2, release: 10, makeup: 3 },
  'Mastering': { threshold: -1.5, release: 80, makeup: 1 },
  'Transparent': { threshold: -2, release: 120, makeup: 0.5 },
  'Pumping': { threshold: -0.8, release: 5, makeup: 2 }
};
