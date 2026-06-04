// js/modules/delay.js
import { buildKnob } from '../ui/knobs.js';

export const label = 'DELAY';
export const color = '#ffcc33';

export const params = {
  time:     { label:'TIME',   min:10, max:1000, def:250, step:1,   unit:'ms' },
  feedback: { label:'FEEDBK', min:0,  max:95,   def:40,  step:1,   unit:'%' },
  tone:     { label:'TONE',   min:500, max:8000, def:3500,step:50,  unit:'Hz' },
  mix:      { label:'MIX',    min:0,  max:100,  def:30,  step:1,   unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const dlyNode = ctx.createDelay(2.0);
  const fbGain = ctx.createGain();
  const toneF = ctx.createBiquadFilter();
  toneF.type = 'lowpass';
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  dlyNode.delayTime.value = params.time / 1000;
  fbGain.gain.value = params.feedback / 100;
  toneF.frequency.value = params.tone;
  input.connect(dry);
  input.connect(dlyNode);
  dlyNode.connect(toneF);
  toneF.connect(fbGain);
  fbGain.connect(dlyNode);
  toneF.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, dlyNode, fbGain, toneF };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'time':     r(nodes.dlyNode.delayTime, value / 1000); break;
    case 'feedback': r(nodes.fbGain.gain, value / 100); break;
    case 'tone':     r(nodes.toneF.frequency, value); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':      { time:250, feedback:40, tone:3500, mix:30 },
  'Slapback':     { time:120, feedback:20, tone:4000, mix:35 },
  'Long Echo':    { time:600, feedback:50, tone:3000, mix:40 },
  'Tape Delay':   { time:350, feedback:60, tone:2500, mix:45 },
  'Ping Pong':    { time:400, feedback:45, tone:5000, mix:40 },
  'Ambient':      { time:800, feedback:30, tone:6000, mix:25 },
  'Short Repeat': { time:80,  feedback:25, tone:4500, mix:30 }
};

// ----------------------------------------------------------------
// UI personalizada del Delay (línea de tiempo con marcas de eco)
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['delay'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

  // Canvas para la línea de tiempo
  const canvas = document.createElement('canvas');
  canvas.className = 'delay-canvas';
  canvas.width = 260;
  canvas.height = 50;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Knobs
  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:14px; justify-content:center;';
  ['time', 'feedback', 'tone', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  // ---- Animación de la línea de tiempo ----
  function animate() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, W, H);

    // Línea central
    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, H/2);
    ctx.lineTo(W-10, H/2);
    ctx.stroke();

    // Calcular posición del primer tap y siguientes
    const timeVal = mod.params.time;         // ms
    const feedbackVal = mod.params.feedback; // %
    const maxTimeMs = 1000;                  // máximo del parámetro time
    const maxPixels = W - 20;                // espacio disponible
    const tapX = 10 + (timeVal / maxTimeMs) * maxPixels;

    // Dibujar taps (marcas verticales) según feedback y time
    const numTaps = Math.floor(1 / (1 - feedbackVal / 100)) + 2; // cuántos taps se ven
    for (let i = 0; i < Math.min(numTaps, 10); i++) {
      const x = tapX + i * (tapX - 10); // distancia entre taps = tapX - 10
      if (x > W - 10) break;
      const alpha = 1 - i * (0.7 / Math.min(numTaps, 10)); // se atenúan
      ctx.strokeStyle = `rgba(255, 200, 50, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, H/2 - 10);
      ctx.lineTo(x, H/2 + 10);
      ctx.stroke();
    }

    // Indicador de tiempo (primer tap resaltado)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tapX, H/2, 4, 0, 2*Math.PI);
    ctx.fill();

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
