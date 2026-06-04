// js/modules/multiband.js
// MEJORADO: crossover LR4 (Linkwitz-Riley 4° orden = 2 Butterworth en cascada).
// El crossover anterior (LR2, Q=0.5) producía un pequeño pico en las frecuencias
// de cruce al sumar las bandas. LR4 suma perfectamente a magnitud plana.

import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'MULTIBAND COMP.';
export const color = '#aa88ff';

export const params = {
  lowMidFreq:    { label:'LOW→MID',   min:50,  max:1000, def:200,  step:5,   unit:'Hz' },
  midHighFreq:   { label:'MID→HIGH',  min:500, max:8000, def:2000, step:10,  unit:'Hz' },
  lowThreshold:  { label:'L. THRESH', min:-60, max:0,    def:-12,  step:0.5, unit:'dB' },
  lowRatio:      { label:'L. RATIO',  min:1,   max:20,   def:2,    step:0.1, unit:':1' },
  lowAttack:     { label:'L. ATTACK', min:1,   max:500,  def:10,   step:1,   unit:'ms' },
  lowRelease:    { label:'L. RELEASE',min:10,  max:1000, def:150,  step:5,   unit:'ms' },
  lowMakeup:     { label:'L. MAKEUP', min:-6,  max:24,   def:0,    step:0.5, unit:'dB' },
  midThreshold:  { label:'M. THRESH', min:-60, max:0,    def:-18,  step:0.5, unit:'dB' },
  midRatio:      { label:'M. RATIO',  min:1,   max:20,   def:3,    step:0.1, unit:':1' },
  midAttack:     { label:'M. ATTACK', min:1,   max:500,  def:20,   step:1,   unit:'ms' },
  midRelease:    { label:'M. RELEASE',min:10,  max:1000, def:100,  step:5,   unit:'ms' },
  midMakeup:     { label:'M. MAKEUP', min:-6,  max:24,   def:0,    step:0.5, unit:'dB' },
  highThreshold: { label:'H. THRESH', min:-60, max:0,    def:-24,  step:0.5, unit:'dB' },
  highRatio:     { label:'H. RATIO',  min:1,   max:20,   def:2,    step:0.1, unit:':1' },
  highAttack:    { label:'H. ATTACK', min:1,   max:500,  def:5,    step:1,   unit:'ms' },
  highRelease:   { label:'H. RELEASE',min:10,  max:1000, def:80,   step:5,   unit:'ms' },
  highMakeup:    { label:'H. MAKEUP', min:-6,  max:24,   def:0,    step:0.5, unit:'dB' },
  outputGain:    { label:'OUTPUT',    min:-12, max:12,   def:0,    step:0.5, unit:'dB' }
};

export const bands = [
  { name:'LOW',  keys:['lowThreshold','lowRatio','lowAttack','lowRelease','lowMakeup'] },
  { name:'MID',  keys:['midThreshold','midRatio','midAttack','midRelease','midMakeup'] },
  { name:'HIGH', keys:['highThreshold','highRatio','highAttack','highRelease','highMakeup'] }
];
export const generalParams = ['lowMidFreq','midHighFreq','outputGain'];

// CORREGIDO: LR4 = dos Butterworth Q=0.707 en cascada → suma plana en magnitud
function createLR4LP(ctx, freq) {
  const a = ctx.createBiquadFilter(), b = ctx.createBiquadFilter();
  [a, b].forEach(f => { f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = 0.707; });
  a.connect(b);
  return { input: a, output: b, f1: a, f2: b };
}
function createLR4HP(ctx, freq) {
  const a = ctx.createBiquadFilter(), b = ctx.createBiquadFilter();
  [a, b].forEach(f => { f.type = 'highpass'; f.frequency.value = freq; f.Q.value = 0.707; });
  a.connect(b);
  return { input: a, output: b, f1: a, f2: b };
}

export function buildNodes(ctx, p) {
  const input  = ctx.createGain();
  const output = ctx.createGain();

  // Crossover LR4
  const lowLP  = createLR4LP(ctx, p.lowMidFreq);
  const midHP  = createLR4HP(ctx, p.lowMidFreq);
  const midLP  = createLR4LP(ctx, p.midHighFreq);
  const highHP = createLR4HP(ctx, p.midHighFreq);

  input.connect(lowLP.input);
  input.connect(midHP.input);
  input.connect(highHP.input);
  midHP.output.connect(midLP.input);

  // Compresores por banda
  function makeComp(thresh, ratio, atk, rel) {
    const c = ctx.createDynamicsCompressor();
    c.threshold.value = thresh; c.ratio.value = ratio;
    c.knee.value = 6; c.attack.value = atk / 1000; c.release.value = rel / 1000;
    return c;
  }
  const compLow  = makeComp(p.lowThreshold,  p.lowRatio,  p.lowAttack,  p.lowRelease);
  const compMid  = makeComp(p.midThreshold,  p.midRatio,  p.midAttack,  p.midRelease);
  const compHigh = makeComp(p.highThreshold, p.highRatio, p.highAttack, p.highRelease);

  lowLP.output.connect(compLow);
  midLP.output.connect(compMid);
  highHP.output.connect(compHigh);

  const lowMakeup  = ctx.createGain(); lowMakeup.gain.value  = dbToGain(p.lowMakeup);
  const midMakeup  = ctx.createGain(); midMakeup.gain.value  = dbToGain(p.midMakeup);
  const highMakeup = ctx.createGain(); highMakeup.gain.value = dbToGain(p.highMakeup);
  compLow.connect(lowMakeup); compMid.connect(midMakeup); compHigh.connect(highMakeup);

  const summer  = ctx.createGain();
  lowMakeup.connect(summer); midMakeup.connect(summer); highMakeup.connect(summer);
  const outGain = ctx.createGain(); outGain.gain.value = dbToGain(p.outputGain);
  summer.connect(outGain); outGain.connect(output);

  return { input, output,
    lowLP, midHP, midLP, highHP,
    compLow, compMid, compHigh,
    lowMakeup, midMakeup, highMakeup,
    summer, outGain };
}

function setLR4Freq(filter, freq, currentTime) {
  const r = (f, v) => f.frequency.setTargetAtTime(v, currentTime, 0.008);
  r(filter.f1, freq); r(filter.f2, freq);
}

export function updateParam(nodes, key, value, currentTime, p) {
  const r = (n, v) => n.setTargetAtTime(v, currentTime, 0.008);
  if      (key === 'lowMidFreq')   { setLR4Freq(nodes.lowLP, value, currentTime); setLR4Freq(nodes.midHP, value, currentTime); }
  else if (key === 'midHighFreq')  { setLR4Freq(nodes.midLP, value, currentTime); setLR4Freq(nodes.highHP, value, currentTime); }
  else if (key === 'lowThreshold') r(nodes.compLow.threshold,  value);
  else if (key === 'lowRatio')     r(nodes.compLow.ratio,      value);
  else if (key === 'lowAttack')    r(nodes.compLow.attack,     value/1000);
  else if (key === 'lowRelease')   r(nodes.compLow.release,    value/1000);
  else if (key === 'lowMakeup')    r(nodes.lowMakeup.gain,     dbToGain(value));
  else if (key === 'midThreshold') r(nodes.compMid.threshold,  value);
  else if (key === 'midRatio')     r(nodes.compMid.ratio,      value);
  else if (key === 'midAttack')    r(nodes.compMid.attack,     value/1000);
  else if (key === 'midRelease')   r(nodes.compMid.release,    value/1000);
  else if (key === 'midMakeup')    r(nodes.midMakeup.gain,     dbToGain(value));
  else if (key === 'highThreshold')r(nodes.compHigh.threshold, value);
  else if (key === 'highRatio')    r(nodes.compHigh.ratio,     value);
  else if (key === 'highAttack')   r(nodes.compHigh.attack,    value/1000);
  else if (key === 'highRelease')  r(nodes.compHigh.release,   value/1000);
  else if (key === 'highMakeup')   r(nodes.highMakeup.gain,    dbToGain(value));
  else if (key === 'outputGain')   r(nodes.outGain.gain,       dbToGain(value));
}

export const presets = {
  'Default':      { lowMidFreq:200,  midHighFreq:2000, lowThreshold:-12, lowRatio:2,   lowAttack:10, lowRelease:150, lowMakeup:0, midThreshold:-18, midRatio:3,   midAttack:20, midRelease:100, midMakeup:0, highThreshold:-24, highRatio:2,   highAttack:5,  highRelease:80,  highMakeup:0, outputGain:0 },
  'Gentle Glue':  { lowMidFreq:150,  midHighFreq:3000, lowThreshold:-10, lowRatio:1.5, lowAttack:30, lowRelease:200, lowMakeup:0, midThreshold:-15, midRatio:2,   midAttack:40, midRelease:150, midMakeup:0, highThreshold:-20, highRatio:1.8, highAttack:20, highRelease:120, highMakeup:0, outputGain:1 },
  'Drum Smash':   { lowMidFreq:120,  midHighFreq:2500, lowThreshold:-8,  lowRatio:4,   lowAttack:5,  lowRelease:80,  lowMakeup:3, midThreshold:-12, midRatio:3,   midAttack:10, midRelease:60,  midMakeup:2, highThreshold:-15, highRatio:2.5, highAttack:8,  highRelease:50,  highMakeup:1, outputGain:2 },
  'Master Bus':   { lowMidFreq:180,  midHighFreq:4000, lowThreshold:-6,  lowRatio:1.8, lowAttack:50, lowRelease:300, lowMakeup:0.5,midThreshold:-10, midRatio:1.5, midAttack:60, midRelease:250, midMakeup:0.5,highThreshold:-12, highRatio:1.5, highAttack:40, highRelease:200, highMakeup:0.5,outputGain:1 },
  'Bass Control': { lowMidFreq:100,  midHighFreq:2000, lowThreshold:-8,  lowRatio:5,   lowAttack:15, lowRelease:200, lowMakeup:2, midThreshold:-24, midRatio:2,   midAttack:30, midRelease:150, midMakeup:0, highThreshold:-30, highRatio:1.5, highAttack:20, highRelease:100, highMakeup:0, outputGain:0 }
};

// ----------------------------------------------------------------
// UI: medidores GR por banda + knobs (heredada del original)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def   = window.MODULE_DEFS['multiband'];
  const color = def.color;
  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  const crossoverRow = document.createElement('div');
  crossoverRow.style.cssText = 'display:flex; gap:16px; justify-content:center; margin-bottom:4px;';
  ['lowMidFreq','midHighFreq','outputGain'].forEach(key => {
    crossoverRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(crossoverRow);

  const columnsRow = document.createElement('div');
  columnsRow.style.cssText = 'display:flex; gap:16px; justify-content:center; flex-wrap:wrap;';

  const bandMeta = [
    { name:'LOW',  color:'#ff6633', prefix:'low',  nodeKey:'compLow'  },
    { name:'MID',  color:'#ffaa00', prefix:'mid',  nodeKey:'compMid'  },
    { name:'HIGH', color:'#4488ff', prefix:'high', nodeKey:'compHigh' }
  ];

  bandMeta.forEach(meta => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:6px; background:var(--surf2); padding:8px; border-radius:6px; border:1px solid var(--brd);';
    const lbl = document.createElement('div');
    lbl.textContent = meta.name;
    lbl.style.cssText = 'font-family:"Share Tech Mono",monospace; font-size:10px; color:#fff; font-weight:bold;';
    const meterWrap = document.createElement('div');
    meterWrap.style.cssText = 'display:flex; align-items:flex-end; gap:2px;';
    const meter = document.createElement('div');
    meter.style.cssText = 'width:20px; height:60px; background:#0a0a0e; border-radius:3px; border:1px solid #2a2a35; position:relative; overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText = `position:absolute; bottom:0; left:0; right:0; background:${meta.color}; transition:height .08s linear;`;
    meter.appendChild(fill);
    meterWrap.appendChild(meter);
    const knobsRow = document.createElement('div');
    knobsRow.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap; justify-content:center;';
    const keys = { low:['lowThreshold','lowRatio','lowAttack','lowRelease','lowMakeup'],
                   mid:['midThreshold','midRatio','midAttack','midRelease','midMakeup'],
                   high:['highThreshold','highRatio','highAttack','highRelease','highMakeup'] };
    keys[meta.prefix].forEach(key => knobsRow.appendChild(buildKnob(mod, key, def.params[key], color)));
    col.appendChild(lbl); col.appendChild(meterWrap); col.appendChild(knobsRow);
    columnsRow.appendChild(col);
    if (meta.nodeKey === 'compLow')  mod._grLowFill  = fill;
    if (meta.nodeKey === 'compMid')  mod._grMidFill  = fill;
    if (meta.nodeKey === 'compHigh') mod._grHighFill = fill;
  });
  container.appendChild(columnsRow);

  function updateGR() {
    if (!mod.nodes?.compLow) { requestAnimationFrame(updateGR); return; }
    const toP = r => Math.min(1, Math.abs(r) / 40) * 100;
    if (mod._grLowFill)  mod._grLowFill.style.height  = toP(mod.nodes.compLow.reduction)  + '%';
    if (mod._grMidFill)  mod._grMidFill.style.height  = toP(mod.nodes.compMid.reduction)  + '%';
    if (mod._grHighFill) mod._grHighFill.style.height = toP(mod.nodes.compHigh.reduction) + '%';
    requestAnimationFrame(updateGR);
  }
  updateGR();
  return container;
}
