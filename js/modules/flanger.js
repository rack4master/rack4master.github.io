// js/modules/flanger.js
export const label = 'FLANGER';
export const color = '#aa33ff';

export const params = {
  rate: { label:'RATE', min:0.1, max:10, def:0.5, step:0.1, unit:'Hz' },
  depth: { label:'DEPTH', min:0.1, max:10, def:2, step:0.1, unit:'ms' },
  feedback: { label:'FEEDBK', min:0, max:90, def:50, step:1, unit:'%' },
  mix: { label:'MIX', min:0, max:100, def:50, step:1, unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.005;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = params.rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = params.depth / 1000;
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start(0);
  const fb = ctx.createGain();
  fb.gain.value = params.feedback / 100;
  delay.connect(fb);
  fb.connect(delay);
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  input.connect(dry);
  input.connect(delay);
  delay.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, delay, lfo, lfoGain, fb };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'rate': r(nodes.lfo.frequency, value); break;
    case 'depth': r(nodes.lfoGain.gain, value / 1000); break;
    case 'feedback': r(nodes.fb.gain, value / 100); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default': { rate: 0.5, depth: 2, feedback: 50, mix: 50 },
  'Jet Plane': { rate: 1.2, depth: 5, feedback: 70, mix: 60 },
  'Subtle Sweep': { rate: 0.3, depth: 1.5, feedback: 30, mix: 40 },
  'Deep Flange': { rate: 0.8, depth: 4, feedback: 60, mix: 55 },
  'Resonant': { rate: 0.2, depth: 3, feedback: 80, mix: 65 },
  'Fast Swirl': { rate: 3, depth: 2, feedback: 40, mix: 50 },
  'Classic 80s': { rate: 0.5, depth: 2.5, feedback: 55, mix: 50 }
};
