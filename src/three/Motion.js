import { clamp01, damp, deg, easeOutCubic } from './math.js';

// Anime le groupe racine du micro : animation d'entrée, flottement, parallaxe,
// agrandissement au survol et secousse au tap. Tout est recalculé à chaque
// frame à partir de l'état, donc les effets se combinent sans se gêner.
export class Motion {
  #time = 0;
  #introTime = 0;
  #introStarted = false;
  #opacity = null;
  #tapTime = Infinity;
  #tapDirection = 1;
  #tapStrength = 1;
  #tapSpeed = 1;
  #hover = 0;

  constructor(target, canvas, config) {
    this.target = target; // groupe racine
    this.canvas = canvas;
    this.config = config;
    this.base = { x: config.model.offsetX, y: config.model.offsetY };
  }

  // 0 à 1 : intensité du survol (utilisée aussi pour le contre-jour)
  get hoverAmount() {
    return this.#hover;
  }

  startIntro() {
    this.#introStarted = true;
    this.#introTime = 0;
  }

  // Chaque tap tire au hasard un sens, une force et une vitesse (selon tap.variation)
  tap() {
    const v = this.config.tap.variation ?? 0;
    this.#tapTime = 0;
    this.#tapDirection = Math.random() < 0.5 ? -1 : 1;
    this.#tapStrength = 1 + (Math.random() * 2 - 1) * v;
    this.#tapSpeed = 1 + (Math.random() * 2 - 1) * v * 0.3;
  }

  // pointer : position lissée du curseur (-1 à 1) ; hovered : le micro est survolé
  update(dt, pointer, hovered) {
    const { intro, float, parallax, hover, tap } = this.config;
    this.#time += dt;

    // --- Animation d'entrée ---
    let progress = 1;
    if (intro.enabled) {
      if (this.#introStarted) this.#introTime += dt;
      progress = this.#introStarted
          ? clamp01((this.#introTime - intro.delay) / intro.duration)
          : 0;
    }
    const eased = easeOutCubic(progress);
    const introOffset = intro.enabled ? -intro.distance * (1 - eased) : 0;
    this.#setOpacity(intro.enabled && intro.fade ? eased : 1);

    // --- Flottement (n'apparaît qu'une fois l'entrée terminée) ---
    const bob = float.enabled
        ? Math.sin(this.#time * Math.PI * 2 * float.speed) * float.amplitude * eased
        : 0;

    // --- Parallaxe : le micro s'incline vers le curseur ---
    const parallaxX = parallax.enabled ? deg(-pointer.y * parallax.tiltX) : 0;
    const parallaxZ = parallax.enabled ? deg(-pointer.x * parallax.tiltZ) : 0;

    // --- Survol ---
    this.#hover = damp(this.#hover, hover.enabled && hovered ? 1 : 0, hover.speed, dt);
    const scale = 1 + (hover.scale - 1) * this.#hover;

    // --- Secousse au tap : oscillation amortie ---
    this.#tapTime += dt;
    let shake = 0;
    if (tap.enabled && this.#tapTime < tap.duration) {
      shake =
          Math.exp(-tap.decay * this.#tapTime) *
          Math.sin(Math.PI * 2 * tap.frequency * this.#tapSpeed * this.#tapTime) *
          deg(tap.amplitude) *
          this.#tapStrength *
          this.#tapDirection;
    }

    // --- Application ---
    this.target.position.set(this.base.x, this.base.y + introOffset + bob, 0);
    this.target.rotation.set(parallaxX + shake * 0.4, 0, parallaxZ + shake);
    this.target.scale.setScalar(scale);
  }

  #setOpacity(value) {
    if (value === this.#opacity) return;
    this.#opacity = value;
    this.canvas.style.opacity = String(value);
  }
}