// js/modules/defs.js
// ACTUALIZADO: de 19 módulos a 15.
// Eliminados: chorus, flanger (→ modulation), saturator, softclipper (→ harmonicdrive),
//             deesserpro (fusionado en deesser).
// Añadidos: modulation, harmonicdrive.

import * as gate         from './gate.js';
import * as compressor   from './compressor.js';
import * as limiter      from './limiter.js';
import * as filter       from './filter.js';
import * as eq           from './eq.js';
import * as deesser      from './deesser.js';        // ahora dinámico (ex-Pro)
import * as multiband    from './multiband.js';
import * as reverb       from './reverb.js';
import * as delay        from './delay.js';
import * as modulation   from './modulation.js';     // ex-chorus + ex-flanger
import * as harmonicdrive from './harmonicdrive.js'; // ex-saturator + ex-softclipper
import * as exciter      from './exciter.js';
import * as widener      from './widener.js';
import * as midside      from './midside.js';
import * as tremolo      from './tremolo.js';

export const MODULE_DEFS = {
  gate,
  compressor,
  limiter,
  filter,
  eq,
  deesser,
  multiband,
  reverb,
  delay,
  modulation,
  harmonicdrive,
  exciter,
  widener,
  midside,
  tremolo
};

// Mapa de migración para presets guardados con nombres de módulos anteriores.
// Usado en main.js → loadPresetFromFile para compatibilidad hacia atrás.
export const MODULE_MIGRATION = {
  'chorus':      'modulation',
  'flanger':     'modulation',
  'saturator':   'harmonicdrive',
  'softclipper': 'harmonicdrive',
  'deesserpro':  'deesser'
};
