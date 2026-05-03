// js/modules/reverb.js
import { buildReverbIR } from '../core/audio.js';

export const label = 'REVERB';
export const color = '#aa66ff';

export const params = {
  size: { label:'SIZE', min:0.1, max:6, def:1.5, step:0.05, unit:'s' },
  decay: { label:'DECAY', min:0.5, max:8, def:2, step:0.1, unit:'x' },
  predelay: { label:'PRE-DLY', min:0, max:100, def:20, step:1, unit:'ms' },
  mix: { label:'MIX', min:0, max:100, def:30, step:1, unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const preDly = ctx.createDelay(0.15);
  const conv = ctx.createConvolver();
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  preDly.delayTime.value = params.predelay / 1000;
  conv.buffer = buildReverbIR(ctx, params.size, params.decay);
  input.connect(dry);
  input.connect(preDly);
  preDly.connect(conv);
  conv.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, preDly, conv };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'size':
    case 'decay':
      // Reconstruir la convolución con los valores actuales de size y decay
      const currentSize = key === 'size' ? value : params.size;
      const currentDecay = key === 'decay' ? value : params.decay;
      nodes.conv.buffer = buildReverbIR(window.audioCtx, currentSize, currentDecay);
      break;
    case 'predelay':
      r(nodes.preDly.delayTime, value / 1000);
      break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default': { size: 1.5, decay: 2, predelay: 20, mix: 30 },
  'Small Room': { size: 0.8, decay: 1.2, predelay: 10, mix: 25 },
  'Large Hall': { size: 4, decay: 4, predelay: 30, mix: 35 },
  'Cathedral': { size: 6, decay: 6, predelay: 40, mix: 40 },
  'Plate': { size: 1.2, decay: 1.8, predelay: 15, mix: 30 },
  'Ambience': { size: 0.5, decay: 0.8, predelay: 5, mix: 20 },
  'Epic': { size: 5, decay: 5, predelay: 50, mix: 45 }
};
