// js/export.js
import { buildAudioNodes } from './core/audio.js';

export async function renderOffline(audioBuffer, modules, globalBypass, outGainDb, chainAreaElement) {
  const offCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
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

export function downloadWav(renderedBuffer) {
  const nc = renderedBuffer.numberOfChannels;
  const sr = renderedBuffer.sampleRate;
  const len = renderedBuffer.length;
  const ab = new ArrayBuffer(44 + len * nc * 2);
  const view = new DataView(ab);

  function writeString(o, s) {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + len * nc * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, nc, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * nc * 2, true);
  view.setUint16(32, nc * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, len * nc * 2, true);

  const channels = [];
  for (let c = 0; c < nc; c++) channels.push(renderedBuffer.getChannelData(c));

  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < nc; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }

  const blob = new Blob([ab], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rack4master-export.wav';
  a.click();
  URL.revokeObjectURL(url);
}
