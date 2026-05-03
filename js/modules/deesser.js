// js/modules/deesser.js
export const label = 'DE-ESSER';
export const color = '#cc44ff';

export const params = {
  freq: { label:'FREQ', min:1000, max:12000, def:5000, step:50, unit:'Hz' },
  bandwidth: { label:'BW (Q)', min:0.1, max:15, def:2, step:0.1, unit:'' },
  depth: { label:'DEPTH', min:-30, max:0, def:-8, step:0.5, unit:'dB' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const notch = ctx.createBiquadFilter();
  notch.type = 'peaking';
  notch.frequency.value = params.freq;
  notch.Q.value = params.bandwidth;
  notch.gain.value = params.depth;
  input.connect(notch);
  notch.connect(output);
  return { input, output, notch };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'freq': r(nodes.notch.frequency, value); break;
    case 'bandwidth': r(nodes.notch.Q, value); break;
    case 'depth': r(nodes.notch.gain, value); break;
  }
}

export const presets = {
  'Default': { freq: 5000, bandwidth: 2, depth: -8 },
  'Female Voice': { freq: 7000, bandwidth: 1.8, depth: -10 },
  'Male Voice': { freq: 4500, bandwidth: 2.2, depth: -6 },
  'Aggressive': { freq: 6000, bandwidth: 1.5, depth: -12 },
  'Subtle': { freq: 5500, bandwidth: 2.5, depth: -4 },
  'Sibilance Control': { freq: 8000, bandwidth: 1.2, depth: -15 },
  'Dull De-ess': { freq: 4000, bandwidth: 3, depth: -5 }
};
