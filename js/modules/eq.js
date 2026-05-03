// js/modules/eq.js
export const label = 'ECUALIZADOR 4-B';
export const color = '#33dd77';
export const wide = true;

export const bands = [
  { prefix: 'b1', label: 'B1 — LOW SHELF', type: 'lowshelf', defFreq: 80, defGain: 0, defQ: 1 },
  { prefix: 'b2', label: 'B2 — LO-MID', type: 'peaking', defFreq: 500, defGain: 0, defQ: 1 },
  { prefix: 'b3', label: 'B3 — HI-MID', type: 'peaking', defFreq: 3000, defGain: 0, defQ: 1 },
  { prefix: 'b4', label: 'B4 — HI SHELF', type: 'highshelf', defFreq: 10000, defGain: 0, defQ: 1 }
];

export const params = {
  b1Freq: { label:'FREQ', min:20, max:1000, def:80, step:1, unit:'Hz' },
  b1Gain: { label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' },
  b1Q: { label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' },
  b2Freq: { label:'FREQ', min:100, max:5000, def:500, step:5, unit:'Hz' },
  b2Gain: { label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' },
  b2Q: { label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' },
  b3Freq: { label:'FREQ', min:500, max:10000, def:3000, step:10, unit:'Hz' },
  b3Gain: { label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' },
  b3Q: { label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' },
  b4Freq: { label:'FREQ', min:2000, max:22000, def:10000, step:50, unit:'Hz' },
  b4Gain: { label:'GAIN', min:-18, max:18, def:0, step:0.5, unit:'dB' },
  b4Q: { label:'Q', min:0.1, max:10, def:1, step:0.1, unit:'' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const b1 = ctx.createBiquadFilter(); b1.type = 'lowshelf'; b1.frequency.value = params.b1Freq; b1.gain.value = params.b1Gain; b1.Q.value = params.b1Q;
  const b2 = ctx.createBiquadFilter(); b2.type = 'peaking'; b2.frequency.value = params.b2Freq; b2.gain.value = params.b2Gain; b2.Q.value = params.b2Q;
  const b3 = ctx.createBiquadFilter(); b3.type = 'peaking'; b3.frequency.value = params.b3Freq; b3.gain.value = params.b3Gain; b3.Q.value = params.b3Q;
  const b4 = ctx.createBiquadFilter(); b4.type = 'highshelf'; b4.frequency.value = params.b4Freq; b4.gain.value = params.b4Gain; b4.Q.value = params.b4Q;
  input.connect(b1); b1.connect(b2); b2.connect(b3); b3.connect(b4); b4.connect(output);
  return { input, output, b1, b2, b3, b4 };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'b1Freq': r(nodes.b1.frequency, value); break;
    case 'b1Gain': r(nodes.b1.gain, value); break;
    case 'b1Q': r(nodes.b1.Q, value); break;
    case 'b2Freq': r(nodes.b2.frequency, value); break;
    case 'b2Gain': r(nodes.b2.gain, value); break;
    case 'b2Q': r(nodes.b2.Q, value); break;
    case 'b3Freq': r(nodes.b3.frequency, value); break;
    case 'b3Gain': r(nodes.b3.gain, value); break;
    case 'b3Q': r(nodes.b3.Q, value); break;
    case 'b4Freq': r(nodes.b4.frequency, value); break;
    case 'b4Gain': r(nodes.b4.gain, value); break;
    case 'b4Q': r(nodes.b4.Q, value); break;
  }
}

export const presets = {
  'Default': {
    b1Freq: 80, b1Gain: 0, b1Q: 1,
    b2Freq: 500, b2Gain: 0, b2Q: 1,
    b3Freq: 3000, b3Gain: 0, b3Q: 1,
    b4Freq: 10000, b4Gain: 0, b4Q: 1
  },
  'Vocal Warm': {
    b1Freq: 120, b1Gain: 2, b1Q: 0.8,
    b2Freq: 400, b2Gain: 1, b2Q: 1.2,
    b3Freq: 4000, b3Gain: -1, b3Q: 1.5,
    b4Freq: 12000, b4Gain: 2, b4Q: 1
  },
  'Radio Ready': {
    b1Freq: 100, b1Gain: -2, b1Q: 0.7,
    b2Freq: 300, b2Gain: -1, b2Q: 1,
    b3Freq: 4000, b3Gain: 3, b3Q: 1.2,
    b4Freq: 12000, b4Gain: 4, b4Q: 1
  },
  'Bass Cut': {
    b1Freq: 150, b1Gain: -4, b1Q: 0.9,
    b2Freq: 400, b2Gain: -1, b2Q: 1,
    b3Freq: 3000, b3Gain: 0, b3Q: 1,
    b4Freq: 10000, b4Gain: 0, b4Q: 1
  },
  'Treble Boost': {
    b1Freq: 80, b1Gain: 0, b1Q: 1,
    b2Freq: 500, b2Gain: 0, b2Q: 1,
    b3Freq: 5000, b3Gain: 2, b3Q: 1.2,
    b4Freq: 14000, b4Gain: 4, b4Q: 1
  },
  'Mid Scoop': {
    b1Freq: 100, b1Gain: 3, b1Q: 0.8,
    b2Freq: 600, b2Gain: -3, b2Q: 2,
    b3Freq: 4000, b3Gain: 2, b3Q: 1.2,
    b4Freq: 12000, b4Gain: 2, b4Q: 1
  },
  'LP Smile': {
    b1Freq: 120, b1Gain: 4, b1Q: 0.7,
    b2Freq: 800, b2Gain: -2, b2Q: 1.5,
    b3Freq: 5000, b3Gain: -2, b3Q: 1.5,
    b4Freq: 15000, b4Gain: 4, b4Q: 1
  },
  'Tape Saturation EQ': {
    b1Freq: 60, b1Gain: -1, b1Q: 0.9,
    b2Freq: 400, b2Gain: -2, b2Q: 1,
    b3Freq: 3000, b3Gain: 1, b3Q: 1.2,
    b4Freq: 12000, b4Gain: 2, b4Q: 1
  }
};
