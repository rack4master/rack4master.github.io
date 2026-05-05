// js/ui/card.js
import { buildKnob, buildToggle, setKnobDisplay, updateToggleDisplay } from './knobs.js';

export function buildModuleCard(mod) {
  const def = window.MODULE_DEFS[mod.type];
  if (!def) return document.createElement('div');

  const translatedLabel = (window.getTranslation && window.getTranslation('mod.' + mod.type)) || def.label;
  const color = def.color;
  const card = document.createElement('div');
  card.className = 'mod-card' + (def.wide ? ' is-wide' : '');
  card.dataset.id = mod.id;
  card.style.setProperty('--mc', color);

  const strip = document.createElement('div');
  strip.className = 'mod-strip';
  card.appendChild(strip);

  const hd = document.createElement('div');
  hd.className = 'mod-hd';
  hd.style.cssText = 'flex-wrap: wrap; gap: 6px;';

  const led = document.createElement('div');
  led.className = 'mod-led';
  led.id = `led-${mod.id}`;
  const titleSpan = document.createElement('span');
  titleSpan.className = 'mod-title';
  titleSpan.textContent = translatedLabel;
  const bypassBtn = document.createElement('button');
  bypassBtn.className = 'btn-byp';
  bypassBtn.dataset.id = mod.id;
  bypassBtn.textContent = mod.bypassed ? 'ON' : 'BYP';

  const soloBtn = document.createElement('button');
  soloBtn.className = 'btn-byp btn-solo';
  soloBtn.dataset.id = mod.id;
  soloBtn.textContent = 'S';
  soloBtn.title = 'Escuchar solo este módulo';

  hd.appendChild(led);
  hd.appendChild(titleSpan);
  hd.appendChild(bypassBtn);
  hd.appendChild(soloBtn);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = '↺';
  resetBtn.title = 'Reset to defaults';
  resetBtn.className = 'btn-reset';
  resetBtn.style.cssText = 'background: var(--surf2); border: 1px solid var(--brd); color: var(--tx2); border-radius: 4px; padding: 4px 8px; font-size: 13px; cursor: pointer; font-weight: bold;';
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mod.bypassed || window.globalBypass) return;
    if (window.resetModuleParams) window.resetModuleParams(mod.id);
  });
  hd.appendChild(resetBtn);

  const infoBtn = document.createElement('button');
  infoBtn.textContent = 'ⓘ';
  infoBtn.title = 'Información del módulo';
  infoBtn.className = 'btn-info';
  infoBtn.style.cssText = 'background: transparent; border: none; color: var(--tx3); font-size: 14px; font-weight: bold; cursor: pointer; transition: color 0.15s;';
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.showModuleInfo) window.showModuleInfo(mod.type);
  });

  const presetSelect = document.createElement('select');
  presetSelect.className = 'mod-preset-select';
  presetSelect.style.cssText = 'background: var(--surf2); border: 1px solid var(--brd); color: var(--tx); border-radius: 3px; padding: 0 6px; height: 26px; font-size: 11px; cursor: pointer; max-width: 120px;';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Presets';
  presetSelect.appendChild(defaultOption);

  if (def.presets) {
    Object.keys(def.presets).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      presetSelect.appendChild(opt);
    });
  }

  presetSelect.addEventListener('change', (e) => {
    e.stopPropagation();
    const presetName = e.target.value;
    if (!presetName) return;
    const preset = def.presets[presetName];
    if (!preset) return;

    for (const [key, value] of Object.entries(preset)) {
      if (mod.params[key] !== undefined) {
        window.applyParam(mod, key, value);
      }
    }

    const knobWraps = card.querySelectorAll('.knob-wrap');
    knobWraps.forEach(wrap => {
      const key = wrap.getAttribute('data-key');
      if (key && mod.params[key] !== undefined) {
        const value = mod.params[key];
        const min = parseFloat(wrap.getAttribute('data-min'));
        const max = parseFloat(wrap.getAttribute('data-max'));
        const step = parseFloat(wrap.getAttribute('data-step'));
        const unit = wrap.getAttribute('data-unit');
        const pDef = { min, max, step, unit };
        const knob = wrap.querySelector('.knob');
        const valEl = wrap.querySelector('.knob-val');
        if (knob && valEl && window.setKnobDisplay) {
          window.setKnobDisplay(knob, valEl, value, pDef);
        }
      }
    });

    const toggleWraps = card.querySelectorAll('.tog-wrap');
    toggleWraps.forEach(wrap => {
      const key = wrap.getAttribute('data-key');
      if (key && mod.params[key] !== undefined) {
        updateToggleDisplay(wrap, mod.params[key]);
      }
    });

    presetSelect.value = presetName;
  });

  const rightGroup = document.createElement('div');
  rightGroup.style.cssText = 'margin-left: auto; display: flex; gap: 8px; align-items: center;';
  rightGroup.appendChild(presetSelect);
  rightGroup.appendChild(infoBtn);
  hd.appendChild(rightGroup);

  card.appendChild(hd);

  const body = document.createElement('div');
  body.className = 'mod-body';

  // --- SOPORTE PARA INTERFAZ PERSONALIZADA POR MÓDULO (nueva arquitectura) ---
  if (def.buildUI) {
    const customUI = def.buildUI(mod);
    body.appendChild(customUI);
    card.appendChild(body);

    bypassBtn.addEventListener('click', () => {
      if (window.toggleBypass) window.toggleBypass(mod.id);
    });
    soloBtn.addEventListener('click', () => {
      if (window.toggleSolo) window.toggleSolo(mod.id);
    });
    mod.presetSelect = presetSelect;
    return card;
  }

  // --------------------------------------------------------
  // CASO ESPECIAL: EQ 4‑BAND (por ahora sin curva, solo knobs)
  // --------------------------------------------------------
  if (mod.type === 'eq') {
    const bands = def.bands || [];
    bands.forEach(band => {
      const col = document.createElement('div');
      col.className = 'band-col';
      const sep = document.createElement('div');
      sep.className = 'band-sep';
      sep.textContent = band.label;
      col.appendChild(sep);
      ['Freq', 'Gain', 'Q'].forEach(s => {
        const key = band.prefix + s;
        if (def.params[key]) {
          col.appendChild(buildKnob(mod, key, def.params[key], color));
        }
      });
      body.appendChild(col);
    });
  }
  else if (mod.type === 'filter') {
    const c1 = document.createElement('div');
    c1.className = 'band-col';
    const s1 = document.createElement('div');
    s1.className = 'band-sep';
    s1.textContent = 'HIGH-PASS';
    c1.appendChild(s1);
    c1.appendChild(buildKnob(mod, 'hpFreq', def.params.hpFreq, color));
    c1.appendChild(buildKnob(mod, 'hpQ', def.params.hpQ, color));
    c1.appendChild(buildToggle(mod, 'hpOn', def.params.hpOn, color));
    body.appendChild(c1);

    const c2 = document.createElement('div');
    c2.className = 'band-col';
    const s2 = document.createElement('div');
    s2.className = 'band-sep';
    s2.textContent = 'LOW-PASS';
    c2.appendChild(s2);
    c2.appendChild(buildKnob(mod, 'lpFreq', def.params.lpFreq, color));
    c2.appendChild(buildKnob(mod, 'lpQ', def.params.lpQ, color));
    c2.appendChild(buildToggle(mod, 'lpOn', def.params.lpOn, color));
    body.appendChild(c2);
  }
  else if (def.bands) {
    body.classList.add('multiband-layout');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '16px';
    body.style.alignItems = 'center';

    const bandsContainer = document.createElement('div');
    bandsContainer.style.display = 'flex';
    bandsContainer.style.flexDirection = 'row';
    bandsContainer.style.flexWrap = 'wrap';
    bandsContainer.style.gap = '20px';
    bandsContainer.style.justifyContent = 'center';

    def.bands.forEach(band => {
      const bandRow = document.createElement('div');
      bandRow.className = 'band-row';
      bandRow.style.display = 'flex';
      bandRow.style.flexDirection = 'row';
      bandRow.style.gap = '8px';
      bandRow.style.alignItems = 'center';
      bandRow.style.backgroundColor = 'var(--surf2)';
      bandRow.style.padding = '8px 12px';
      bandRow.style.borderRadius = '6px';
      bandRow.style.border = '1px solid var(--brd)';

      const bandLabel = document.createElement('div');
      bandLabel.className = 'band-sep';
      bandLabel.textContent = band.name;
      bandLabel.style.writingMode = 'horizontal-tb';
      bandLabel.style.marginRight = '8px';
      bandLabel.style.fontWeight = 'bold';
      bandLabel.style.color = 'var(--amber)';
      bandRow.appendChild(bandLabel);

      band.keys.forEach(key => {
        if (def.params[key]) {
          bandRow.appendChild(buildKnob(mod, key, def.params[key], color));
        }
      });
      bandsContainer.appendChild(bandRow);
    });

    body.appendChild(bandsContainer);

    if (def.generalParams && def.generalParams.length) {
      const generalRow = document.createElement('div');
      generalRow.className = 'knob-row';
      generalRow.style.display = 'flex';
      generalRow.style.flexWrap = 'wrap';
      generalRow.style.gap = '12px';
      generalRow.style.justifyContent = 'center';
      generalRow.style.marginTop = '4px';
      def.generalParams.forEach(key => {
        if (def.params[key]) {
          generalRow.appendChild(buildKnob(mod, key, def.params[key], color));
        }
      });
      body.appendChild(generalRow);
    }
  }
  else {
    body.style.display = 'flex';
    body.style.flexWrap = 'wrap';
    body.style.gap = '16px';
    body.style.justifyContent = 'center';
    Object.entries(def.params).forEach(([key, pDef]) => {
      body.appendChild(buildKnob(mod, key, pDef, color));
    });
  }

  card.appendChild(body);

  bypassBtn.addEventListener('click', () => {
    if (window.toggleBypass) window.toggleBypass(mod.id);
  });
  soloBtn.addEventListener('click', () => {
    if (window.toggleSolo) window.toggleSolo(mod.id);
  });

  mod.presetSelect = presetSelect;

  return card;
}
