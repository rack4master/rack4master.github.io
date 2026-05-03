// js/modules/widener.js
export const label = 'WIDENER';
export const color = '#44ccff';

export const params = {
  width: { label:'WIDTH', min:0, max:30, def:10, step:0.5, unit:'ms' },
  mix: { label:'MIX', min:0, max:100, def:100, step:1, unit:'%' }
};

export function buildNodes(ctx, params) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const split = ctx.createChannelSplitter(2);
  const dlyR = ctx.createDelay(0.05);
  const dryG = ctx.createGain();
  const wetG = ctx.createGain();
  const wetMerge = ctx.createChannelMerger(2);
  dryG.gain.value = 1 - params.mix / 100;
  wetG.gain.value = params.mix / 100;
  dlyR.delayTime.value = params.width / 1000;
  input.connect(dryG);
  dryG.connect(output);
  input.connect(split);
  split.connect(wetMerge, 0, 0);
  split.connect(dlyR, 0);
  dlyR.connect(wetMerge, 0, 1);
  wetMerge.connect(wetG);
  wetG.connect(output);
  return { input, output, dryG, wetG, split, dlyR, wetMerge };
}

export function updateParam(nodes, key, value, currentTime) {
  const r = (node, val) => node.setTargetAtTime(val, currentTime, 0.008);
  switch (key) {
    case 'width': r(nodes.dlyR.delayTime, value / 1000); break;
    case 'mix':
      r(nodes.wetG.gain, value / 100);
      r(nodes.dryG.gain, 1 - value / 100);
      break;
  }
}

export const presets = {
  'Default': { width: 10, mix: 100 },
  'Subtle': { width: 5, mix: 60 },
  'Medium': { width: 12, mix: 80 },
  'Wide': { width: 20, mix: 100 },
  'Extreme': { width: 30, mix: 100 },
  'Half Mix': { width: 15, mix: 50 },
  'Mono Compatible': { width: 8, mix: 70 }
};
