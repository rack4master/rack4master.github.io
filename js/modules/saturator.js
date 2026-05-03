// js/modules/saturator.js
import { buildSatCurve } from '../core/audio.js';
import { dbToGain } from '../utils.js';

export const label = 'SATURADOR';
export const color = '#ff6633';

export const params = {
  drive: { label:'DRIVE', min:1, max:100, def:2, step:0.5, unit:'x' },
  tone: { label:'TONE', min:-10, max:10, def:0, step:0.5, unit:'dB' },
  mix: { label:'MIX', min:0, max:100, def:50, step:1, unit:'%' },
  output: { label:'OUTPUT', min:-18, max:6, def:0, step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.oversample = '4x';
  const toneF = ctx.createBiquadFilter();
  toneF.type = 'highshelf';
  toneF.frequency.value = 3000;
  toneF.gain.value = params.tone;
  const outGn = ctx.createGain();
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  shaper.curve = buildSatCurve(params.drive);
  outGn.gain.value = dbToGain(params.output);
  input.connect(dry);
  input.connect(shaper);
  shaper.connect(toneF);
  toneF.connect(wet);
  dry.connect(outGn);
  wet.connect(outGn);
  outGn.connect(output);
  return { input, output, dry, wet, shaper, toneF, outGn };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'drive': nodes.shaper.curve = buildSatCurve(value); break;
    case 'tone': r(nodes.toneF.gain, value); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
    case 'output': r(nodes.outGn.gain, dbToGain(value)); break;
  }
}

export const presets = {
  'Default': { drive: 2, tone: 0, mix: 50, output: 0 },
  'Tube Warmth': { drive: 15, tone: 2, mix: 60, output: 1 },
  'Tape Saturation': { drive: 8, tone: 1, mix: 70, output: 0 },
  'Amp Drive': { drive: 25, tone: 3, mix: 80, output: 2 },
  'Subtle': { drive: 5, tone: 0, mix: 40, output: 0 },
  'Creamy': { drive: 12, tone: -2, mix: 65, output: 1 },
  'Aggressive': { drive: 40, tone: 5, mix: 90, output: 3 }
};
