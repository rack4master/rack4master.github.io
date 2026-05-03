// js/modules/gate.js
export const label = 'PUERTA DE RUIDO';
export const color = '#4488ff';

export const params = {
  threshold: { label:'THRESH', min:-96, max:0, def:-40, step:0.5, unit:'dB' },
  attack: { label:'ATTACK', min:0, max:500, def:5, step:0.5, unit:'ms' },
  release: { label:'RELEASE', min:0, max:1000, def:100, step:1, unit:'ms' },
  ratio: { label:'RATIO', min:1, max:20, def:12, step:0.1, unit:':1' },
  knee: { label:'KNEE', min:0, max:40, def:0, step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = params.threshold;
  comp.ratio.value = params.ratio;
  comp.knee.value = params.knee;
  comp.attack.value = params.attack / 1000;
  comp.release.value = params.release / 1000;
  input.connect(comp);
  comp.connect(output);
  return { input, output, comp };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'threshold': r(nodes.comp.threshold, value); break;
    case 'ratio': r(nodes.comp.ratio, value); break;
    case 'knee': r(nodes.comp.knee, value); break;
    case 'attack': r(nodes.comp.attack, value / 1000); break;
    case 'release': r(nodes.comp.release, value / 1000); break;
  }
}

export const presets = {
  'Default': { threshold: -40, ratio: 12, knee: 0, attack: 5, release: 100 },
  'Fast Gate': { threshold: -50, ratio: 15, knee: 0, attack: 1, release: 50 },
  'Slow Release': { threshold: -35, ratio: 10, knee: 5, attack: 10, release: 300 },
  'Hard Gate': { threshold: -45, ratio: 20, knee: 0, attack: 0.5, release: 80 },
  'Drum Gate': { threshold: -30, ratio: 8, knee: 10, attack: 15, release: 150 },
  'Vocal Gate': { threshold: -55, ratio: 12, knee: 8, attack: 5, release: 120 },
  'Bass Gate': { threshold: -40, ratio: 10, knee: 12, attack: 20, release: 200 }
};
