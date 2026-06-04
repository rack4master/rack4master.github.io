// js/modules/widener.js
// CORREGIDO: el original conectaba el canal L a ambas salidas (split, 0 → L y delay → R),
// descartando el canal R por completo. El canal R nunca llegaba a la salida.
// CORRECCIÓN: L → L (sin cambios), R → delay → R (Haas controlado por canal).
// Añadido: control MONO BASS (frecuencia por debajo de la cual se mono-iza el campo
// estéreo, evitando problemas de fase en subgraves al reproducir en mono).

import { buildKnob } from '../ui/knobs.js';

export const label = 'WIDENER';
export const color = '#44ccff';

export const params = {
  width:    { label:'WIDTH',     min:0,  max:30,    def:10,  step:0.5, unit:'ms'  },
  monoBass: { label:'MONO BASS', min:20, max:300,   def:120, step:5,   unit:'Hz'  },
  mix:      { label:'MIX',       min:0,  max:100,   def:100, step:1,   unit:'%'   }
};

export function buildNodes(ctx, params) {
  const input  = ctx.createGain();
  const output = ctx.createGain();

  // === Señal DRY (original estéreo) ===
  const dryG = ctx.createGain();
  dryG.gain.value = 1 - params.mix / 100;
  input.connect(dryG);
  dryG.connect(output);

  // === Señal WET (Haas widening) ===
  const split = ctx.createChannelSplitter(2);
  input.connect(split);

  // CORRECCIÓN: usar canal 1 (R) para el delay, no canal 0 (L)
  // L → L output (sin cambios)
  // R → delay → R output (R levemente retrasado → campo estéreo más amplio)
  const dlyR   = ctx.createDelay(0.05);
  dlyR.delayTime.value = params.width / 1000;

  const wetMerge = ctx.createChannelMerger(2);
  split.connect(wetMerge, 0, 0);  // L → L (canal 0 → salida 0) ← SIN CAMBIO
  split.connect(dlyR, 1);         // R → delay (canal 1) ← CORRECCIÓN (antes era 0)
  dlyR.connect(wetMerge, 0, 1);   // delayed R → R output

  // === Filtro mono-bass: mono-iza las frecuencias bajas para preservar punch en mono ===
  // El wet de alta frecuencia pasa normal; el bass se mono-iza sumando L+R
  const bassLP_L = ctx.createBiquadFilter();
  bassLP_L.type = 'lowpass';
  bassLP_L.frequency.value = params.monoBass;
  bassLP_L.Q.value = 0.7;
  const bassLP_R = ctx.createBiquadFilter();
  bassLP_R.type = 'lowpass';
  bassLP_R.frequency.value = params.monoBass;
  bassLP_R.Q.value = 0.7;

  // Bass mono: mezcla L y R del wet en mono para la banda baja
  const bassMonoGain = ctx.createGain();
  bassMonoGain.gain.value = 0.5;   // promedio L+R
  const bassMerge = ctx.createChannelMerger(2);
  // (implementación simplificada: lowpass del merger wet → suma → merge para ambos canales)
  // Se usa el campo mid del wet para las bajas frecuencias
  wetMerge.connect(bassLP_L);
  wetMerge.connect(bassLP_R);
  bassLP_L.connect(bassMonoGain);
  bassLP_R.connect(bassMonoGain);

  // High-pass del wet (mantiene el ancho estéreo en altas frecuencias)
  const wetHP_L = ctx.createBiquadFilter();
  wetHP_L.type = 'highpass';
  wetHP_L.frequency.value = params.monoBass;
  wetHP_L.Q.value = 0.7;
  const wetHP_R = ctx.createBiquadFilter();
  wetHP_R.type = 'highpass';
  wetHP_R.frequency.value = params.monoBass;
  wetHP_R.Q.value = 0.7;
  wetMerge.connect(wetHP_L);
  wetMerge.connect(wetHP_R);

  const wetSum = ctx.createChannelMerger(2);
  bassMonoGain.connect(wetSum, 0, 0);
  bassMonoGain.connect(wetSum, 0, 1);
  wetHP_L.connect(wetSum, 0, 0);
  wetHP_R.connect(wetSum, 0, 1);

  const wetG = ctx.createGain();
  wetG.gain.value = params.mix / 100;
  wetSum.connect(wetG);
  wetG.connect(output);

  return { input, output, dryG, wetG, split, dlyR, wetMerge,
           bassLP_L, bassLP_R, bassMonoGain, wetHP_L, wetHP_R, wetSum };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'width':
      r(nodes.dlyR.delayTime, value / 1000);
      break;
    case 'monoBass':
      r(nodes.bassLP_L.frequency, value);
      r(nodes.bassLP_R.frequency, value);
      r(nodes.wetHP_L.frequency,  value);
      r(nodes.wetHP_R.frequency,  value);
      break;
    case 'mix':
      r(nodes.wetG.gain, value / 100);
      r(nodes.dryG.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default':          { width:10, monoBass:120, mix:100 },
  'Subtle':           { width:5,  monoBass:100, mix:60  },
  'Medium':           { width:12, monoBass:120, mix:80  },
  'Wide':             { width:20, monoBass:150, mix:100 },
  'Extreme':          { width:28, monoBass:200, mix:100 },
  'Half Mix':         { width:15, monoBass:120, mix:50  },
  'Mono Compatible':  { width:8,  monoBass:80,  mix:70  }
};

// ----------------------------------------------------------------
// UI personalizada del Widener
// ----------------------------------------------------------------
export function buildUI(mod) {
  const def = window.MODULE_DEFS['widener'];
  const color = def.color;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:12px;';

  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 50;
  canvas.style.cssText = 'border:1px solid #444; border-radius:4px; background:#0a0a0e; display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const knobsRow = document.createElement('div');
  knobsRow.style.cssText = 'display:flex; gap:12px; justify-content:center; flex-wrap:wrap;';
  ['width', 'monoBass', 'mix'].forEach(key => {
    knobsRow.appendChild(buildKnob(mod, key, def.params[key], color));
  });
  container.appendChild(knobsRow);

  function animate() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0e'; ctx.fillRect(0, 0, W, H);

    const widthVal = mod.params.width;
    const mixVal   = mod.params.mix;

    // Línea central
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();

    // Barras simétricas de anchura
    const barW = (widthVal / 30) * (W * 0.42);
    const barH = 8, barY = H/2 - barH/2;
    const mixAlpha = 0.4 + (mixVal / 100) * 0.5;

    ctx.fillStyle = `rgba(68,204,255,${mixAlpha})`;
    ctx.fillRect(W/2 - barW, barY, barW, barH);   // lado izquierdo
    ctx.fillRect(W/2,        barY, barW, barH);   // lado derecho

    // Indicador de mono bass
    const monoX = (mod.params.monoBass / 300) * (W/2);
    ctx.strokeStyle = 'rgba(255,170,68,0.6)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.moveTo(W/2 - monoX, 0); ctx.lineTo(W/2 - monoX, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2 + monoX, 0); ctx.lineTo(W/2 + monoX, H); ctx.stroke();
    ctx.setLineDash([]);

    requestAnimationFrame(animate);
  }
  animate();

  return container;
}
