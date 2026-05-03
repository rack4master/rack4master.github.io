// js/modules/exciter.js
import { dbToGain } from '../utils.js';

export const label = 'EXCITER';
export const color = '#33dd99';

export const params = {
  cutoff: { label:'CUTOFF', min:1000, max:12000, def:4000, step:50, unit:'Hz' },
  drive: { label:'DRIVE', min:0, max:100, def:50, step:1, unit:'%' },
  mix: { label:'MIX', min:0, max:100, def:50, step:1, unit:'%' },
  output: { label:'OUTPUT', min:-12, max:12, def:0, step:0.5, unit:'dB' }
};

// Función para generar la curva de distorsión armónica (par)
// f(x) = x * (1 + driveNorm * x^2)  — solo parte positiva, pero mantenemos simetría simple
function buildExciterCurve(drive) {
  const n = 2048;
  const curve = new Float32Array(n);
  // drive entre 0 y 1 (de 0% a 100%)
  const d = Math.min(1, Math.max(0, drive / 100));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    // Curva asimétrica suave: añade armónicos pares (más cálidos)
    // Para evitar distorsión agresiva, limitamos el rango de salida a ±1.5
    let y = x * (1 + d * x * x);
    // Clipeado suave por si acaso
    if (y > 1.5) y = 1.5;
    if (y < -1.5) y = -1.5;
    curve[i] = y;
  }
  return curve;
}

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Filtro paso alto para aislar agudos
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = params.cutoff;
  hpFilter.Q.value = 0.7;

  // WaveShaper para generar armónicos
  const shaper = ctx.createWaveShaper();
  shaper.oversample = '4x';
  shaper.curve = buildExciterCurve(params.drive);

  // Mezcla dry/wet
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - params.mix / 100;
  wetGain.gain.value = params.mix / 100;

  // Ganancia de salida
  const outGain = ctx.createGain();
  outGain.gain.value = dbToGain(params.output);

  // Conexiones
  input.connect(dryGain);
  input.connect(hpFilter);
  hpFilter.connect(shaper);
  shaper.connect(wetGain);
  dryGain.connect(outGain);
  wetGain.connect(outGain);
  outGain.connect(output);

  return { input, output, hpFilter, shaper, dryGain, wetGain, outGain };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'cutoff':
      r(nodes.hpFilter.frequency, value);
      break;
    case 'drive':
      nodes.shaper.curve = buildExciterCurve(value);
      break;
    case 'mix':
      r(nodes.wetGain.gain, value / 100);
      r(nodes.dryGain.gain, 1 - value / 100);
      break;
    case 'output':
      r(nodes.outGain.gain, dbToGain(value));
      break;
  }
}

export const presets = {
  'Default': { cutoff: 4000, drive: 50, mix: 50, output: 0 },
  'Air Boost': { cutoff: 6000, drive: 60, mix: 70, output: 1 },
  'Subtle Brilliance': { cutoff: 5000, drive: 30, mix: 40, output: 0 },
  'Aggressive': { cutoff: 3000, drive: 80, mix: 80, output: 2 },
  'Vocal Presence': { cutoff: 4500, drive: 55, mix: 60, output: 1 },
  'Tape Bright': { cutoff: 8000, drive: 40, mix: 50, output: 0.5 },
  'Soft Enhance': { cutoff: 3500, drive: 25, mix: 35, output: 0 }
};
