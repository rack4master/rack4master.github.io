// js/modules/tremolo.js
export const label = 'TREMOLO';
export const color = '#ff33aa';

export const params = {
  rate: { label:'RATE', min:0.1, max:20, def:5, step:0.1, unit:'Hz' },
  depth: { label:'DEPTH', min:0, max:100, def:60, step:1, unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const tremGain = ctx.createGain();
  tremGain.gain.value = 1 - (params.depth / 200);
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = params.rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = params.depth / 200;
  lfo.connect(lfoGain);
  lfoGain.connect(tremGain.gain);
  lfo.start(0);
  input.connect(tremGain);
  tremGain.connect(output);
  return { input, output, tremGain, lfo, lfoGain };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'rate': r(nodes.lfo.frequency, value); break;
    case 'depth':
      r(nodes.tremGain.gain, 1 - value / 200);
      r(nodes.lfoGain.gain, value / 200);
      break;
  }
}

export const presets = {
  'Default': { rate: 5, depth: 60 },
  'Slow Pulse': { rate: 1.5, depth: 50 },
  'Fast Vibe': { rate: 12, depth: 70 },
  'Subtle Wobble': { rate: 3, depth: 30 },
  'Deep Trem': { rate: 4, depth: 90 },
  'Helicopter': { rate: 18, depth: 100 },
  'Gentle': { rate: 2, depth: 40 }
};
