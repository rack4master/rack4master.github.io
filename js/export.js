// js/export.js
import { buildAudioNodes } from './core/audio.js';

/**
 * Renderiza offline el audio procesado
 * @param {AudioBuffer} audioBuffer - buffer original
 * @param {Array} modules - módulos activos
 * @param {boolean} globalBypass - bypass global
 * @param {number} outGainDb - ganancia de salida en dB
 * @param {HTMLElement} chainAreaElement - contenedor de la cadena (para orden)
 * @param {number|null} targetSampleRate - frecuencia de muestreo deseada (null = original)
 * @returns {Promise<AudioBuffer>} buffer renderizado
 */
export async function renderOffline(audioBuffer, modules, globalBypass, outGainDb, chainAreaElement, targetSampleRate = null) {
  const srcSR = audioBuffer.sampleRate;
  const outSR = (targetSampleRate && targetSampleRate > 0) ? targetSampleRate : srcSR;
  const numCh = audioBuffer.numberOfChannels;
  const len = (outSR === srcSR) ? audioBuffer.length : Math.ceil(audioBuffer.duration * outSR);
  const offCtx = new OfflineAudioContext(numCh, len, outSR);

  const offIn = offCtx.createGain();
  const offOut = offCtx.createGain();
  offOut.connect(offCtx.destination);

  const domIds = [...chainAreaElement.querySelectorAll('.mod-thumb')].map(el => +el.dataset.id);
  const ordered = domIds.map(id => modules.find(m => m.id === id)).filter(Boolean);
  const active = globalBypass ? [] : ordered.filter(m => !m.bypassed);

  const offGain = offCtx.createGain();
  offGain.gain.value = Math.pow(10, outGainDb / 20);

  let lastOutput = offIn;
  if (active.length > 0) {
    const offMods = active.map(m => buildAudioNodes(m.type, m.params, offCtx));
    offIn.connect(offMods[0].input);
    for (let i = 0; i < offMods.length - 1; i++) {
      offMods[i].output.connect(offMods[i + 1].input);
    }
    lastOutput = offMods[offMods.length - 1].output;
  }
  lastOutput.connect(offGain);
  offGain.connect(offOut);

  const src = offCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(offIn);
  src.start(0);

  return await offCtx.startRendering();
}

/**
 * Descarga un buffer como WAV (16 o 24 bits, con dithering TPDF para 16 bits)
 * @param {AudioBuffer} renderedBuffer - buffer renderizado
 * @param {number} bitDepth - 16 o 24
 */
export function downloadWav(renderedBuffer, bitDepth = 16) {
  const numCh = renderedBuffer.numberOfChannels;
  const sampleRate = renderedBuffer.sampleRate;
  const len = renderedBuffer.length;
  const bytesPerSample = (bitDepth === 24) ? 3 : 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let pos = 0;

  function writeString(s) {
    for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i));
    pos += s.length;
  }
  function writeU32(v) { view.setUint32(pos, v, true); pos += 4; }
  function writeU16(v) { view.setUint16(pos, v, true); pos += 2; }

  writeString('RIFF');
  writeU32(36 + dataSize);
  writeString('WAVE');
  writeString('fmt ');
  writeU32(16);
  writeU16(1);           // PCM
  writeU16(numCh);
  writeU32(sampleRate);
  writeU32(sampleRate * blockAlign);
  writeU16(blockAlign);
  writeU16(bitDepth);
  writeString('data');
  writeU32(dataSize);

  const channels = [];
  for (let c = 0; c < numCh; c++) channels.push(renderedBuffer.getChannelData(c));

  // Dithering TPDF solo para 16 bits (mejora la calidad subjetiva)
  const ditherScale = 1.0 / 32768.0; // 1 LSB

  let offset = pos;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i];
      if (bitDepth === 16) {
        // Aplicar dithering TPDF
        const r1 = Math.random();
        const r2 = Math.random();
        const dither = (r1 + r2 - 1.0) * ditherScale;
        s = s + dither;
        if (s > 1.0) s = 1.0;
        if (s < -1.0) s = -1.0;
        const intSample = Math.round(s * 32767);
        view.setInt16(offset, intSample, true);
        offset += 2;
      } else { // 24 bits
        // Convertir float a entero de 24 bits con rango simétrico
        let v24;
        if (s < 0) v24 = Math.round(s * 8388608);
        else v24 = Math.round(s * 8388607);
        v24 = Math.max(-8388608, Math.min(8388607, v24));
        view.setUint8(offset,      v24 & 0xFF);
        view.setUint8(offset + 1, (v24 >> 8) & 0xFF);
        view.setUint8(offset + 2, (v24 >> 16) & 0xFF);
        offset += 3;
      }
    }
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Usamos el nombre base del archivo original si está disponible
  const trackNameElem = document.getElementById('track-name');
  let baseName = 'rack4master';
  if (trackNameElem && trackNameElem.textContent && trackNameElem.textContent !== '— No hay audio cargado —') {
    baseName = trackNameElem.textContent.replace(/\.[^/.]+$/, ''); // sin extensión
  }
  const label = bitDepth + 'bit' + (sampleRate === 48000 ? '_48k' : '');
  a.download = `${baseName}_${label}.wav`;
  a.click();
  URL.revokeObjectURL(url);
}
