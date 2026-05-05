// js/presets.js
export const INSTRUMENT_PRESETS = {
  // --- INSTRUMENTOS (sin cambios) ---
  'acoustic-guitar':   ['gate', 'eq', 'compressor', 'reverb', 'limiter'],
  'classical-guitar':  ['eq', 'compressor', 'reverb', 'limiter'],
  'clean-guitar':      ['gate', 'eq', 'compressor', 'reverb', 'limiter'],
  'drive-guitar':      ['gate', 'eq', 'compressor', 'saturator', 'limiter'],
  'fuzz-guitar':       ['gate', 'eq', 'multiband', 'limiter'],
  'metal-guitar':      ['gate', 'eq', 'multiband', 'softclipper', 'limiter'],

  'grand-piano':       ['eq', 'compressor', 'reverb', 'limiter'],
  'studio-piano':      ['eq', 'compressor', 'limiter'],
  'rhodes':            ['eq', 'compressor', 'chorus', 'reverb', 'limiter'],
  'synth':             ['eq', 'compressor', 'widener', 'reverb', 'limiter'],

  'vocal-main':        ['deesserpro', 'eq', 'compressor', 'delay', 'reverb', 'limiter'],
  'vocal-male':        ['deesserpro', 'eq', 'compressor', 'saturator', 'reverb', 'limiter'],
  'vocal-female':      ['deesserpro', 'eq', 'compressor', 'exciter', 'reverb', 'limiter'],
  'choir':             ['deesser', 'eq', 'compressor', 'reverb', 'widener', 'limiter'],
  'rap':               ['deesserpro', 'eq', 'compressor', 'limiter'],

  // --- BATERÍAS Y PERCUSIÓN ---
  'acoustic-drums': [
    { type: 'gate',       params: { threshold: -18, ratio: 2, attack: 1, release: 100 } },
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 1, b1Q: 1, b2Freq: 400, b2Gain: -1, b2Q: 1.2, b3Freq: 3000, b3Gain: 1.5, b3Q: 1.2, b4Freq: 10000, b4Gain: 1, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -20, ratio: 2, attack: 15, release: 150, makeup: 1.5 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'studio-drums': [
    { type: 'gate',       params: { threshold: -16, ratio: 2.5, attack: 1, release: 80 } },
    { type: 'eq',         params: { b1Freq: 70, b1Gain: 1.5, b1Q: 0.9, b2Freq: 500, b2Gain: -1.5, b2Q: 1, b3Freq: 4000, b3Gain: 1, b3Q: 1, b4Freq: 10000, b4Gain: 0.5, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -18, ratio: 2, attack: 20, release: 180, makeup: 2 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'vintage-drums': [
    { type: 'gate',       params: { threshold: -20, ratio: 2, attack: 2, release: 120 } },
    { type: 'saturator',  params: { drive: 2, tone: 0, mix: 50, output: 0 } },
    { type: 'eq',         params: { b1Freq: 90, b1Gain: 1, b1Q: 0.8, b2Freq: 350, b2Gain: -1, b2Q: 1.1, b3Freq: 3500, b3Gain: 1, b3Q: 1, b4Freq: 10000, b4Gain: 0, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -16, ratio: 2, attack: 25, release: 200, makeup: 1.5 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'jazz-drums': [
    { type: 'gate',       params: { threshold: -22, ratio: 2, attack: 3, release: 150 } },
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 0, b1Q: 1, b2Freq: 300, b2Gain: -1, b2Q: 1, b3Freq: 5000, b3Gain: 1.5, b3Q: 1.2, b4Freq: 12000, b4Gain: 2, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -22, ratio: 1.5, attack: 30, release: 200, makeup: 0.5 } },
    { type: 'exciter',    params: { cutoff: 6000, drive: 20, mix: 30, output: 0 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'electronic-drums': [
    { type: 'gate',       params: { threshold: -15, ratio: 2, attack: 1, release: 80 } },
    { type: 'eq',         params: { b1Freq: 90, b1Gain: 0, b1Q: 0.8, b2Freq: 500, b2Gain: -1, b2Q: 1, b3Freq: 4000, b3Gain: 1, b3Q: 1, b4Freq: 10000, b4Gain: 0, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -18, ratio: 2, attack: 10, release: 100, makeup: 1.5 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'percussion': [
    { type: 'gate',       params: { threshold: -20, ratio: 2, attack: 2, release: 120 } },
    { type: 'eq',         params: { b1Freq: 100, b1Gain: -1, b1Q: 0.8, b2Freq: 600, b2Gain: -1, b2Q: 1, b3Freq: 5000, b3Gain: 1.5, b3Q: 1.2, b4Freq: 12000, b4Gain: 1.5, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -20, ratio: 1.5, attack: 20, release: 150, makeup: 1.5 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],

  // --- ORQUESTA ---
  'strings':           ['eq', 'compressor', 'reverb', 'limiter'],
  'brass':             ['eq', 'compressor', 'saturator', 'reverb', 'limiter'],
  'woodwinds':         ['eq', 'compressor', 'reverb', 'limiter'],

  // --- MEZCLA POR GÉNEROS MUSICALES ---
  'rock': [
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 1, b1Q: 1, b2Freq: 400, b2Gain: -1, b2Q: 1.2, b3Freq: 3000, b3Gain: 1, b3Q: 1, b4Freq: 10000, b4Gain: 1, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -16, ratio: 2.5, attack: 15, release: 150, makeup: 2 } },
    { type: 'saturator',  params: { drive: 2, tone: 1, mix: 40, output: 0 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'blues': [
    { type: 'eq',         params: { b1Freq: 90, b1Gain: 1, b1Q: 0.9, b2Freq: 350, b2Gain: -1, b2Q: 1, b3Freq: 3500, b3Gain: 0.5, b3Q: 1, b4Freq: 10000, b4Gain: 0.5, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -18, ratio: 2, attack: 20, release: 180, makeup: 1.5 } },
    { type: 'reverb',     params: { size: 1.5, decay: 2, predelay: 20, mix: 25 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'country': [
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 1.5, b1Q: 1, b2Freq: 500, b2Gain: -1, b2Q: 1, b3Freq: 4000, b3Gain: 1.5, b3Q: 1.2, b4Freq: 12000, b4Gain: 1, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -18, ratio: 2, attack: 15, release: 150, makeup: 2 } },
    { type: 'exciter',    params: { cutoff: 5000, drive: 25, mix: 35, output: 0 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'folk': [
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 0.5, b1Q: 1, b2Freq: 300, b2Gain: -1, b2Q: 1, b3Freq: 4000, b3Gain: 1, b3Q: 1, b4Freq: 10000, b4Gain: 0.5, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -20, ratio: 1.5, attack: 25, release: 200, makeup: 1 } },
    { type: 'reverb',     params: { size: 1.2, decay: 1.8, predelay: 15, mix: 22 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'jazz': [
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 0, b1Q: 1, b2Freq: 300, b2Gain: -1, b2Q: 1, b3Freq: 5000, b3Gain: 1, b3Q: 1.2, b4Freq: 12000, b4Gain: 1.5, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -22, ratio: 1.5, attack: 30, release: 200, makeup: 0.5 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'urban': [
    { type: 'eq',         params: { b1Freq: 90, b1Gain: -1, b1Q: 0.8, b2Freq: 400, b2Gain: -1, b2Q: 1, b3Freq: 4000, b3Gain: 1, b3Q: 1, b4Freq: 10000, b4Gain: 0.5, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -14, ratio: 3, attack: 10, release: 100, makeup: 3 } },
    'multiband',
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'latino': [
    { type: 'eq',         params: { b1Freq: 100, b1Gain: 1, b1Q: 0.9, b2Freq: 500, b2Gain: -1, b2Q: 1, b3Freq: 5000, b3Gain: 1.5, b3Q: 1.2, b4Freq: 12000, b4Gain: 2, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -18, ratio: 2, attack: 15, release: 150, makeup: 2 } },
    { type: 'exciter',    params: { cutoff: 6000, drive: 30, mix: 40, output: 0 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'pop': [
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 1, b1Q: 1, b2Freq: 400, b2Gain: -1, b2Q: 1.2, b3Freq: 4000, b3Gain: 1.5, b3Q: 1.2, b4Freq: 12000, b4Gain: 1.5, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -16, ratio: 2.5, attack: 10, release: 120, makeup: 2.5 } },
    { type: 'widener',    params: { width: 12, mix: 70 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'ballad': [
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 1, b1Q: 1, b2Freq: 300, b2Gain: -1, b2Q: 1, b3Freq: 4000, b3Gain: 1, b3Q: 1, b4Freq: 10000, b4Gain: 1, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -20, ratio: 2, attack: 25, release: 200, makeup: 1.5 } },
    { type: 'reverb',     params: { size: 2, decay: 2.5, predelay: 30, mix: 28 } },
    { type: 'limiter',    params: { threshold: -1.5, release: 100, makeup: 0 } }
  ],
  'mastering': [
    { type: 'eq',         params: { b1Freq: 80, b1Gain: 0, b1Q: 1, b2Freq: 500, b2Gain: 0, b2Q: 1, b3Freq: 3000, b3Gain: 0, b3Q: 1, b4Freq: 10000, b4Gain: 0, b4Q: 1 } },
    { type: 'compressor', params: { threshold: -8, ratio: 1.5, attack: 30, release: 300, makeup: 1 } },
    { type: 'limiter',    params: { threshold: -1, release: 100, makeup: 0 } }
  ]
};
