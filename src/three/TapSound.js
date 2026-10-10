// Facteur aléatoire autour de 1 : jitter(0.1) donne une valeur entre 0.9 et 1.1
const jitter = (amount) => 1 + (Math.random() * 2 - 1) * amount;

// Son du tap sur le micro. Sans fichier audio, un « toc » de micro est synthétisé
// avec Web Audio (aucun asset à charger). Avec `url`, ton fichier est utilisé.
// `variation` règle l'aléatoire : 0 = toujours identique, 1 = très variable.
export class TapSound {
  #ctx = null;
  #buffer = null;
  #raw = null;

  constructor({ enabled = true, volume = 0.25, pitch = 1, variation = 0.25, url = null } = {}) {
    this.enabled = enabled;
    this.volume = volume;
    this.pitch = pitch;
    this.variation = variation;
    this.url = url;

    if (enabled && url) {
      this.#raw = fetch(url)
          .then((r) => r.arrayBuffer())
          .catch(() => null);
    }
  }

  async play() {
    if (!this.enabled) return;

    // Le contexte audio est créé au premier tap : les navigateurs exigent
    // un geste de l'utilisateur avant de produire du son.
    this.#ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.#ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    if (this.url) {
      this.#buffer ??= await this.#decode(ctx);
      if (this.#buffer) {
        this.#playBuffer(ctx);
        return;
      }
    }
    this.#playSynth(ctx);
  }

  async #decode(ctx) {
    try {
      const data = await this.#raw;
      return data ? await ctx.decodeAudioData(data) : null;
    } catch {
      return null;
    }
  }

  #playBuffer(ctx) {
    const v = this.variation;
    const source = ctx.createBufferSource();
    source.buffer = this.#buffer;
    source.playbackRate.value = jitter(0.2 * v); // vitesse (donc hauteur) légèrement différente

    const gain = ctx.createGain();
    gain.gain.value = this.volume * jitter(0.5 * v);

    source.connect(gain).connect(ctx.destination);
    source.start();
  }

  // Un tap de micro classique = trois couches très courtes superposées
  #playSynth(ctx) {
    const t = ctx.currentTime;
    const v = this.variation;
    const p = this.pitch * jitter(0.3 * v); // hauteur différente à chaque tap

    const master = ctx.createGain();
    master.gain.value = this.volume * jitter(0.5 * v);
    master.connect(ctx.destination);

    // 1. Corps : thump grave dont la fréquence chute vite
    this.#tone(ctx, master, t, { from: 220 * p, to: 70 * p, decay: 0.22 * jitter(0.3 * v), gain: 1 });

    // 2. Souffle de la bonnette : bruit grave et étouffé
    this.#noise(ctx, master, t, { duration: 0.18, type: 'lowpass', frequency: 500 * p, gain: 0.5 * jitter(v) });

    // 3. « Tok » du doigt : claquement très bref
    this.#noise(ctx, master, t, { duration: 0.012, type: 'bandpass', frequency: 2200 * p * jitter(0.3 * v), gain: 0.35 * jitter(v) });
  }

  #tone(ctx, dest, t, { from, to, decay, gain }) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + decay * 0.5);

    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    osc.connect(env).connect(dest);
    osc.start(t);
    osc.stop(t + decay + 0.02);
  }

  #noise(ctx, dest, t, { duration, type, frequency, gain }) {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;

    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    source.connect(filter).connect(env).connect(dest);
    source.start(t);
  }
}