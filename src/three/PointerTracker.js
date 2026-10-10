import { damp } from './math.js';

// Suit le curseur sur toute la fenêtre (pas seulement sur le canvas).
// `value` va de -1 à 1 sur chaque axe (y positif = haut de l'écran) et est lissé.
export class PointerTracker {
  target = { x: 0, y: 0 };
  value = { x: 0, y: 0 };

  constructor(smoothing = 5) {
    this.smoothing = smoothing;
    window.addEventListener('pointermove', this.#onMove);
    document.documentElement.addEventListener('pointerleave', this.#onLeave);
  }

  update(dt) {
    this.value.x = damp(this.value.x, this.target.x, this.smoothing, dt);
    this.value.y = damp(this.value.y, this.target.y, this.smoothing, dt);
  }

  dispose() {
    window.removeEventListener('pointermove', this.#onMove);
    document.documentElement.removeEventListener('pointerleave', this.#onLeave);
  }

  #onMove = (e) => {
    if (e.pointerType === 'touch') return; // pas de parallaxe au doigt
    this.target.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.target.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  #onLeave = () => {
    this.target.x = 0;
    this.target.y = 0;
  };
}