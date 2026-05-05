// js/ui/thumb.js
export function buildModuleThumb(mod) {
  const def = window.MODULE_DEFS[mod.type];
  const translatedLabel = (window.getTranslation && window.getTranslation('mod.' + mod.type)) || def.label;
  const thumb = document.createElement('div');
  thumb.className = 'mod-thumb';
  thumb.dataset.id = mod.id;
  thumb.style.setProperty('--mc', def.color);

  const led = document.createElement('div');
  led.className = 'power-led';

  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.textContent = '⠿';

  const title = document.createElement('div');
  title.className = 'thumb-title';
  title.textContent = translatedLabel;

  const paramsText = Object.values(def.params).slice(0, 3).map(p => p.label).join(' · ');
  const paramsSpan = document.createElement('div');
  paramsSpan.className = 'thumb-params';
  paramsSpan.textContent = paramsText;

  const simButtons = document.createElement('div');
  simButtons.className = 'thumb-simulated-buttons';
  for (let i = 0; i < 3; i++) {
    const btn = document.createElement('div');
    btn.className = 'sim-btn';
    simButtons.appendChild(btn);
  }

  const controls = document.createElement('div');
  controls.className = 'thumb-controls';

  const bypassBtn = document.createElement('button');
  bypassBtn.className = 'thumb-btn byp-btn';
  bypassBtn.dataset.id = mod.id;
  bypassBtn.textContent = mod.bypassed ? 'ON' : 'BYP';

  // --- Nuevo botón SOLO ---
  const soloBtn = document.createElement('button');
  soloBtn.className = 'thumb-btn solo-btn';
  soloBtn.dataset.id = mod.id;
  soloBtn.textContent = 'S';
  soloBtn.title = 'Solo (escuchar solo este módulo)';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'thumb-btn rm-btn';
  removeBtn.dataset.id = mod.id;
  removeBtn.textContent = '✕';

  controls.appendChild(bypassBtn);
  controls.appendChild(soloBtn);   // añadido entre BYP y ✕
  controls.appendChild(removeBtn);

  thumb.appendChild(led);
  thumb.appendChild(dragHandle);
  thumb.appendChild(title);
  thumb.appendChild(paramsSpan);
  thumb.appendChild(simButtons);
  thumb.appendChild(controls);

  thumb.addEventListener('click', (e) => {
    if (!e.target.classList.contains('thumb-btn')) {
      if (window.setActiveModule) window.setActiveModule(mod.id);
    }
  });
  bypassBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.toggleBypass) window.toggleBypass(mod.id);
  });
  soloBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.toggleSolo) window.toggleSolo(mod.id);
  });
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.removeModule) window.removeModule(mod.id);
  });

  return thumb;
}
