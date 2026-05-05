# RACK4MASTER – Free Effects Chain for Audio Mastering

**RACK4MASTER** is a professional web‑based audio mastering rack that runs entirely in your browser.  
It allows you to load any audio file, build a custom chain of processors (dynamics, filters, spatial effects, saturation, etc.), adjust parameters in real time, and export the processed audio as a WAV file.

AND MOST IMPORTANTLY... IT'S COMPLETELY FREE!

<img src="pic.png" alt="Rack4master screenshot" width="600" />
<img src="pic2.png" alt="Rack4master screenshot 2" width="600" />

(NOTE: No data is sent to any server – everything happens locally on your machine).

## 🌟 Support the project

If you find RACK4MASTER useful, **help us grow** by giving a star on GitHub:

[![GitHub Repo stars](https://img.shields.io/github/stars/your-username/rack4master?style=social)](https://github.com/your-username/rack4master)

You can also [donate via PayPal](https://www.paypal.com/donate?business=73KKE6DVSJ8WY&no_recurring=1&currency_code=EUR) to keep improving the tool.

## ✨ Features

- **Load any audio** (WAV, MP3, etc.) via drag & drop or file picker.
- **Interactive waveform** with click‑to‑seek, loop handles, and real‑time playback position.
- **18 built‑in audio modules**:
  - Dynamics: Gate, Compressor, Limiter, Tremolo, De‑esser (classic), De‑esser Pro, Multiband Compressor.
  - Filters: HP/LP Filter, 4‑band Equalizer.
  - Spatial: Chorus, Flanger, Reverb, Delay, Widener, Mid/Side.
  - Saturation: Saturator, Soft Clipper, Harmonic Exciter.
- **A/B comparison slots** – maintain two independent mastering chains and switch between them instantly.
- **Solo mode** – isolate a single module to hear its effect alone, available on both thumbnails and module cards.
- **Spectrum analyzer** – real‑time frequency visualization with bar/line modes and labeled axes (Hz / dB).
- **Intelligent analysis assistant** – automatically detects frequency imbalances and recommends a custom mastering chain.
- **Modular signal chain** – drag & drop modules from the sidebar to the chain area, reorder them, bypass individually or globally.
- **Full parameter control** via analog‑style knobs and toggles, with real‑time audio processing.
- **Module presets** (where available) for quick setup.
- **30+ instrument & genre presets** – optimized chains for acoustic/classical/electric guitars, pianos, Rhodes, synths, male/female vocals, choirs, rap, acoustic/studio/vintage/jazz/electronic drums, percussion, strings, brass, woodwinds, and mixes by genre (Rock, Blues, Country, Folk, Jazz, Urban, Latino, Pop, Ballad, Mastering).
- **Preset system** – save / load your entire chain (including both A/B slots) + loop settings + output gain.
- **Export** the processed audio as a 16‑bit WAV file (offline rendering, respects the whole chain and bypass states).
- **Professional dithering** – Triangular PDF dithering applied on export to 16-bit WAV, eliminating quantization distortion.
- **VU meters** with peak hold and LUFS approximation.
- **Global bypass** to compare processed vs. raw audio instantly.
- **Dark / Light theme** and multilingual UI (English, Spanish, Catalan) – no external dependencies for translations.
- **100% client‑side** – no tracking, no data collection.

---

## 🚀 How to Use

### 1. Load an audio file
Drag & drop a file onto the waveform area, or click the waveform and select a file.  
The waveform will be drawn, and the transport controls become active.

### 2. Build your processing chain
- Open the **right sidebar** (MÓDULOS DEL RACK).  
- Click the `⊕` button of any module to add it to the chain.  
- You can also drag a module from the sidebar directly into the chain area.  
- Modules are processed from left to right (INPUT → module 1 → module 2 → ... → OUTPUT).  
- Rearrange modules by dragging their thumbnails (drag handle `⠿`).

### 3. Edit module parameters
- Click on any thumbnail in the chain area to open its editor in the central panel.  
- Adjust knobs, toggles, or select a preset. Changes are heard immediately.
- Use the **S** button on any module thumbnail or card to solo it – all other modules will be temporarily bypassed.

### 4. A/B comparison (two chains)
- Use the **A** and **B** buttons in the chain toolbar to maintain two independent mastering setups.
- The first time you switch to an empty slot, you'll be asked whether to copy the current chain.
- Switching between A and B is instant — the app remembers both configurations automatically.
- When saving a preset, **both slots** are stored in the JSON file.

### 5. Spectrum analyzer & intelligent recommendations
- Click the **▼ SPECTRUM** toggle to open the frequency analyzer panel (200px high).
- Switch between **bar** and **line** mode with the button in the top‑right corner.
- The graph displays frequency labels (Hz) and amplitude labels (dB) for precise reading.
- Press **🔍 ANALYZE & RECOMMEND** to scan the full audio file.
- Detected issues (sub‑bass excess, resonance peaks, sibilance, lack of air, etc.) appear in the right panel.
- Click **APPLY SUGGESTED CHAIN** to replace your current modules with the custom‑tailored mastering chain.

### 6. Bypass
- Each module has a `BYP` button on its thumbnail and in its editor. Click to toggle bypass (LED turns red).  
- The **Global Bypass** button (in the chain toolbar) disables all modules at once for A/B comparison.

### 7. Transport & Loop
- Play / Pause / Stop buttons.  
- Enable loop and drag the loop handles in the waveform to set start/end points.  
- Click anywhere on the waveform to seek.

### 8. Output gain & metering
- Adjust the output gain knob (right sidebar) to increase or decrease final level.  
- The VU meters show approximate loudness (RMS) and peak values. Click `RST PICO` to reset peak indicators.

### 9. Save / Load your project
- Use `↓ GUARDAR` to save a JSON preset containing module chain (both A/B slots), all parameters, loop settings, and output gain.  
- Use `↑ CARGAR` to load a previously saved preset.

### 10. Export processed audio
- Click the **WAV** button. The app will render the entire chain offline and download a 16‑bit stereo WAV file.

### 11. Instrument & genre presets
- The dropdown in the header offers ready‑made chains for 35+ sources:
  - Guitars (6), Pianos/Keys (4), Vocals (5), Drums/Percussion (6), Orchestral (3), Mix by Genre (Rock, Blues, Country, Folk, Jazz, Urban, Latino, Pop, Ballad, Mastering).

---

## 🛠 Built With

- **Web Audio API** – real‑time audio processing graph.
- **Sortable.js** – drag & drop reordering of modules.
- **Canvas API** – waveform drawing and overlays.
- **Google Fonts** – Orbitron, Rajdhani, Share Tech Mono.
- **No frameworks** – vanilla JavaScript modules.

---

## 📧 Contact & Support

For questions, suggestions or bug reports, please contact:

**Author:** Francesc Llorens Cerdà

**Email:** rackmaster@proton.me

---

## ⚠️ License & Legal

Rack4Master is a free, open source software under a MIT Licence.
This software is provided "as is", without warranty of any kind.  
You must own or have permission to use the audio files you process.  
All rights reserved. © 2026

---

## 🙌 Acknowledgments

- Inspired by classic analog mastering consoles and modular racks.
- Thanks to the Web Audio API community for making real‑time audio in the browser possible.

  ---

## 💰 Donate

If you find RACK4MASTER useful, you can support the project with a donation:

[![Donate with PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/donate?business=73KKE6DVSJ8WY&no_recurring=1&currency_code=EUR)
