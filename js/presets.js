// js/presets.js
export const INSTRUMENT_PRESETS = {
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

  'acoustic-drums':    ['gate', 'eq', 'compressor', 'reverb', 'limiter'],
  'electronic-drums':  ['gate', 'eq', 'compressor', 'softclipper', 'limiter'],
  'percussion':        ['gate', 'eq', 'compressor', 'reverb', 'limiter'],

  'strings':           ['eq', 'compressor', 'reverb', 'limiter'],
  'brass':             ['eq', 'compressor', 'saturator', 'reverb', 'limiter'],
  'woodwinds':         ['eq', 'compressor', 'reverb', 'limiter'],

  'full-mix':          ['eq', 'compressor', 'widener', 'multiband', 'limiter'],
  'master-bus':        ['eq', 'compressor', 'multiband', 'softclipper', 'limiter'],
  'lofi':              ['eq', 'compressor', 'saturator', 'reverb', 'limiter'],
  'bass-boost':        ['eq', 'multiband', 'softclipper', 'limiter']
};
