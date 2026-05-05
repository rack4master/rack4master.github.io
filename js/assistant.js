// js/assistant.js
//
// ANALISIS ESPECTRAL ROBUSTO
// --------------------------
// El bug anterior usaba OfflineAudioContext + AnalyserNode, que solo captura
// el ULTIMO chunk renderizado (silencio al final) → mismo resultado para todo audio.
//
// Solucion: FFT manual (Cooley-Tukey) aplicada sobre el PCM crudo en multiples
// ventanas solapadas → espectro promediado real de toda la pista.

// ---------------------------------------------------------------
// FFT Cooley-Tukey in-place (N debe ser potencia de 2)
// ---------------------------------------------------------------
function fft(re, im) {
  var N = re.length;
  // Bit-reversal permutation
  var j = 0;
  for (var i = 1; i < N; i++) {
    var bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      var t = re[i]; re[i] = re[j]; re[j] = t;
          t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  // Butterfly stages
  for (var len = 2; len <= N; len <<= 1) {
    var ang  = (-2 * Math.PI) / len;
    var wRe0 = Math.cos(ang);
    var wIm0 = Math.sin(ang);
    for (var ii = 0; ii < N; ii += len) {
      var curRe = 1.0, curIm = 0.0;
      var half = len >> 1;
      for (var k = 0; k < half; k++) {
        var uRe = re[ii + k];
        var uIm = im[ii + k];
        var vRe = re[ii + k + half] * curRe - im[ii + k + half] * curIm;
        var vIm = re[ii + k + half] * curIm + im[ii + k + half] * curRe;
        re[ii + k]        = uRe + vRe;
        im[ii + k]        = uIm + vIm;
        re[ii + k + half] = uRe - vRe;
        im[ii + k + half] = uIm - vIm;
        var newRe = curRe * wRe0 - curIm * wIm0;
        curIm = curRe * wIm0 + curIm * wRe0;
        curRe = newRe;
      }
    }
  }
}

// ---------------------------------------------------------------
// Ventana de Hann
// ---------------------------------------------------------------
function makeHann(N) {
  var w = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
  }
  return w;
}

// ---------------------------------------------------------------
// Espectro promediado con multiples ventanas solapadas (50% overlap)
// Devuelve magnitudes lineales promedio por bin
// ---------------------------------------------------------------
function computeAverageSpectrum(audioBuffer) {
  var FFT_SIZE = 4096;
  var HOP      = FFT_SIZE >> 1;       // 50% overlap
  var sr       = audioBuffer.sampleRate;
  var hann     = makeHann(FFT_SIZE);
  var nBins    = FFT_SIZE >> 1;

  // Mezcla mono (promedio de canales)
  var nSamples = audioBuffer.length;
  var nCh      = audioBuffer.numberOfChannels;
  var mono     = new Float32Array(nSamples);
  for (var c = 0; c < nCh; c++) {
    var ch = audioBuffer.getChannelData(c);
    for (var n = 0; n < nSamples; n++) mono[n] += ch[n] / nCh;
  }

  // Ignorar primeros y ultimos 3% (silencio de fade in/out)
  var start = Math.floor(nSamples * 0.03);
  var end   = Math.floor(nSamples * 0.97) - FFT_SIZE;

  var avgMag = new Float64Array(nBins);
  var frames = 0;
  var re     = new Float32Array(FFT_SIZE);
  var im     = new Float32Array(FFT_SIZE);

  for (var pos = start; pos < end; pos += HOP) {
    for (var i = 0; i < FFT_SIZE; i++) {
      re[i] = mono[pos + i] * hann[i];
      im[i] = 0;
    }
    fft(re, im);
    for (var b = 0; b < nBins; b++) {
      avgMag[b] += Math.sqrt(re[b] * re[b] + im[b] * im[b]);
    }
    frames++;
  }

  // Normalizar
  if (frames > 0) {
    for (var bi = 0; bi < nBins; bi++) avgMag[bi] /= frames;
  }

  return {
    avgMag   : avgMag,
    nBins    : nBins,
    sr       : sr,
    binWidth : sr / FFT_SIZE
  };
}

// ---------------------------------------------------------------
// Energia de banda en dB (RMS de magnitudes en el rango)
// ---------------------------------------------------------------
function bandDb(avgMag, binWidth, fLow, fHigh) {
  var i0 = Math.max(1, Math.round(fLow  / binWidth));
  var i1 = Math.min(avgMag.length - 1, Math.round(fHigh / binWidth));
  if (i0 > i1) return -120;
  var sum = 0, cnt = 0;
  for (var i = i0; i <= i1; i++) {
    sum += avgMag[i] * avgMag[i];
    cnt++;
  }
  if (sum <= 0 || cnt === 0) return -120;
  return 20 * Math.log10(Math.sqrt(sum / cnt));
}

// ---------------------------------------------------------------
// Pico espectral (frecuencia + nivel dB) dentro de una banda
// ---------------------------------------------------------------
function peakInBand(avgMag, binWidth, fLow, fHigh) {
  var i0 = Math.max(1, Math.round(fLow  / binWidth));
  var i1 = Math.min(avgMag.length - 1, Math.round(fHigh / binWidth));
  var bestVal = 0, bestIdx = i0;
  for (var i = i0; i <= i1; i++) {
    if (avgMag[i] > bestVal) { bestVal = avgMag[i]; bestIdx = i; }
  }
  return {
    freq  : bestIdx * binWidth,
    level : 20 * Math.log10(bestVal + 1e-12)
  };
}

// ---------------------------------------------------------------
// Stats temporales: RMS, Peak, Crest Factor
// ---------------------------------------------------------------
function temporalStats(audioBuffer) {
  var nCh = audioBuffer.numberOfChannels;
  var len = audioBuffer.length;
  var sumSq = 0, peak = 0;
  for (var c = 0; c < nCh; c++) {
    var ch = audioBuffer.getChannelData(c);
    for (var i = 0; i < len; i++) {
      var a = Math.abs(ch[i]);
      sumSq += ch[i] * ch[i];
      if (a > peak) peak = a;
    }
  }
  var rmsLin = Math.sqrt(sumSq / (len * nCh));
  var rmsDb  = 20 * Math.log10(rmsLin + 1e-12);
  var peakDb = 20 * Math.log10(peak   + 1e-12);
  return {
    rmsDb  : rmsDb,
    peakDb : peakDb,
    crest  : peakDb - rmsDb   // dB: >20 = muy dinamico, <10 = muy comprimido
  };
}

// ---------------------------------------------------------------
// Imagen estereo: width ratio y correlacion L-R
// ---------------------------------------------------------------
function stereoStats(audioBuffer) {
  if (audioBuffer.numberOfChannels < 2) {
    return { widthRatio: 0, correlation: 1.0 };
  }
  var L = audioBuffer.getChannelData(0);
  var R = audioBuffer.getChannelData(1);
  var midSq = 0, sideSq = 0, crossLR = 0, sqL = 0, sqR = 0;
  for (var i = 0; i < L.length; i++) {
    var m = (L[i] + R[i]) * 0.5;
    var s = (L[i] - R[i]) * 0.5;
    midSq  += m * m;
    sideSq += s * s;
    crossLR += L[i] * R[i];
    sqL += L[i] * L[i];
    sqR += R[i] * R[i];
  }
  var widthRatio  = Math.sqrt(sideSq / (midSq + 1e-12));
  var correlation = crossLR / (Math.sqrt(sqL * sqR) + 1e-12);
  return { widthRatio: widthRatio, correlation: correlation };
}

// ---------------------------------------------------------------
// ANALIZADOR PRINCIPAL – reglas inductivas
// ---------------------------------------------------------------
export async function analyzeAndRecommend(audioBuffer) {

  // --- Espectro promediado ---
  var spec     = computeAverageSpectrum(audioBuffer);
  var avgMag   = spec.avgMag;
  var binWidth = spec.binWidth;

  // --- Energias por banda (dB) ---
  var eSub     = bandDb(avgMag, binWidth,   20,   80);   // sub-graves
  var eBass    = bandDb(avgMag, binWidth,   80,  250);   // graves
  var eLowMid  = bandDb(avgMag, binWidth,  250,  500);   // bajos-medios
  var eMid     = bandDb(avgMag, binWidth,  500, 2000);   // medios
  var eHighMid = bandDb(avgMag, binWidth, 2000, 5000);   // medios-altos
  var ePres    = bandDb(avgMag, binWidth, 5000,10000);   // presencia / sibilancia
  var eAir     = bandDb(avgMag, binWidth,10000,20000);   // aire / brillo

  // Referencia: banda media de la pista (80 Hz – 8 kHz)
  var eRef     = bandDb(avgMag, binWidth,   80, 8000);

  // Deltas respecto a la referencia
  var dSub     = eSub     - eRef;
  var dBass    = eBass    - eRef;
  var dLowMid  = eLowMid  - eRef;
  var dMid     = eMid     - eRef;
  var dHighMid = eHighMid - eRef;
  var dPres    = ePres    - eRef;
  var dAir     = eAir     - eRef;

  // --- Stats temporales ---
  var tStats = temporalStats(audioBuffer);
  var rmsDb  = tStats.rmsDb;
  var peakDb = tStats.peakDb;
  var crest  = tStats.crest;

  // --- Estereo ---
  var sStats      = stereoStats(audioBuffer);
  var widthRatio  = sStats.widthRatio;
  var correlation = sStats.correlation;

  // --- Tilt espectral (balance grave/agudo) ---
  var eLow  = (eSub  + eBass)  / 2;
  var eHigh = (ePres + eAir)   / 2;
  var tilt  = eLow - eHigh;   // >0 = oscuro, <0 = brillante

  // --- Pico de sibilancia ---
  var sibPeak = peakInBand(avgMag, binWidth, 4000, 10000);
  var sibFreqRound = Math.round(sibPeak.freq / 100) * 100 || 7000;

  var problems = [];
  function add(reason, type, params) {
    problems.push({ type: type, params: params, reason: reason });
  }

  // ============================================================
  // REGLAS INDUCTIVAS
  // ============================================================

  // R1 – Subgraves excesivos → Filtro HP
  if (dSub > 6) {
    add(
      'Sub-graves excesivos (<80 Hz, +' + dSub.toFixed(1) + ' dB). Filtro HP recomendado.',
      'filter',
      { hpFreq: 40, hpQ: 0.7, hpOn: true, lpFreq: 18000, lpQ: 0.7, lpOn: false }
    );
  }

  // R2 – Exceso de graves → EQ corte
  if (dBass > 5 && dSub <= 6) {
    add(
      'Exceso de graves (80-250 Hz, +' + dBass.toFixed(1) + ' dB). Puede enmascarar los medios.',
      'eq',
      { band: 'low', freq: 120, gain: -3, q: 1.0 }
    );
  }

  // R3 – Barro en bajos-medios → EQ corte suave
  if (dLowMid > 4) {
    add(
      'Acumulacion en bajos-medios (250-500 Hz, +' + dLowMid.toFixed(1) + ' dB). Mezcla "embarrada".',
      'eq',
      { band: 'lowMid', freq: 350, gain: -2.5, q: 1.2 }
    );
  }

  // R4 – Caida en medios → EQ realce
  if (dMid < -6) {
    add(
      'Caida en medios (500 Hz – 2 kHz, ' + dMid.toFixed(1) + ' dB). Sonido hueco o sin cuerpo.',
      'eq',
      { band: 'mid', freq: 1000, gain: 2, q: 0.8 }
    );
  }

  // R5 – Exceso de medios-altos → EQ corte
  if (dHighMid > 5) {
    add(
      'Exceso de medios-altos (2-5 kHz, +' + dHighMid.toFixed(1) + ' dB). Puede resultar agresivo o fatigoso.',
      'eq',
      { band: 'highMid', freq: 3000, gain: -2, q: 1.0 }
    );
  }

  // R6 – Sibilancia / presencia → De-esser Pro
  if (dPres > 5) {
    add(
      'Sibilancia/exceso de presencia (5-10 kHz, +' + dPres.toFixed(1) + ' dB, pico ~' + sibFreqRound + ' Hz). De-esser Pro recomendado.',
      'deesserpro',
      { frequency: sibFreqRound, threshold: -16, ratio: 3, attack: 5, release: 150, mix: 100, output: 0 }
    );
  }

  // R7 – Falta de aire → Exciter
  if (dAir < -8 && eAir < -40) {
    add(
      'Falta de brillo/aire (>10 kHz, ' + dAir.toFixed(1) + ' dB bajo la media). Exciter armonico recomendado.',
      'exciter',
      { cutoff: 8000, drive: 40, mix: 45, output: 0 }
    );
  }

  // R8 – Exceso de aire → Filtro LP
  if (dAir > 7 && eAir > -30) {
    add(
      'Exceso de brillo/aire (>10 kHz, +' + dAir.toFixed(1) + ' dB). Filtro LP suave recomendado.',
      'filter',
      { hpFreq: 30, hpQ: 0.7, hpOn: false, lpFreq: 15000, lpQ: 0.7, lpOn: true }
    );
  }

  // R9 – Balance espectral muy oscuro → EQ shelf HF
  if (tilt > 12 && !problems.find(function(p) { return p.type === 'eq'; })) {
    add(
      'Balance espectral muy oscuro (graves ' + tilt.toFixed(1) + ' dB por encima de agudos). EQ de tilt recomendado.',
      'eq',
      { band: 'shelf_high', freq: 3000, gain: 2.5, q: 0.7 }
    );
  }

  // R10 – Balance espectral muy brillante → EQ shelf LF
  if (tilt < -8 && !problems.find(function(p) { return p.type === 'eq'; })) {
    add(
      'Balance espectral muy brillante (agudos ' + Math.abs(tilt).toFixed(1) + ' dB por encima de graves). EQ de tilt recomendado.',
      'eq',
      { band: 'shelf_low', freq: 300, gain: 1.5, q: 0.7 }
    );
  }

  // R11 – Nivel RMS elevado → Compresor suave
  if (rmsDb > -14) {
    add(
      'Nivel RMS elevado (' + rmsDb.toFixed(1) + ' dBFS). Compresor suave recomendado.',
      'compressor',
      { threshold: -14, ratio: 2.5, knee: 8, attack: 15, release: 180, makeup: 0 }
    );
  }

  // R12 – Señal muy dinamica (crest factor alto) → Compresor densidad
  if (crest > 20 && rmsDb < -18) {
    add(
      'Señal muy dinamica (crest factor: ' + crest.toFixed(1) + ' dB). Compresor de densidad recomendado.',
      'compressor',
      { threshold: -20, ratio: 3, knee: 6, attack: 10, release: 150, makeup: 3 }
    );
  }

  // R13 – Señal sobrecargada / muy comprimida (crest factor bajo) → Soft Clipper
  if (crest < 8 && rmsDb > -8) {
    add(
      'Señal excesivamente comprimida o limitada (crest factor: ' + crest.toFixed(1) + ' dB). Soft Clipper recomendado.',
      'softclipper',
      { threshold: -2, mix: 60, output: 0 }
    );
  }

  // R14 – Imagen estereo estrecha → Widener
  if (widthRatio < 0.12 && audioBuffer.numberOfChannels >= 2) {
    add(
      'Imagen estereo muy estrecha (width ratio: ' + widthRatio.toFixed(2) + '). Widener recomendado.',
      'widener',
      { width: 130, bass_mono: 100 }
    );
  }

  // R15 – Señal mono en fichero estereo → Widener
  if (correlation > 0.98 && audioBuffer.numberOfChannels >= 2) {
    add(
      'La señal es practica mente mono en ambos canales (correlacion: ' + correlation.toFixed(2) + '). Widener recomendado.',
      'widener',
      { width: 140, bass_mono: 100 }
    );
  }

  // R16 – Correlacion muy negativa → Problema de fase
  if (correlation < -0.3) {
    add(
      'Posible problema de fase entre canales (correlacion L-R: ' + correlation.toFixed(2) + '). Revisar con Mid/Side.',
      'midside',
      { midGain: 0, sideGain: 0 }
    );
  }

  // R17 – Pico cerca de 0 dBFS → Limitador de seguridad
  if (peakDb > -1.0) {
    add(
      'Pico maximo cerca del techo digital (' + peakDb.toFixed(1) + ' dBFS). Limitador de seguridad recomendado.',
      'limiter',
      { threshold: -1, release: 80, makeup: 0 }
    );
  }

  return problems;
}
