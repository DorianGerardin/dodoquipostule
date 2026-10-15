import { clamp01, damp } from './math.js';

const FFT_SIZE = 512;
const BASS_BINS = 4; // environ 0 à 375 Hz : grosse caisse et basses

// Découpe le morceau en `count` tranches et mesure l'énergie de chacune (0 à 1).
async function computePeaks(blob, count) {
  const buffer = await blob.arrayBuffer();
  const decoded = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(buffer);
  const data = decoded.getChannelData(0);
  const size = Math.floor(data.length / count);
  const stride = Math.max(1, Math.floor(size / 400));

  const peaks = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    let samples = 0;
    for (let j = i * size; j < (i + 1) * size; j += stride) {
      sum += Math.abs(data[j]);
      samples++;
    }
    peaks[i] = samples ? sum / samples : 0;
  }

  const max = Math.max(...peaks) || 1;
  return peaks.map((p) => (p / max) ** 0.7); // courbe qui relève un peu les petites valeurs
}

// Lecture du morceau + analyse du son.
// `active` = une session est en cours (du 1er clic sur le micro au 2e) : le lecteur est affiché,
// que le son soit en lecture ou en pause.
export class AudioPlayer {
  active = false;
  level = 0;      // énergie des basses, lissée, de 0 à 1 : fait réagir le micro
  peaks = null;   // forme d'onde du morceau, pour le dessin du lecteur

  #audio = null;
  #ctx = null;
  #analyser = null;
  #bins = null;
  #ready = null;
  #url = null;

  constructor(config) {
    this.config = config;
  }

  get playing() {
    const a = this.#audio;
    return !!a && !a.paused && !a.ended;
  }

  get progress() {
    const a = this.#audio;
    return a && a.duration ? a.currentTime / a.duration : 0;
  }

  // Télécharge le fichier, calcule la forme d'onde et prépare la lecture (une seule fois).
  load() {
    this.#ready ??= this.#load();
    return this.#ready;
  }

  // 1er clic sur le micro : démarre depuis le début et affiche le lecteur.
  async start() {
    this.active = true;
    try {
      await this.load();
    } catch (err) {
      this.active = false;
      console.error('Audio :', err);
      return;
    }
    if (!this.active) return; // un 2e clic est arrivé pendant le chargement

    this.#ensureGraph();
    this.#audio.currentTime = 0;
    await this.#ctx.resume();
    await this.#audio.play().catch(() => {});
  }

  // 2e clic sur le micro : arrête, remet au début et cache le lecteur.
  stop() {
    this.active = false;
    if (this.#audio) {
      this.#audio.pause();
      this.#audio.currentTime = 0;
    }
  }

  // Bouton pause / lecture du lecteur.
  togglePause() {
    if (!this.#audio) return;
    if (this.#audio.paused) {
      this.#ctx?.resume();
      this.#audio.play().catch(() => {});
    } else {
      this.#audio.pause();
    }
  }

  // ratio : 0 = début, 1 = fin
  seek(ratio) {
    if (this.#audio?.duration) this.#audio.currentTime = clamp01(ratio) * this.#audio.duration;
  }

  // À appeler à chaque frame : mesure l'énergie des basses.
  update(dt) {
    const { sensitivity, attack, release } = this.config.reaction;

    let target = 0;
    if (this.playing && this.#analyser) {
      this.#analyser.getByteFrequencyData(this.#bins);
      let sum = 0;
      for (let i = 0; i < BASS_BINS; i++) sum += this.#bins[i];
      target = clamp01((sum / BASS_BINS / 255) * sensitivity);
    }

    // Montée rapide, retombée plus lente : le micro « tape » sur les coups
    this.level = damp(this.level, target, target > this.level ? attack : release, dt);
  }

  dispose() {
    this.stop();
    this.#ctx?.close();
    if (this.#url) URL.revokeObjectURL(this.#url);
  }

  // --- interne ---

  async #load() {
    const { url, volume, loop, player } = this.config;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fichier audio introuvable : ${url}`);
    const blob = await response.blob();
    if (blob.type.startsWith('text/')) throw new Error(`${url} n'est pas un fichier audio (chemin faux ?)`);

    try {
      this.peaks = await computePeaks(blob, player.barCount);
    } catch {
      this.peaks = null; // le lecteur affichera des barres plates
    }

    this.#url = URL.createObjectURL(blob);
    const audio = new Audio(this.#url);
    audio.loop = loop;
    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
    });
    this.#audio = audio;
    this.volume = volume;

    return this.peaks;
  }

  // Le contexte audio n'est créé qu'au premier clic (exigé par les navigateurs).
  #ensureGraph() {
    if (this.#ctx) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(this.#audio);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = this.volume;

    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);

    this.#ctx = ctx;
    this.#analyser = analyser;
    this.#bins = new Uint8Array(analyser.frequencyBinCount);
  }
}
