// js/modules/filter.js
export const label = 'FILTRO HP/LP';
export const color = '#00d4b0';

export const params = {
  hpFreq: { label:'HP FREQ', min:10, max:2000, def:80, step:1, unit:'Hz' },
  hpQ: { label:'HP Q', min:0.1, max:18, def:0.7, step:0.05, unit:'' },
  hpOn: { label:'HP ON', type:'toggle', def:true },
  lpFreq: { label:'LP FREQ', min:1000, max:22000, def:18000, step:10, unit:'Hz' },
  lpQ: { label:'LP Q', min:0.1, max:18, def:0.7, step:0.05, unit:'' },
  lpOn: { label:'LP ON', type:'toggle', def:true }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = params.hpOn ? params.hpFreq : 10;
  hp.Q.value = params.hpQ;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = params.lpOn ? params.lpFreq : 22050;
  lp.Q.value = params.lpQ;
  input.connect(hp);
  hp.connect(lp);
  lp.connect(output);
  return { input, output, hp, lp };
}

export function updateParam(nodes, key, value, currentTime, params) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'hpFreq':
      r(nodes.hp.frequency, value);
      break;
    case 'hpQ':
      r(nodes.hp.Q, value);
      break;
    case 'hpOn':
      // Si se activa, usar el valor actual de hpFreq; si se desactiva, poner 10 Hz
      r(nodes.hp.frequency, value ? params.hpFreq : 10);
      break;
    case 'lpFreq':
      r(nodes.lp.frequency, value);
      break;
    case 'lpQ':
      r(nodes.lp.Q, value);
      break;
    case 'lpOn':
      // Si se activa, usar el valor actual de lpFreq; si se desactiva, poner 22050 Hz
      r(nodes.lp.frequency, value ? params.lpFreq : 22050);
      break;
  }
}

export const presets = {
  'Default': { hpFreq: 80, hpQ: 0.7, hpOn: true, lpFreq: 18000, lpQ: 0.7, lpOn: true },
  'Vocal HP': { hpFreq: 120, hpQ: 0.8, hpOn: true, lpFreq: 16000, lpQ: 0.7, lpOn: true },
  'Bass Cut': { hpFreq: 60, hpQ: 0.7, hpOn: true, lpFreq: 20000, lpQ: 0.7, lpOn: false },
  'Hi-Fi': { hpFreq: 30, hpQ: 0.6, hpOn: true, lpFreq: 20000, lpQ: 0.6, lpOn: true },
  'Telephone': { hpFreq: 300, hpQ: 1.2, hpOn: true, lpFreq: 4000, lpQ: 1.2, lpOn: true },
  'Sub Only': { hpFreq: 20, hpQ: 0.5, hpOn: true, lpFreq: 120, lpQ: 0.8, lpOn: true },
  'Air Boost': { hpFreq: 80, hpQ: 0.7, hpOn: true, lpFreq: 10000, lpQ: 0.9, lpOn: true }
};
