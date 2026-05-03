// js/modules/chorus.js
export const label = 'CHORUS';
export const color = '#3388ff';

export const params = {
  rate: { label:'RATE', min:0.1, max:10, def:1.5, step:0.1, unit:'Hz' },
  depth: { label:'DEPTH', min:0.1, max:20, def:5, step:0.1, unit:'ms' },
  mix: { label:'MIX', min:0, max:100, def:50, step:1, unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.025;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = params.rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = params.depth / 1000;
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start(0);
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  input.connect(dry);
  input.connect(delay);
  delay.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, delay, lfo, lfoGain };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'rate': r(nodes.lfo.frequency, value); break;
    case 'depth': r(nodes.lfoGain.gain, value / 1000); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default': { rate: 1.5, depth: 5, mix: 50 },
  'Classic Chorus': { rate: 1.2, depth: 6, mix: 55 },
  'Fluffy': { rate: 0.8, depth: 8, mix: 60 },
  'Fast Warble': { rate: 4, depth: 3, mix: 40 },
  'Subtle Ensemble': { rate: 0.5, depth: 4, mix: 35 },
  'Deep Sweep': { rate: 0.3, depth: 12, mix: 70 },
  'Bright Chorus': { rate: 2, depth: 4, mix: 50 }
};
