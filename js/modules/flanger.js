// js/modules/flanger.js
import { buildKnob } from '../ui/knobs.js';

export const label = 'FLANGER';
export const color = '#aa33ff';

export const params = {
  rate:     { label:'RATE',   min:0.1, max:10, def:0.5, step:0.1, unit:'Hz' },
  depth:    { label:'DEPTH',  min:0.1, max:10, def:2,   step:0.1, unit:'ms' },
  feedback: { label:'FEEDBK', min:0,   max:90, def:50,  step:1,   unit:'%' },
  mix:      { label:'MIX',    min:0,   max:100,def:50,  step:1,   unit:'%' }
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
    case 'rate':     r(nodes.lfo.frequency, value); break;
    case 'depth':    r(nodes.lfoGain.gain, value / 1000); break;
    case 'feedback': r(nodes.fb.gain, value / 100); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':       { rate:0.5, depth:2, feedback:50, mix:50 },
  'Jet Plane':     { rate:1.2, depth:5, feedback:70, mix:60 },
  'Subtle Sweep':  { rate:0.3, depth:1.5,feedback:30,mix:40 },
  'Deep Flange':   { rate:0.8, depth:4, feedback:60, mix:55 },
  'Resonant':      { rate:0.2, depth:3, feedback:80, mix:65 },
  'Fast Swirl':    { rate:3,   depth:2, feedback:40, mix:50 },
  'Classic 80s':   { rate:0.5, depth:2.5,feedback:55,mix:50 }
};

// ----------------------------------------------------------------
// UI personalizada del Flanger (osciloscopio LFO + feedback + knobs)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['flanger'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:12px;';

  // Osciloscopio (igual que el Chorus)
  const canvas = document.createElement('canvas');
  canvas.className = 'flanger-lfo-canvas';
  canvas.width = 220;
  canvas.height = 50;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#000; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // ---- Indicador de feedback (barra horizontal fina) ----
  const fbContainer = document.createElement('div');
  fbContainer.style.cssText = 'display:flex; align-items:center; gap:6px; width:220px;';
  const fbLabel = document.createElement('span');
  fbLabel.textContent = 'FDBK';
  fbLabel.style.cssText = 'font-family:"Share Tech Mono",monospace; font-size:9px; color:#888;';
  const fbTrack = document.createElement('div');
  fbTrack.style.cssText = 'flex:1; height:4px; background:#1a1a20; border-radius:2px; overflow:hidden;';
  const fbFill = document.createElement('div');
  fbFill.style.cssText = 'height:100%; background:#aa33ff; border-radius:2px; transition: width 0.1s linear;';
  fbTrack.appendChild(fbFill);
  fbContainer.appendChild(fbLabel);
  fbContainer.appendChild(fbTrack);
  container.appendChild(fbContainer);

  // Knobs (los 4)
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:16px; justify-content:center;';
  ['rate', 'depth', 'feedback', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Animación del osciloscopio + barra de feedback ----
  function animate() {
    const W = canvas.width;
    const H = canvas.height;
    const freq = mod.params.rate;
    const depth = mod.params.depth;
    const feedback = mod.params.feedback;
    const now = performance.now() / 1000;
    const phase = (now * freq) % 1.0;

    // Osciloscopio
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Rejilla
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const y = (H / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const amplitude = (depth / 10) * (H * 0.4);
    // Marcas de profundidad (min/max) con líneas punteadas
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    [H/2 - amplitude, H/2 + amplitude].forEach(y => {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Onda LFO
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    for (let x = 0; x <= W; x++) {
      const t = x / W;
      const value = Math.sin(2 * Math.PI * (t + phase)) * amplitude;
      const y = H/2 - value;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Barra de feedback
    fbFill.style.width = feedback + '%';

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
