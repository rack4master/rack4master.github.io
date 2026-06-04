// js/presets.js
// ACTUALIZADO: nuevos nombres de módulos + presets con parámetros explícitos.
// chorus/flanger → modulation | saturator/softclipper → harmonicdrive | deesserpro → deesser

export const INSTRUMENT_PRESETS = {

  // ── GUITARRAS ──────────────────────────────────────────────────
  'acoustic-guitar': [
    { type:'gate',        params:{ threshold:-30, ratio:2,  attack:5,   release:200, hold:30  } },
    { type:'eq',          params:{ b1Freq:100, b1Gain:-2, b1Q:1.2, b2Freq:400, b2Gain:-1.5, b2Q:1.2, b3Freq:2500, b3Gain:1.5, b3Q:1.0, b4Freq:10000, b4Gain:2, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2.5, knee:8, attack:15, release:80,  makeup:2 } },
    { type:'reverb',      params:{ size:1.2, decay:1.5, damping:60, predelay:15, mix:18 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'classical-guitar': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:-1, b1Q:1.0, b2Freq:350, b2Gain:-0.5, b2Q:1.5, b3Freq:3000, b3Gain:0.5, b3Q:1.0, b4Freq:12000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-20, ratio:2,  knee:10, attack:20, release:120, makeup:1 } },
    { type:'reverb',      params:{ size:1.5, decay:2,   damping:50, predelay:20, mix:22 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'clean-guitar': [
    { type:'gate',        params:{ threshold:-35, ratio:3,  attack:2,   release:150, hold:20  } },
    { type:'eq',          params:{ b1Freq:90,  b1Gain:-1, b1Q:1.0, b2Freq:400, b2Gain:-1, b2Q:1.2, b3Freq:3000, b3Gain:1,   b3Q:1.0, b4Freq:10000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-20, ratio:2.5, knee:8, attack:10, release:100, makeup:2 } },
    { type:'reverb',      params:{ size:1.0, decay:1.2, damping:55, predelay:12, mix:20 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'drive-guitar': [
    { type:'gate',        params:{ threshold:-25, ratio:5,  attack:1,   release:100, hold:10  } },
    { type:'eq',          params:{ b1Freq:80,  b1Gain:1,  b1Q:0.9, b2Freq:400, b2Gain:-2,   b2Q:1.2, b3Freq:3000, b3Gain:2,   b3Q:1.0, b4Freq:10000, b4Gain:1,   b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-15, ratio:3,   knee:5, attack:5,  release:80,  makeup:2 } },
    { type:'harmonicdrive',params:{ mode:1, drive:15, tone:2,  mix:60, output:0 } },
    { type:'limiter',     params:{ threshold:-1, release:60, makeup:0 } }
  ],
  'metal-guitar': [
    { type:'gate',        params:{ threshold:-20, ratio:8,  attack:1,   release:80,  hold:5   } },
    { type:'eq',          params:{ b1Freq:80,  b1Gain:1.5,b1Q:0.8, b2Freq:500, b2Gain:-2,   b2Q:1.0, b3Freq:4000, b3Gain:2,   b3Q:1.0, b4Freq:10000, b4Gain:0.5, b4Q:0.9 } },
    { type:'multiband',   params:{ lowMidFreq:120, midHighFreq:2000, lowThreshold:-10, lowRatio:3, lowAttack:5, lowRelease:80, lowMakeup:1, midThreshold:-12, midRatio:3, midAttack:10, midRelease:60, midMakeup:1, highThreshold:-18, highRatio:2, highAttack:8, highRelease:50, highMakeup:0, outputGain:0 } },
    { type:'limiter',     params:{ threshold:-1, release:50, makeup:0 } }
  ],

  // ── PIANOS / TECLAS ────────────────────────────────────────────
  'grand-piano': [
    { type:'eq',          params:{ b1Freq:60,  b1Gain:-1, b1Q:0.8, b2Freq:300, b2Gain:-0.5, b2Q:1.5, b3Freq:5000, b3Gain:1,   b3Q:1.0, b4Freq:14000, b4Gain:2,   b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-20, ratio:2,  knee:10, attack:25, release:200, makeup:1 } },
    { type:'reverb',      params:{ size:2,   decay:2.5, damping:45, predelay:25, mix:25 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'studio-piano': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:-1, b1Q:1.0, b2Freq:400, b2Gain:-0.5, b2Q:1.5, b3Freq:4000, b3Gain:1,   b3Q:1.0, b4Freq:12000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:8,  attack:20, release:150, makeup:1.5} },
    { type:'limiter',     params:{ threshold:-1, release:80,  makeup:0 } }
  ],
  'rhodes': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:0.5,b1Q:1.0, b2Freq:300, b2Gain:-1,   b2Q:1.2, b3Freq:3500, b3Gain:1.5, b3Q:1.0, b4Freq:10000, b4Gain:1,   b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:10, attack:15, release:120, makeup:1 } },
    { type:'modulation',  params:{ mode:0, rate:1.0, depth:4, feedback:0, mix:35 } },
    { type:'reverb',      params:{ size:1.2, decay:1.8, damping:55, predelay:15, mix:22 } },
    { type:'limiter',     params:{ threshold:-1, release:80,  makeup:0 } }
  ],
  'synth': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:0.5,b1Q:1.0, b2Freq:400, b2Gain:-0.5, b2Q:1.2, b3Freq:4000, b3Gain:1,   b3Q:1.0, b4Freq:12000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-16, ratio:2.5, knee:6, attack:10, release:100, makeup:2 } },
    { type:'widener',     params:{ width:12, monoBass:120, mix:70 } },
    { type:'reverb',      params:{ size:1.5, decay:2,   damping:50, predelay:20, mix:25 } },
    { type:'limiter',     params:{ threshold:-1, release:80,  makeup:0 } }
  ],

  // ── VOCES ──────────────────────────────────────────────────────
  'vocal-main': [
    { type:'deesser',     params:{ frequency:7000, threshold:-18, ratio:4, attack:3, release:100, mix:100, output:0 } },
    { type:'eq',          params:{ b1Freq:120, b1Gain:-3, b1Q:0.8, b2Freq:300, b2Gain:-1, b2Q:1.5, b3Freq:3000, b3Gain:1, b3Q:0.9, b4Freq:12000, b4Gain:2, b4Q:0.7 } },
    { type:'compressor',  params:{ threshold:-20, ratio:3, knee:8, attack:8, release:120, makeup:3 } },
    { type:'delay',       params:{ time:125, feedback:20, tone:4000, mix:15 } },
    { type:'reverb',      params:{ size:1.5, decay:1.8, damping:55, predelay:25, mix:20 } },
    { type:'limiter',     params:{ threshold:-1, release:60, makeup:0 } }
  ],
  'vocal-male': [
    { type:'deesser',     params:{ frequency:5500, threshold:-20, ratio:4, attack:4, release:120, mix:100, output:0 } },
    { type:'eq',          params:{ b1Freq:100, b1Gain:-2, b1Q:0.8, b2Freq:250, b2Gain:-0.5, b2Q:1.5, b3Freq:2500, b3Gain:1.5, b3Q:0.9, b4Freq:10000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-20, ratio:3, knee:8, attack:8, release:100, makeup:2.5} },
    { type:'harmonicdrive',params:{ mode:1, drive:8, tone:0, mix:40, output:0 } },
    { type:'reverb',      params:{ size:1.3, decay:1.6, damping:60, predelay:20, mix:18 } },
    { type:'limiter',     params:{ threshold:-1, release:60, makeup:0 } }
  ],
  'vocal-female': [
    { type:'deesser',     params:{ frequency:7500, threshold:-22, ratio:3.5, attack:2, release:80, mix:100, output:0 } },
    { type:'eq',          params:{ b1Freq:120, b1Gain:-3, b1Q:0.8, b2Freq:350, b2Gain:-0.5, b2Q:1.5, b3Freq:3500, b3Gain:1, b3Q:0.9, b4Freq:12000, b4Gain:2, b4Q:0.7 } },
    { type:'compressor',  params:{ threshold:-22, ratio:2.5, knee:10, attack:10, release:130, makeup:2 } },
    { type:'exciter',     params:{ cutoff:6000, drive:30, mix:40, output:0 } },
    { type:'reverb',      params:{ size:1.5, decay:1.8, damping:50, predelay:22, mix:22 } },
    { type:'limiter',     params:{ threshold:-1, release:60, makeup:0 } }
  ],
  'choir': [
    { type:'deesser',     params:{ frequency:7000, threshold:-24, ratio:3, attack:5, release:150, mix:80, output:0 } },
    { type:'eq',          params:{ b1Freq:100, b1Gain:-2, b1Q:0.8, b2Freq:400, b2Gain:-1, b2Q:1.5, b3Freq:4000, b3Gain:1, b3Q:1.0, b4Freq:12000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-20, ratio:2,  knee:12, attack:20, release:200, makeup:1.5} },
    { type:'reverb',      params:{ size:2.5, decay:3,   damping:40, predelay:30, mix:30 } },
    { type:'widener',     params:{ width:15, monoBass:100, mix:70 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'rap': [
    { type:'deesser',     params:{ frequency:6500, threshold:-18, ratio:4, attack:3, release:80, mix:100, output:0 } },
    { type:'eq',          params:{ b1Freq:80,  b1Gain:-2, b1Q:0.8, b2Freq:300, b2Gain:-1, b2Q:1.5, b3Freq:3000, b3Gain:2, b3Q:0.9, b4Freq:10000, b4Gain:1, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-16, ratio:3,  knee:5,  attack:5,  release:80, makeup:3 } },
    { type:'limiter',     params:{ threshold:-1, release:50, makeup:0 } }
  ],

  // ── BATERÍAS ───────────────────────────────────────────────────
  'acoustic-drums': [
    { type:'gate',        params:{ threshold:-18, ratio:2,  attack:1,  release:100, hold:20 } },
    { type:'eq',          params:{ b1Freq:80,  b1Gain:1,  b1Q:1.0, b2Freq:400, b2Gain:-1, b2Q:1.2, b3Freq:3000, b3Gain:1.5, b3Q:1.2, b4Freq:10000, b4Gain:1, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-20, ratio:2,  knee:6,  attack:15, release:150, makeup:1.5} },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'studio-drums': [
    { type:'gate',        params:{ threshold:-16, ratio:3,  attack:1,  release:80,  hold:15 } },
    { type:'eq',          params:{ b1Freq:70,  b1Gain:1.5,b1Q:0.9, b2Freq:500, b2Gain:-1.5, b2Q:1.0, b3Freq:4000, b3Gain:1, b3Q:1.0, b4Freq:10000, b4Gain:0.5, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:6,  attack:20, release:180, makeup:2 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'vintage-drums': [
    { type:'gate',        params:{ threshold:-20, ratio:2,  attack:2,  release:120, hold:20 } },
    { type:'harmonicdrive',params:{ mode:1, drive:8, tone:0, mix:40, output:0 } },
    { type:'eq',          params:{ b1Freq:90,  b1Gain:1,  b1Q:0.8, b2Freq:350, b2Gain:-1, b2Q:1.1, b3Freq:3500, b3Gain:1, b3Q:1.0, b4Freq:10000, b4Gain:0, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-16, ratio:2,  knee:8,  attack:25, release:200, makeup:1.5} },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'jazz-drums': [
    { type:'gate',        params:{ threshold:-22, ratio:2,  attack:3,  release:150, hold:30 } },
    { type:'eq',          params:{ b1Freq:80,  b1Gain:0,  b1Q:1.0, b2Freq:300, b2Gain:-1, b2Q:1.0, b3Freq:5000, b3Gain:1.5, b3Q:1.2, b4Freq:12000, b4Gain:2, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-22, ratio:1.5,knee:10, attack:30, release:200, makeup:0.5} },
    { type:'exciter',     params:{ cutoff:6000, drive:20, mix:30, output:0 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'electronic-drums': [
    { type:'gate',        params:{ threshold:-15, ratio:3,  attack:1,  release:80,  hold:5 } },
    { type:'eq',          params:{ b1Freq:90,  b1Gain:1,  b1Q:0.8, b2Freq:500, b2Gain:-1, b2Q:1.0, b3Freq:4000, b3Gain:1, b3Q:1.0, b4Freq:10000, b4Gain:0, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2.5,knee:5,  attack:10, release:100, makeup:2 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'percussion': [
    { type:'gate',        params:{ threshold:-20, ratio:2,  attack:2,  release:120, hold:20 } },
    { type:'eq',          params:{ b1Freq:100, b1Gain:-1, b1Q:0.8, b2Freq:600, b2Gain:-1, b2Q:1.0, b3Freq:5000, b3Gain:1.5, b3Q:1.2, b4Freq:12000, b4Gain:1.5, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-20, ratio:1.5,knee:8,  attack:20, release:150, makeup:1.5} },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],

  // ── ORQUESTA ───────────────────────────────────────────────────
  'strings': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:-1, b1Q:0.8, b2Freq:400, b2Gain:-0.5, b2Q:1.5, b3Freq:4000, b3Gain:0.5, b3Q:1.0, b4Freq:12000, b4Gain:1, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-20, ratio:1.8,knee:12, attack:30, release:250, makeup:1 } },
    { type:'reverb',      params:{ size:2.5, decay:3,   damping:45, predelay:25, mix:28 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'brass': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:0.5,b1Q:0.9, b2Freq:400, b2Gain:-1, b2Q:1.2, b3Freq:3000, b3Gain:1,   b3Q:1.0, b4Freq:10000, b4Gain:0.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:8,  attack:15, release:150, makeup:1.5} },
    { type:'harmonicdrive',params:{ mode:1, drive:5, tone:1, mix:25, output:0 } },
    { type:'reverb',      params:{ size:1.8, decay:2,   damping:55, predelay:20, mix:20 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'woodwinds': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:-0.5,b1Q:0.9, b2Freq:350, b2Gain:-0.5, b2Q:1.5, b3Freq:4000, b3Gain:1, b3Q:1.0, b4Freq:12000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-20, ratio:2,  knee:10, attack:20, release:180, makeup:1 } },
    { type:'reverb',      params:{ size:1.5, decay:2,   damping:55, predelay:18, mix:22 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],

  // ── GÉNEROS MUSICALES ──────────────────────────────────────────
  'rock': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:1,  b1Q:1.0, b2Freq:400, b2Gain:-1, b2Q:1.2, b3Freq:3000, b3Gain:1, b3Q:1.0, b4Freq:10000, b4Gain:1, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-16, ratio:2.5,knee:6,  attack:15, release:150, makeup:2 } },
    { type:'harmonicdrive',params:{ mode:1, drive:8, tone:1,  mix:40, output:0 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'blues': [
    { type:'eq',          params:{ b1Freq:90,  b1Gain:1,  b1Q:0.9, b2Freq:350, b2Gain:-1, b2Q:1.0, b3Freq:3500, b3Gain:0.5, b3Q:1.0, b4Freq:10000, b4Gain:0.5, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:10, attack:20, release:180, makeup:1.5} },
    { type:'reverb',      params:{ size:1.5, decay:2,   damping:60, predelay:20, mix:25 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'country': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:1.5,b1Q:1.0, b2Freq:500, b2Gain:-1, b2Q:1.0, b3Freq:4000, b3Gain:1.5, b3Q:1.2, b4Freq:12000, b4Gain:1, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:8,  attack:15, release:150, makeup:2 } },
    { type:'exciter',     params:{ cutoff:5000, drive:25, mix:35, output:0 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'folk': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:0.5,b1Q:1.0, b2Freq:300, b2Gain:-1, b2Q:1.0, b3Freq:4000, b3Gain:1, b3Q:1.0, b4Freq:10000, b4Gain:0.5, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-20, ratio:1.5,knee:10, attack:25, release:200, makeup:1 } },
    { type:'reverb',      params:{ size:1.2, decay:1.8, damping:60, predelay:15, mix:22 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],
  'jazz': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:0,  b1Q:1.0, b2Freq:300, b2Gain:-1, b2Q:1.0, b3Freq:5000, b3Gain:1, b3Q:1.2, b4Freq:12000, b4Gain:1.5, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-22, ratio:1.5,knee:12, attack:30, release:200, makeup:0.5} },
    { type:'limiter',     params:{ threshold:-1, release:120, makeup:0 } }
  ],
  'urban': [
    { type:'eq',          params:{ b1Freq:55,  b1Gain:2,  b1Q:0.7, b2Freq:350, b2Gain:-1.5, b2Q:1.2, b3Freq:5000, b3Gain:1, b3Q:1.0, b4Freq:12000, b4Gain:1.5, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-12, ratio:3,  knee:5,  attack:8,  release:80,  makeup:3 } },
    { type:'multiband',   params:{ lowMidFreq:180, midHighFreq:3000, lowThreshold:-8, lowRatio:2.5, lowAttack:10, lowRelease:150, lowMakeup:2, midThreshold:-15, midRatio:2, midAttack:20, midRelease:100, midMakeup:0, highThreshold:-20, highRatio:1.5, highAttack:15, highRelease:80, highMakeup:0, outputGain:0 } },
    { type:'limiter',     params:{ threshold:-1, release:60,  makeup:0 } }
  ],
  'latino': [
    { type:'eq',          params:{ b1Freq:100, b1Gain:1,  b1Q:0.9, b2Freq:500, b2Gain:-1, b2Q:1.0, b3Freq:5000, b3Gain:1.5, b3Q:1.2, b4Freq:12000, b4Gain:2, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:6,  attack:15, release:150, makeup:2 } },
    { type:'exciter',     params:{ cutoff:6000, drive:30, mix:40, output:0 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'pop': [
    { type:'eq',          params:{ b1Freq:60,  b1Gain:0.5,b1Q:1.0, b2Freq:400, b2Gain:-1, b2Q:1.2, b3Freq:4000, b3Gain:1.5, b3Q:1.2, b4Freq:14000, b4Gain:2, b4Q:0.8 } },
    { type:'compressor',  params:{ threshold:-18, ratio:2,  knee:8,  attack:20, release:200, makeup:2 } },
    { type:'exciter',     params:{ cutoff:10000, drive:20, mix:30, output:0 } },
    { type:'widener',     params:{ width:12, monoBass:100, mix:65 } },
    { type:'limiter',     params:{ threshold:-1, release:80, makeup:0 } }
  ],
  'ballad': [
    { type:'eq',          params:{ b1Freq:80,  b1Gain:1,  b1Q:1.0, b2Freq:300, b2Gain:-1, b2Q:1.0, b3Freq:4000, b3Gain:1, b3Q:1.0, b4Freq:10000, b4Gain:1, b4Q:1.0 } },
    { type:'compressor',  params:{ threshold:-20, ratio:2,  knee:10, attack:25, release:200, makeup:1.5} },
    { type:'reverb',      params:{ size:2,   decay:2.5, damping:50, predelay:30, mix:28 } },
    { type:'limiter',     params:{ threshold:-1, release:100, makeup:0 } }
  ],

  // ── MASTERING ──────────────────────────────────────────────────
  'mastering': [
    // EQ sutil: limpiar rumble, ligera presencia, aire
    { type:'eq',          params:{ b1Freq:30,  b1Gain:-1.5, b1Q:0.7, b2Freq:250, b2Gain:-0.5, b2Q:1.8, b3Freq:3500, b3Gain:0.5, b3Q:1.5, b4Freq:14000, b4Gain:1, b4Q:0.8 } },
    // Compresor de bus muy transparente (ratio ≤ 1.5)
    { type:'compressor',  params:{ threshold:-10, ratio:1.3, knee:12, attack:40, release:400, makeup:0.5} },
    // Limitador a -1 dBTP (estándar streaming)
    { type:'limiter',     params:{ threshold:-1, release:120, makeup:0 } }
  ]
};
