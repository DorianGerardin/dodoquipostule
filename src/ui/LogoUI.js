import { damp } from '../three/math.js';

const TOP_MARGIN = 16; // px laissés libres en haut de la section

// Logo affiché au-dessus du micro. Il s'accroche au sommet du micro (il suit donc son
// flottement), apparaît avec une animation d'entrée, puis se balance très légèrement.
// Quand le lecteur audio s'ouvre, il glisse vers le haut pour lui laisser la place.
// Créé en JavaScript et ajouté au parent (la section hero, en position: relative).
export class LogoUI {
  #ready = false;
  #triggered = false;
  #shift = 0;
  #maxHeight = -1;

  constructor(parent, config) {
    this.parent = parent;
    this.config = config;

    this.el = document.createElement('div');
    this.el.className = 'logo';
    if (config.width) this.el.style.setProperty('--logo-width', config.width);
    if (config.mobileWidth) this.el.style.setProperty('--logo-width-mobile', config.mobileWidth);

    this.img = new Image();
    this.img.className = 'logo__img';
    this.img.alt = config.alt ?? '';
    this.img.decoding = 'async';
    this.img.draggable = false;
    this.img.addEventListener('load', () => {
      this.#ready = true;
    });
    this.img.addEventListener('error', () => {
      console.error(`Logo introuvable : ${config.url}`);
    });
    this.img.src = config.url;

    this.el.appendChild(this.img);
    parent.appendChild(this.el);
  }

  // anchor : position écran (px) du sommet du micro, ou null
  // introProgress : avancement de l'entrée du micro, de 0 à 1
  // shift : px dont on remonte le logo (place du lecteur audio)
  update(anchor, dt, introProgress, shift = 0) {
    // L'animation d'apparition démarre quand l'image est chargée et le micro bien avancé
    if (!this.#triggered && this.#ready && introProgress >= (this.config.appearAt ?? 0.7)) {
      this.#triggered = true;
      this.el.classList.add('is-in');
    }
    if (!anchor || !this.#ready) return;

    this.#shift = damp(this.#shift, shift, 10, dt);

    const parent = this.parent.getBoundingClientRect();
    const y = anchor.y - parent.top - (this.config.gap ?? 16);

    // La place disponible au-dessus du micro limite la hauteur du logo : il reste entier
    // quelle que soit la taille de l'écran. Quand le lecteur audio s'ouvre, le logo remonte
    // et rétrécit en douceur pour lui laisser la place.
    const maxHeight = Math.max(0, Math.floor(y - this.#shift - TOP_MARGIN));
    if (maxHeight !== this.#maxHeight) {
      this.#maxHeight = maxHeight;
      this.img.style.maxHeight = `${maxHeight}px`;
    }

    // Centré au-dessus du micro, sans sortir du parent
    const half = this.el.offsetWidth / 2;
    const left = Math.min(Math.max(anchor.x - parent.left, half + 8), parent.width - half - 8);
    this.el.style.transform = `translate3d(${left}px, ${y - this.#shift}px, 0) translate(-50%, -100%)`;
  }

  dispose() {
    this.el.remove();
  }
}