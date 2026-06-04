// js/modules/reverb.js
// MEJORADO: IR con decaimiento dependiente de frecuencia (absorción aérea real).
// El IR anterior usaba ruido blanco con decaimiento uniforme → sonido metálico.
// Ahora las altas frecuencias decaen más rápido que las bajas, como en salas reales.
// Parámetro nuevo: DAMPING (control de absorción HF).

import { buildKnob } from '../ui/knobs.js';

export const label = 'REVERB';
export const color = '#aa66ff';

export const params = {
  size:     { label:'SIZE',    min:0.1, max:6,   def:1.5, step:0.05, unit:'s'  },
  decay:    { label:'DECAY',   min:0.5, max:8,   def:2,   step:0.1,  unit:'x'  },
  damping:  { label:'DAMP',    min:0,   max:100, def:50,  step:1,    unit:'%'  },
  predelay: { label:'PRE-DLY', min:0,   max:100, def:20,  step:1,    unit:'ms' },
  mix:      { label:'MIX',     min:0,   max:100, def:30,  step:1,    unit:'%'  }
};

// IR mejorado: decaimiento HF más rápido que LF (absorción aérea)
function buildImprovedIR(ctx, size, decay, damping) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * Math.max(0.1, size)));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const hfMult = 1 + (damping / 100) * 4;  // más damping = HF decae más rápido

  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // LF: decaimiento lento (body de la sala)
      const lfEnv = Math.exp(-t * decay * 0.8);
      // HF: decaimiento más rápido (absorción aérea + materiales)
      const hfEnv = Math.exp(-t * decay * hfMult);
      // Ruido decorrelado entre canales (ligero offset de fase para naturalidad)
      const noiseA = Math.random() * 2 - 1;
      const noiseB = Math.random() * 2 - 1;
      // Mezcla ponderada: cuerpo LF + brillo HF atenuado
      d[i] = (noiseA * lfEnv * 0.65 + noiseB * hfEnv * 0.35);
      // Variación estéreo sutil por canal (decorrelación)
      if (c === 1) d[i] *= (1 + (Math.random() - 0.5) * 0.04);
    }
    // Fade-in corto para evitar click al inicio
    const fadeIn = Math.min(128, len >> 4);
    for (let i = 0; i < fadeIn; i++) d[i] *= i / fadeIn;
    // Normalizar
    let peak = 0;
    for (let i = 0; i < len; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; }
    if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak * 1.2;
  }
  return buf;
}

export function buildNodes(ctx, p) {
  const input  = ctx.createGain();
  const output = ctx.createGain();
  const dry    = ctx.createGain();
  const wet    = ctx.createGain();
  const preDly = ctx.createDelay(0.15);
  const conv   = ctx.createConvolver();
  dry.gain.value   = 1 - p.mix / 100;
  wet.gain.value   = p.mix / 100;
  preDly.delayTime.value = p.predelay / 1000;
  conv.buffer = buildImprovedIR(ctx, p.size, p.decay, p.damping);
  input.connect(dry);
  input.connect(preDly);
  preDly.connect(conv);
  conv.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, preDly, conv };
}

export function updateParam(nodes, key, value, currentTime, allParams) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'size':
    case 'decay':
    case 'damping': {
      const ctx  = window.audioCtx;
      if (!ctx) break;
      const size    = key === 'size'    ? value : allParams.size;
      const decay   = key === 'decay'   ? value : allParams.decay;
      const damping = key === 'damping' ? value : allParams.damping;
      nodes.conv.buffer = buildImprovedIR(ctx, size, decay, damping);
      break;
    }
    case 'predelay': r(nodes.preDly.delayTime, value / 1000); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':     { size:1.5, decay:2,   damping:50, predelay:20, mix:30 },
  'Small Room':  { size:0.6, decay:1.0, damping:70, predelay:8,  mix:22 },
  'Medium Room': { size:1.2, decay:1.8, damping:55, predelay:15, mix:28 },
  'Large Hall':  { size:3.5, decay:4,   damping:35, predelay:30, mix:35 },
  'Cathedral':   { size:6,   decay:6,   damping:20, predelay:40, mix:40 },
  'Bright Plate':{ size:1.2, decay:1.8, damping:20, predelay:12, mix:30 },
  'Dark Cave':   { size:2.5, decay:3.5, damping:85, predelay:25, mix:35 },
  'Ambience':    { size:0.4, decay:0.8, damping:65, predelay:5,  mix:18 }
};

// ----------------------------------------------------------------
// UI: visualización de cola de reverb + knobs
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def   = window.MODULE_DEFS['reverb'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  const canvas = document.createElement('canvas');
  canvas.width = 260; canvas.height = 55;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:12px; justify-content:center; flex-wrap:wrap;';
  ['size','decay','damping','predelay','mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  function animate() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H); ctx.fillStyle='#0a0a0e'; ctx.fillRect(0,0,W,H);
    const size=mod.params.size, decay=mod.params.decay, damping=mod.params.damping/100;
    const predelay=mod.params.predelay, mixVal=mod.params.mix;
    const margin=10, pW=W-margin*2, pX=margin, pY=5, pH=H-10;
    const totalBars=50, barW=(pW/totalBars)*0.65, gap=pW/totalBars;
    const prePx=Math.min(pW*0.25,(predelay/100)*pW);
    const hfMult=1+(damping)*4;
    for(let i=0;i<totalBars;i++){
      const x=pX+prePx+i*gap; if(x>pX+pW) break;
      const t=i/totalBars;
      const lfEnv=Math.exp(-t*decay*0.8);
      const hfEnv=Math.exp(-t*decay*hfMult);
      const env=(lfEnv*0.65+hfEnv*0.35)*size*0.8;
      const barH=Math.max(0,Math.min(pH*0.9,pH*env));
      const alpha=0.2+mixVal/100*0.55;
      ctx.fillStyle=`rgba(170,102,255,${alpha*(1-t*0.7)})`;
      ctx.fillRect(x,pY+pH-barH,barW,barH);
    }
    requestAnimationFrame(animate);
  }
  animate();
  return container;
}
