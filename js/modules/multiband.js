// js/modules/multiband.js
import { dbToGain } from '../utils.js';

export const label = 'MULTIBAND COMP.';
export const color = '#aa88ff';

export const params = {
  lowMidFreq: { label:'LOW→MID', min:50, max:1000, def:200, step:5, unit:'Hz' },
  midHighFreq: { label:'MID→HIGH', min:500, max:8000, def:2000, step:10, unit:'Hz' },
  lowThreshold: { label:'L. THRESH', min:-60, max:0, def:-12, step:0.5, unit:'dB' },
  lowRatio: { label:'L. RATIO', min:1, max:20, def:2, step:0.1, unit:':1' },
  lowAttack: { label:'L. ATTACK', min:1, max:500, def:10, step:1, unit:'ms' },
  lowRelease: { label:'L. RELEASE', min:10, max:1000, def:150, step:5, unit:'ms' },
  lowMakeup: { label:'L. MAKEUP', min:-6, max:24, def:0, step:0.5, unit:'dB' },
  midThreshold: { label:'M. THRESH', min:-60, max:0, def:-18, step:0.5, unit:'dB' },
  midRatio: { label:'M. RATIO', min:1, max:20, def:3, step:0.1, unit:':1' },
  midAttack: { label:'M. ATTACK', min:1, max:500, def:20, step:1, unit:'ms' },
  midRelease: { label:'M. RELEASE', min:10, max:1000, def:100, step:5, unit:'ms' },
  midMakeup: { label:'M. MAKEUP', min:-6, max:24, def:0, step:0.5, unit:'dB' },
  highThreshold: { label:'H. THRESH', min:-60, max:0, def:-24, step:0.5, unit:'dB' },
  highRatio: { label:'H. RATIO', min:1, max:20, def:2, step:0.1, unit:':1' },
  highAttack: { label:'H. ATTACK', min:1, max:500, def:5, step:1, unit:'ms' },
  highRelease: { label:'H. RELEASE', min:10, max:1000, def:80, step:5, unit:'ms' },
  highMakeup: { label:'H. MAKEUP', min:-6, max:24, def:0, step:0.5, unit:'dB' },
  outputGain: { label:'OUTPUT', min:-12, max:12, def:0, step:0.5, unit:'dB' }
};

export const bands = [
  {
    name: 'LOW',
    keys: ['lowThreshold', 'lowRatio', 'lowAttack', 'lowRelease', 'lowMakeup']
  },
  {
    name: 'MID',
    keys: ['midThreshold', 'midRatio', 'midAttack', 'midRelease', 'midMakeup']
  },
  {
    name: 'HIGH',
    keys: ['highThreshold', 'highRatio', 'highAttack', 'highRelease', 'highMakeup']
  }
];

export const generalParams = ['lowMidFreq', 'midHighFreq', 'outputGain'];

// ------------------------------------------------------------
// Filtros Linkwitz‑Riley de 2º orden (Q=0.5)
// ------------------------------------------------------------
function createLR2Lowpass(ctx, freq) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = freq;
  lp.Q.value = 0.5;
  return lp;
}

function createLR2Highpass(ctx, freq) {
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = freq;
  hp.Q.value = 0.5;
  return hp;
}

// ------------------------------------------------------------
// Construcción del grafo de audio
// ------------------------------------------------------------
export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Crossover Linkwitz-Riley de 3 vías
  // Bajos: lowpass @ lowMidFreq
  const lowLP = createLR2Lowpass(ctx, params.lowMidFreq);

  // Medios: highpass @ lowMidFreq → lowpass @ midHighFreq
  const midHP = createLR2Highpass(ctx, params.lowMidFreq);
  const midLP = createLR2Lowpass(ctx, params.midHighFreq);

  // Agudos: highpass @ midHighFreq
  const highHP = createLR2Highpass(ctx, params.midHighFreq);

  // Conectamos la entrada a los tres caminos
  input.connect(lowLP);               // Bajos
  input.connect(midHP);               // Medios (primera etapa)
  input.connect(highHP);              // Agudos

  midHP.connect(midLP);               // Medios (segunda etapa)

  // Compresores
  const compLow = ctx.createDynamicsCompressor();
  const compMid = ctx.createDynamicsCompressor();
  const compHigh = ctx.createDynamicsCompressor();

  compLow.threshold.value = params.lowThreshold;
  compLow.ratio.value = params.lowRatio;
  compLow.knee.value = 6;
  compLow.attack.value = params.lowAttack / 1000;
  compLow.release.value = params.lowRelease / 1000;

  compMid.threshold.value = params.midThreshold;
  compMid.ratio.value = params.midRatio;
  compMid.knee.value = 6;
  compMid.attack.value = params.midAttack / 1000;
  compMid.release.value = params.midRelease / 1000;

  compHigh.threshold.value = params.highThreshold;
  compHigh.ratio.value = params.highRatio;
  compHigh.knee.value = 6;
  compHigh.attack.value = params.highAttack / 1000;
  compHigh.release.value = params.highRelease / 1000;

  lowLP.connect(compLow);
  midLP.connect(compMid);
  highHP.connect(compHigh);

  // Makeup gains
  const lowMakeup = ctx.createGain();
  const midMakeup = ctx.createGain();
  const highMakeup = ctx.createGain();
  lowMakeup.gain.value = dbToGain(params.lowMakeup);
  midMakeup.gain.value = dbToGain(params.midMakeup);
  highMakeup.gain.value = dbToGain(params.highMakeup);

  compLow.connect(lowMakeup);
  compMid.connect(midMakeup);
  compHigh.connect(highMakeup);

  // Suma de las tres bandas
  const summer = ctx.createGain();
  lowMakeup.connect(summer);
  midMakeup.connect(summer);
  highMakeup.connect(summer);

  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(params.outputGain);
  summer.connect(outGain);
  outGain.connect(output);

  return {
    input, output,
    lowLP, midHP, midLP, highHP,
    compLow, compMid, compHigh,
    lowMakeup, midMakeup, highMakeup,
    summer, outGain
  };
}

// ------------------------------------------------------------
// Actualización de parámetros
// ------------------------------------------------------------
export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);

  if (key === 'lowMidFreq') {
    r(nodes.lowLP.frequency, value);
    r(nodes.midHP.frequency, value);
  }
  else if (key === 'midHighFreq') {
    r(nodes.midLP.frequency, value);
    r(nodes.highHP.frequency, value);
  }
  else if (key === 'lowThreshold') r(nodes.compLow.threshold, value);
  else if (key === 'lowRatio') r(nodes.compLow.ratio, value);
  else if (key === 'lowAttack') r(nodes.compLow.attack, value / 1000);
  else if (key === 'lowRelease') r(nodes.compLow.release, value / 1000);
  else if (key === 'lowMakeup') r(nodes.lowMakeup.gain, dbToGain(value));
  else if (key === 'midThreshold') r(nodes.compMid.threshold, value);
  else if (key === 'midRatio') r(nodes.compMid.ratio, value);
  else if (key === 'midAttack') r(nodes.compMid.attack, value / 1000);
  else if (key === 'midRelease') r(nodes.compMid.release, value / 1000);
  else if (key === 'midMakeup') r(nodes.midMakeup.gain, dbToGain(value));
  else if (key === 'highThreshold') r(nodes.compHigh.threshold, value);
  else if (key === 'highRatio') r(nodes.compHigh.ratio, value);
  else if (key === 'highAttack') r(nodes.compHigh.attack, value / 1000);
  else if (key === 'highRelease') r(nodes.compHigh.release, value / 1000);
  else if (key === 'highMakeup') r(nodes.highMakeup.gain, dbToGain(value));
  else if (key === 'outputGain') r(nodes.outGain.gain, dbToGain(value));
}

// Los presets se mantienen exactamente igual (no dependen del crossover)
export const presets = {
  'Default': {
    lowMidFreq: 200, midHighFreq: 2000,
    lowThreshold: -12, lowRatio: 2, lowAttack: 10, lowRelease: 150, lowMakeup: 0,
    midThreshold: -18, midRatio: 3, midAttack: 20, midRelease: 100, midMakeup: 0,
    highThreshold: -24, highRatio: 2, highAttack: 5, highRelease: 80, highMakeup: 0,
    outputGain: 0
  },
  'Gentle Glue': {
    lowMidFreq: 150, midHighFreq: 3000,
    lowThreshold: -10, lowRatio: 1.5, lowAttack: 30, lowRelease: 200, lowMakeup: 0,
    midThreshold: -15, midRatio: 2, midAttack: 40, midRelease: 150, midMakeup: 0,
    highThreshold: -20, highRatio: 1.8, highAttack: 20, highRelease: 120, highMakeup: 0,
    outputGain: 1
  },
  'Drum Smash': {
    lowMidFreq: 120, midHighFreq: 2500,
    lowThreshold: -8, lowRatio: 4, lowAttack: 5, lowRelease: 80, lowMakeup: 3,
    midThreshold: -12, midRatio: 3, midAttack: 10, midRelease: 60, midMakeup: 2,
    highThreshold: -15, highRatio: 2.5, highAttack: 8, highRelease: 50, highMakeup: 1,
    outputGain: 2
  },
  'Master Bus': {
    lowMidFreq: 180, midHighFreq: 4000,
    lowThreshold: -6, lowRatio: 1.8, lowAttack: 50, lowRelease: 300, lowMakeup: 0.5,
    midThreshold: -10, midRatio: 1.5, midAttack: 60, midRelease: 250, midMakeup: 0.5,
    highThreshold: -12, highRatio: 1.5, highAttack: 40, highRelease: 200, highMakeup: 0.5,
    outputGain: 1
  },
  'Vocal Polish': {
    lowMidFreq: 250, midHighFreq: 5000,
    lowThreshold: -20, lowRatio: 2, lowAttack: 20, lowRelease: 150, lowMakeup: 0,
    midThreshold: -15, midRatio: 2.5, midAttack: 15, midRelease: 100, midMakeup: 1,
    highThreshold: -18, highRatio: 3, highAttack: 10, highRelease: 80, highMakeup: 2,
    outputGain: 0
  },
  'Bass Control': {
    lowMidFreq: 100, midHighFreq: 2000,
    lowThreshold: -8, lowRatio: 5, lowAttack: 15, lowRelease: 200, lowMakeup: 2,
    midThreshold: -24, midRatio: 2, midAttack: 30, midRelease: 150, midMakeup: 0,
    highThreshold: -30, highRatio: 1.5, highAttack: 20, highRelease: 100, highMakeup: 0,
    outputGain: 0
  }
};
