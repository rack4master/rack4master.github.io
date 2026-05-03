// js/modules/delay.js
export const label = 'DELAY';
export const color = '#ffcc33';

export const params = {
  time: { label:'TIME', min:10, max:1000, def:250, step:1, unit:'ms' },
  feedback: { label:'FEEDBK', min:0, max:95, def:40, step:1, unit:'%' },
  tone: { label:'TONE', min:500, max:8000, def:3500, step:50, unit:'Hz' },
  mix: { label:'MIX', min:0, max:100, def:30, step:1, unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const dlyNode = ctx.createDelay(2.0);
  const fbGain = ctx.createGain();
  const toneF = ctx.createBiquadFilter();
  toneF.type = 'lowpass';
  dry.gain.value = 1 - params.mix / 100;
  wet.gain.value = params.mix / 100;
  dlyNode.delayTime.value = params.time / 1000;
  fbGain.gain.value = params.feedback / 100;
  toneF.frequency.value = params.tone;
  input.connect(dry);
  input.connect(dlyNode);
  dlyNode.connect(toneF);
  toneF.connect(fbGain);
  fbGain.connect(dlyNode);
  toneF.connect(wet);
  dry.connect(output);
  wet.connect(output);
  return { input, output, dry, wet, dlyNode, fbGain, toneF };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'time': r(nodes.dlyNode.delayTime, value / 1000); break;
    case 'feedback': r(nodes.fbGain.gain, value / 100); break;
    case 'tone': r(nodes.toneF.frequency, value); break;
    case 'mix':
      r(nodes.wet.gain, value / 100);
      r(nodes.dry.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default': { time: 250, feedback: 40, tone: 3500, mix: 30 },
  'Slapback': { time: 120, feedback: 20, tone: 4000, mix: 35 },
  'Long Echo': { time: 600, feedback: 50, tone: 3000, mix: 40 },
  'Tape Delay': { time: 350, feedback: 60, tone: 2500, mix: 45 },
  'Ping Pong': { time: 400, feedback: 45, tone: 5000, mix: 40 },
  'Ambient': { time: 800, feedback: 30, tone: 6000, mix: 25 },
  'Short Repeat': { time: 80, feedback: 25, tone: 4500, mix: 30 }
};
