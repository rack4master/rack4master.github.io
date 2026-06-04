// js/modules/gate.js
// CORREGIDO: implementación con ScriptProcessorNode (downward expander real)
// El DynamicsCompressor original era un compresor ENCIMA del threshold,
// que es lo opuesto a una puerta de ruido (que atenúa POR DEBAJO del threshold).

export const label = 'PUERTA DE RUIDO';
export const color = '#4488ff';

export const params = {
  threshold: { label:'THRESH',  min:-96, max:0,    def:-40, step:0.5, unit:'dB' },
  ratio:     { label:'RATIO',   min:1,   max:20,   def:12,  step:0.1, unit:':1' },
  attack:    { label:'ATTACK',  min:0.1, max:200,  def:5,   step:0.5, unit:'ms' },
  release:   { label:'RELEASE', min:10,  max:2000, def:150, step:1,   unit:'ms' },
  hold:      { label:'HOLD',    min:0,   max:500,  def:50,  step:1,   unit:'ms' }
};

export function buildNodes(ctx, params) {
  const input  = ctx.createGain();
  const output = ctx.createGain();
  const sr     = ctx.sampleRate;
  const BUF    = 512;

  // ScriptProcessorNode: downward expander con envelope follower
  // (deprecado pero soportado en todos los navegadores y en OfflineAudioContext)
  const gate = ctx.createScriptProcessor(BUF, 2, 2);

  gate._thresh  = Math.pow(10, params.threshold / 20);
  gate._ratio   = params.ratio;
  gate._attack  = Math.exp(-1 / (sr * Math.max(0.0001, params.attack  / 1000)));
  gate._release = Math.exp(-1 / (sr * Math.max(0.0001, params.release / 1000)));
  gate._hold    = Math.round(sr * (params.hold / 1000));
  gate._holdCnt = 0;
  gate._env     = 0;   // envelope follower (lineal)
  gate._gainSmooth = 0; // ganancia suavizada

  gate.onaudioprocess = function(e) {
    const nCh = e.inputBuffer.numberOfChannels;
    const n   = e.inputBuffer.getChannelData(0).length;

    // Calcular pico de amplitud del bloque (todos los canales)
    let peak = 0;
    for (let c = 0; c < nCh; c++) {
      const d = e.inputBuffer.getChannelData(c);
      for (let i = 0; i < n; i++) {
        const a = Math.abs(d[i]);
        if (a > peak) peak = a;
      }
    }

    // Envelope follower: peak detector con attack/release
    if (peak > gate._env) {
      gate._env = gate._attack  * gate._env + (1 - gate._attack)  * peak;
    } else {
      gate._env = gate._release * gate._env + (1 - gate._release) * peak;
    }

    // Lógica de apertura con hold
    let targetGain;
    if (gate._env >= gate._thresh) {
      gate._holdCnt = gate._hold;
      targetGain = 1.0;
    } else if (gate._holdCnt > 0) {
      gate._holdCnt -= n;
      targetGain = 1.0;
    } else {
      // Downward expansion: G = (env/thresh)^(ratio-1)  cuando env < thresh
      const ratio = Math.max(1, gate._ratio - 1);
      targetGain = Math.pow(Math.max(1e-12, gate._env) / gate._thresh, ratio);
    }

    // Suavizar la ganancia con el coeficiente correspondiente
    if (targetGain >= gate._gainSmooth) {
      gate._gainSmooth = gate._attack  * gate._gainSmooth + (1 - gate._attack)  * targetGain;
    } else {
      gate._gainSmooth = gate._release * gate._gainSmooth + (1 - gate._release) * targetGain;
    }

    const g = Math.max(0, Math.min(1, gate._gainSmooth));

    // Aplicar ganancia a todos los canales
    for (let c = 0; c < nCh; c++) {
      const inp = e.inputBuffer.getChannelData(c);
      const out = e.outputBuffer.getChannelData(c);
      for (let i = 0; i < n; i++) out[i] = inp[i] * g;
    }
  };

  input.connect(gate);
  gate.connect(output);

  return { input, output, gate };
}

export function updateParam(nodes, key, value, currentTime) {
  const g  = nodes.gate;
  const sr = window.audioCtx?.sampleRate || 44100;
  if (!g) return;
  switch (key) {
    case 'threshold': g._thresh  = Math.pow(10, value / 20); break;
    case 'ratio':     g._ratio   = value; break;
    case 'attack':    g._attack  = Math.exp(-1 / (sr * Math.max(0.0001, value / 1000))); break;
    case 'release':   g._release = Math.exp(-1 / (sr * Math.max(0.0001, value / 1000))); break;
    case 'hold':      g._hold    = Math.round(sr * (value / 1000)); break;
  }
}

export const presets = {
  'Default':      { threshold:-40, ratio:12, attack:5,   release:150, hold:50  },
  'Fast Gate':    { threshold:-50, ratio:15, attack:1,   release:50,  hold:10  },
  'Slow Release': { threshold:-35, ratio:10, attack:10,  release:400, hold:100 },
  'Hard Gate':    { threshold:-45, ratio:20, attack:0.5, release:80,  hold:5   },
  'Drum Gate':    { threshold:-30, ratio:8,  attack:2,   release:150, hold:30  },
  'Vocal Gate':   { threshold:-55, ratio:12, attack:8,   release:200, hold:80  },
  'Bass Gate':    { threshold:-40, ratio:10, attack:20,  release:300, hold:60  }
};
