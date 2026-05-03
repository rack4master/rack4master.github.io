// js/modules/softclipper.js
import { dbToGain } from '../utils.js';

export const label = 'SOFT CLIPPER';
export const color = '#ff8844';

export const params = {
  drive: { label:'DRIVE', min:1, max:20, def:2, step:0.5, unit:'x' },
  mix: { label:'MIX', min:0, max:100, def:80, step:1, unit:'%' },
  output: { label:'OUTPUT', min:-18, max:6, def:0, step:0.5, unit:'dB' }
};

function buildSoftClipCurve(drive) {
  const n = 2048;
  const curve = new Float32Array(n);
  const d = Math.max(0.1, drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * d) / Math.tanh(d);
  }
  return curve;
}

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.oversample = '4x';
  shaper.curve = buildSoftClipCurve(params.drive);

  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(params.output);

  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;

  input.connect(dry);
  input.connect(shaper);
  shaper.connect(wet);
  dry.connect(outGain);
  wet.connect(outGain);
  outGain.connect(output);

  return { input, output, dry, wet, shaper, outGain };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'drive':
      nodes.shaper.curve = buildSoftClipCurve(value);
      break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
    case 'output':
      r(nodes.outGain.gain, dbToGain(value));
      break;
  }
}

export const presets = {
  'Default': { drive: 2, mix: 80, output: 0 },
  'Gentle': { drive: 2, mix: 80, output: 0 },
  'Aggressive': { drive: 12, mix: 100, output: 2 },
  'Tape Saturation': { drive: 3, mix: 70, output: 1 },
  'Transparent': { drive: 1.5, mix: 50, output: 0 },
  'Pumping': { drive: 8, mix: 100, output: 3 },
  'Crisp': { drive: 4, mix: 90, output: 1.5 }
};
