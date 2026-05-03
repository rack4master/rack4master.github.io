// js/ui/knobs.js
import { clamp } from '../utils.js';

export function buildKnob(mod, key, pDef, color) {
  const wrap = document.createElement('div');
  wrap.className = 'knob-wrap';
  wrap.setAttribute('data-key', key);
  wrap.setAttribute('data-min', pDef.min);
  wrap.setAttribute('data-max', pDef.max);
  wrap.setAttribute('data-step', pDef.step);
  wrap.setAttribute('data-unit', pDef.unit);
  wrap.setAttribute('data-def', pDef.def);

  const knob = document.createElement('div');
  knob.className = 'knob';
  const ind = document.createElement('div');
  ind.className = 'knob-ind';
  const arc = document.createElement('div');
  arc.className = 'knob-arc';
  const val = document.createElement('div');
  val.className = 'knob-val';
  const lbl = document.createElement('div');
  lbl.className = 'knob-lbl';
  lbl.textContent = pDef.label;

  knob.appendChild(ind);
  knob.appendChild(arc);
  wrap.appendChild(knob);
  wrap.appendChild(val);
  wrap.appendChild(lbl);

  setKnobDisplay(knob, val, mod.params[key], pDef);

  const isDisabled = () => wrap.getAttribute('data-disabled') === 'true';

  let sy, sv;
  knob.addEventListener('mousedown', (e) => {
    if (isDisabled()) { e.preventDefault(); return; }
    e.preventDefault();
    sy = e.clientY;
    sv = mod.params[key];
    const range = pDef.max - pDef.min;
    const onMove = (ev) => {
      if (isDisabled()) return;
      const raw = sv + (sy - ev.clientY) * range / 240;
      const v = clamp(Math.round(raw / pDef.step) * pDef.step, pDef.min, pDef.max);
      if (window.applyParam) window.applyParam(mod, key, v);
      setKnobDisplay(knob, val, v, pDef);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  knob.addEventListener('wheel', (e) => {
    if (isDisabled()) { e.preventDefault(); return; }
    e.preventDefault();
    const v = clamp(mod.params[key] + Math.sign(-e.deltaY) * pDef.step, pDef.min, pDef.max);
    if (window.applyParam) window.applyParam(mod, key, v);
    setKnobDisplay(knob, val, v, pDef);
  }, { passive: false });
  knob.addEventListener('dblclick', (e) => {
    if (isDisabled()) { e.preventDefault(); return; }
    if (window.applyParam) window.applyParam(mod, key, pDef.def);
    setKnobDisplay(knob, val, pDef.def, pDef);
  });
  return wrap;
}

export function setKnobDisplay(knob, valEl, value, pDef) {
  const norm = (value - pDef.min) / (pDef.max - pDef.min);
  const ind = knob.querySelector('.knob-ind');
  if (ind) ind.style.transform = `rotate(${-135 + norm * 270}deg)`;
  let d;
  if (pDef.unit === 'Hz') d = value >= 1000 ? (value / 1000).toFixed(1) + 'k' : Math.round(value) + '';
  else if (pDef.unit === 'dB') d = (value >= 0 ? '+' : '') + value.toFixed(1);
  else if (pDef.unit === ':1') d = value.toFixed(1);
  else if (pDef.unit === 'ms') d = Math.round(value) + '';
  else if (pDef.unit === 's') d = value.toFixed(2);
  else if (pDef.unit === 'x') d = value.toFixed(1);
  else d = value.toFixed(2);
  valEl.textContent = d + (pDef.unit && pDef.unit !== ':1' ? ' ' + pDef.unit : (pDef.unit === ':1' ? ':1' : ''));
}

export function buildToggle(mod, key, pDef, color) {
  const wrap = document.createElement('div');
  wrap.className = 'tog-wrap';
  wrap.setAttribute('data-key', key);
  const tog = document.createElement('div');
  tog.className = 'tog' + (mod.params[key] ? ' on' : '');
  tog.style.setProperty('--mc', color);
  const val = document.createElement('div');
  val.className = 'tog-val';
  val.textContent = mod.params[key] ? 'ON' : 'OFF';
  const lbl = document.createElement('div');
  lbl.className = 'tog-lbl';
  lbl.textContent = pDef.label;

  const isDisabled = () => wrap.getAttribute('data-disabled') === 'true';

  tog.addEventListener('click', (e) => {
    if (isDisabled()) { e.preventDefault(); return; }
    const v = !mod.params[key];
    if (window.applyParam) window.applyParam(mod, key, v);
    tog.classList.toggle('on', v);
    val.textContent = v ? 'ON' : 'OFF';
  });
  wrap.appendChild(tog);
  wrap.appendChild(val);
  wrap.appendChild(lbl);
  return wrap;
}

export function updateToggleDisplay(toggleWrap, value) {
  const tog = toggleWrap.querySelector('.tog');
  const valEl = toggleWrap.querySelector('.tog-val');
  if (tog && valEl) {
    if (value) {
      tog.classList.add('on');
      valEl.textContent = 'ON';
    } else {
      tog.classList.remove('on');
      valEl.textContent = 'OFF';
    }
  }
}
