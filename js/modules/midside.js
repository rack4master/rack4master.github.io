// js/modules/midside.js
import { dbToGain } from '../utils.js';

export const label = 'MID/SIDE';
export const color = '#ffaa44';

export const params = {
  midGain: { label:'MID GAIN', min:-24, max:24, def:0, step:0.5, unit:'dB' },
  sideGain: { label:'SIDE GAIN', min:-24, max:24, def:0, step:0.5, unit:'dB' },
  mix: { label:'MIX', min:0, max:100, def:100, step:1, unit:'%' }
};

export function buildNodes(ctx, params) {
  // Nodos de entrada y salida
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Splitter para separar canales
  const splitter = ctx.createChannelSplitter(2);

  // Nodos para el procesamiento Mid (L+R) y Side (L-R)
  // Necesitamos sumas y restas. Usamos ganancias para mezclar.
  // Creamos dos rutas: una para Mid y otra para Side, luego las sumamos.
  const midGainNode = ctx.createGain();
  const sideGainNode = ctx.createGain();

  // Para obtener Side: L - R, necesitamos invertir fase de R y sumar.
  // Usamos un Gain para invertir fase en el canal derecho antes de sumarlo al izquierdo.
  // Creamos un merger para la señal de salida del Side (mono) y luego lo sumamos.
  // Método más simple: usar dos canales intermedios y luego mezclar.
  // Vamos a construir la matriz Mid/Side:
  // Mid = L + R (mono)
  // Side = L - R (mono)
  // Luego, la salida estéreo se reconstruye como:
  // L_out = Mid + Side
  // R_out = Mid - Side

  // Primero, obtenemos las señales L y R por separado (splitter ya las da)
  // Creamos nodos para las señales intermedias:
  const L = ctx.createGain(); // pasa la señal izquierda
  const R = ctx.createGain(); // pasa la señal derecha

  // Conectamos splitter a L y R
  splitter.connect(L, 0);
  splitter.connect(R, 1);

  // Crear nodos para Mid y Side (mono)
  const midSum = ctx.createGain();
  const sideDiff = ctx.createGain();

  // Para Mid: L + R (suma)
  L.connect(midSum);
  R.connect(midSum);

  // Para Side: L - R. Primero invertimos R.
  const invertR = ctx.createGain();
  invertR.gain.value = -1;
  R.connect(invertR);
  L.connect(sideDiff);
  invertR.connect(sideDiff);

  // Aplicar ganancias Mid y Side
  midSum.connect(midGainNode);
  sideDiff.connect(sideGainNode);

  // Reconstrucción estéreo: L_out = Mid + Side, R_out = Mid - Side
  const leftOut = ctx.createGain();
  const rightOut = ctx.createGain();

  midGainNode.connect(leftOut);
  sideGainNode.connect(leftOut);

  midGainNode.connect(rightOut);
  const invertSide = ctx.createGain();
  invertSide.gain.value = -1;
  sideGainNode.connect(invertSide);
  invertSide.connect(rightOut);

  // Mezcla dry/wet (opcional)
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - params.mix / 100;
  wetGain.gain.value = params.mix / 100;

  input.connect(dryGain);
  input.connect(splitter);

  // Salida del procesamiento (wet) debe ser estéreo: LeftOut y RightOut se combinan en un merger
  const merger = ctx.createChannelMerger(2);
  leftOut.connect(merger, 0, 0);
  rightOut.connect(merger, 0, 1);

  merger.connect(wetGain);

  // Mezclar dry y wet
  dryGain.connect(output);
  wetGain.connect(output);

  // Retornar todos los nodos necesarios para actualizaciones (solo los que pueden cambiar parámetros)
  return { input, output, midGainNode, sideGainNode, dryGain, wetGain, splitter, L, R, midSum, sideDiff, invertR, leftOut, rightOut, invertSide, merger };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'midGain':
      r(nodes.midGainNode.gain, dbToGain(value));
      break;
    case 'sideGain':
      r(nodes.sideGainNode.gain, dbToGain(value));
      break;
    case 'mix':
      r(nodes.wetGain.gain, value / 100);
      r(nodes.dryGain.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default': { midGain: 0, sideGain: 0, mix: 100 },
  'Center Boost': { midGain: 3, sideGain: -1, mix: 100 },
  'Widen': { midGain: 0, sideGain: 4, mix: 100 },
  'Mono Maker': { midGain: 0, sideGain: -12, mix: 100 },
  'Side Only': { midGain: -12, sideGain: 0, mix: 100 },
  'Mid Only': { midGain: 0, sideGain: -24, mix: 100 },
  'Warm Center': { midGain: 2, sideGain: -2, mix: 80 }
};
