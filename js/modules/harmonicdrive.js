// js/modules/harmonicdrive.js
// NUEVO: fusión de saturator.js + softclipper.js
// Mode 0=Soft  (tanh normalizado — suave, preserva dinámica)
// Mode 1=Tape  (tanh asimétrico + tono shelf — calidez de cinta)
// Mode 2=Hard  (clipper duro con suavizado cúbico — agresivo)
// Todos los modos: oversample '4x' (anti-aliasing)

import { dbToGain } from '../utils.js';
import { buildKnob } from '../ui/knobs.js';

export const label = 'HARMONIC DRIVE';
export const color = '#ff6633';

const MODE_LABELS = ['SOFT', 'TAPE', 'HARD'];

export const params = {
  mode:   { label:'MODE',   min:0, max:2,  def:0,  step:1,   unit:''   },
  drive:  { label:'DRIVE',  min:1, max:100, def:5,  step:0.5, unit:'x'  },
  tone:   { label:'TONE',   min:-10, max:10, def:0,  step:0.5, unit:'dB' },
  mix:    { label:'MIX',    min:0, max:100, def:60, step:1,   unit:'%'  },
  output: { label:'OUTPUT', min:-18, max:6,  def:0,  step:0.5, unit:'dB' }
};

function buildCurve(drive, mode) {
  const n = 2048;
  const curve = new Float32Array(n);
  const d = Math.max(0.5, drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    let y;
    switch (Math.round(mode)) {
      case 0: // Soft: tanh normalizado (incluso a drive alto sigue siendo suave)
        y = Math.tanh(x * d) / (Math.tanh(d) || 1);
        break;
      case 1: // Tape: asimétrico — armónicos pares (cálido, tipo tubo/cinta)
        const bias = 0.05 * Math.min(d, 20) / 20;
        y = Math.tanh((x + bias) * d) / (Math.tanh(d) || 1);
        break;
      case 2: // Hard: recorte duro con suavizado cúbico en la rodilla
        const k = Math.min(d * 0.08, 4);
        y = x * k;
        if (y > 1)       y = 1;
        else if (y < -1) y = -1;
        else             y = y * (1 - Math.abs(y) * 0.12); // rodilla suave
        break;
      default:
        y = x;
    }
    curve[i] = Math.max(-1, Math.min(1, y));
  }
  return curve;
}

export function buildNodes(ctx, p) {
  const input   = ctx.createGain();
  const output  = ctx.createGain();
  const dry     = ctx.createGain();
  const wet     = ctx.createGain();
  const shaper  = ctx.createWaveShaper();
  shaper.oversample = '4x';
  shaper.curve  = buildCurve(p.drive, p.mode);
  const toneF   = ctx.createBiquadFilter();
  toneF.type    = 'highshelf';
  toneF.frequency.value = 3000;
  toneF.gain.value = p.tone;
  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(p.output);
  dry.gain.value = 1 - p.mix / 100;
  wet.gain.value = p.mix / 100;
  input.connect(dry);
  input.connect(shaper);
  shaper.connect(toneF);
  toneF.connect(wet);
  dry.connect(outGain);
  wet.connect(outGain);
  outGain.connect(output);
  return { input, output, dry, wet, shaper, toneF, outGain };
}

export function updateParam(nodes, key, value, currentTime, allParams) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'mode':
    case 'drive':
      nodes.shaper.curve = buildCurve(
        allParams ? allParams.drive : 5,
        allParams ? allParams.mode  : 0
      );
      break;
    case 'tone':   r(nodes.toneF.gain, value); break;
    case 'mix':    r(nodes.wet.gain, value/100); r(nodes.dry.gain, 1-value/100); break;
    case 'output': r(nodes.outGain.gain, dbToGain(value)); break;
  }
}

export const presets = {
  // Soft
  'Default':          { mode:0, drive:5,  tone:0,  mix:60, output:0 },
  'Subtle Soft':      { mode:0, drive:3,  tone:0,  mix:40, output:0 },
  'Soft Clip':        { mode:0, drive:12, tone:0,  mix:80, output:0 },
  // Tape
  'Tube Warmth':      { mode:1, drive:15, tone:2,  mix:60, output:1 },
  'Tape Saturation':  { mode:1, drive:8,  tone:1,  mix:70, output:0 },
  'Creamy':           { mode:1, drive:12, tone:-2, mix:65, output:1 },
  // Hard
  'Amp Drive':        { mode:2, drive:25, tone:3,  mix:80, output:2 },
  'Aggressive':       { mode:2, drive:50, tone:5,  mix:90, output:3 },
  'Pumping':          { mode:2, drive:8,  tone:0,  mix:100,output:3 }
};

// ----------------------------------------------------------------
// UI: selector de modo + curva de transferencia + knobs
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def   = window.MODULE_DEFS['harmonicdrive'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Selector de modo
  const modeRow = document.createElement('div');
  modeRow.style.cssText = 'display:flex; gap:6px;';
  const modeBtns = MODE_LABELS.map((lbl, i) => {
    const btn = document.createElement('button');
    btn.textContent = lbl;
    const active = Math.round(mod.params.mode) === i;
    btn.style.cssText = `padding:4px 10px; font-size:11px; font-family:var(--fnt-ui); font-weight:700;
      border-radius:4px; cursor:pointer; border:1px solid var(--brd2);
      background:${active ? color : 'var(--surf2)'}; color:${active ? '#000' : 'var(--tx2)'};
      transition:all .15s;`;
    btn.addEventListener('click', () => {
      if (window.applyParam) window.applyParam(mod, 'mode', i);
      modeBtns.forEach((b, j) => {
        b.style.background = j === i ? color : 'var(--surf2)';
        b.style.color      = j === i ? '#000' : 'var(--tx2)';
      });
    });
    return btn;
  });
  modeBtns.forEach(b => modeRow.appendChild(b));
  container.appendChild(modeRow);

  // Curva de transferencia
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 120;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:10px; justify-content:center; flex-wrap:wrap;';
  ['drive','tone','mix','output'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  function drawCurve() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0a0a0e'; ctx.fillRect(0, 0, W, H);
    const m=25, pW=W-m*2, pH=H-m*2, pX=m, pY=m;
    ctx.strokeStyle='#4a4a5a'; ctx.lineWidth=0.5;
    for(let i=0;i<=4;i++){
      const x=pX+(pW/4)*i; ctx.beginPath(); ctx.moveTo(x,pY); ctx.lineTo(x,pY+pH); ctx.stroke();
      const y=pY+(pH/4)*i; ctx.beginPath(); ctx.moveTo(pX,y); ctx.lineTo(pX+pW,y); ctx.stroke();
    }
    const d = Math.max(0.5, mod.params.drive);
    const mo = Math.round(mod.params.mode);
    const tD = Math.tanh(d) || 1;
    ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2; ctx.shadowColor=color; ctx.shadowBlur=4;
    for(let px=0;px<=pW;px++){
      const x_in=(px/pW)*2-1;
      let y_out;
      switch(mo){
        case 0: y_out=Math.tanh(x_in*d)/tD; break;
        case 1: const bias=0.05*Math.min(d,20)/20; y_out=Math.tanh((x_in+bias)*d)/tD; break;
        case 2: const k=Math.min(d*0.08,4); let y=x_in*k;
          if(y>1)y=1; else if(y<-1)y=-1; else y=y*(1-Math.abs(y)*0.12); y_out=y; break;
        default: y_out=x_in;
      }
      y_out=Math.max(-1,Math.min(1,y_out));
      const x=pX+px, y=pY+pH-((y_out+1)/2)*pH;
      if(px===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke(); ctx.shadowBlur=0;
    ctx.beginPath(); ctx.strokeStyle='#555'; ctx.lineWidth=0.5;
    ctx.moveTo(pX,pY+pH); ctx.lineTo(pX+pW,pY); ctx.stroke();
  }
  drawCurve();
  setInterval(() => { if(container.isConnected) drawCurve(); }, 100);

  return container;
}
