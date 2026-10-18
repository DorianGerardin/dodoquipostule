// Flèche arrondie dessinée à la main : la pointe est en bas à gauche, la queue en haut à droite.
const ARROW = `
  <div class="hint__arrow">
    <svg viewBox="0 0 100 76" aria-hidden="true">
      <path d="M92 6 C70 34 44 54 8 62"/>
      <path d="M24.6 68.9 L8 62 L20.1 48.7"/>
    </svg>
  </div>`;

// Repères dans le dessin de la flèche (en fraction de sa largeur et de sa hauteur)
const TIP_X = 8 / 100;  // pointe
const TIP_Y = 62 / 76;
const TAIL_Y = 6 / 76;  // extrémité droite (la queue), là où le texte commence

// Indice « Clique sur le micro » : une flèche arrondie et un texte à côté du micro.
// Il apparaît une fois l'entrée du micro terminée, et disparaît au premier clic sur le micro.
// Créé en JavaScript et ajouté au parent (la section hero, en position: relative).
export class HintUI {
  #triggered = false;
  #dismissed = false;
  #origin = '';
  #margins = '';

  constructor(parent, config) {
    this.parent = parent;
    this.config = config;

    this.el = document.createElement('div');
    this.el.className = 'hint';
    this.el.setAttribute('aria-hidden', 'true'); // indice décoratif
    if (config.color) this.el.style.setProperty('--hint-color', config.color);
    if (config.size) this.el.style.setProperty('--hint-size', config.size);
    if (config.mobileSize) this.el.style.setProperty('--hint-size-mobile', config.mobileSize);
    if (config.delay != null) this.el.style.setProperty('--hint-delay', `${config.delay}s`);

    this.el.innerHTML = `<div class="hint__inner">${ARROW}<span class="hint__text"></span></div>`;
    this.arrow = this.el.querySelector('.hint__arrow');
    this.text = this.el.querySelector('.hint__text');
    this.text.textContent = config.text ?? '';
    parent.appendChild(this.el);
  }

  // anchor : position écran (px) où doit se poser la pointe de la flèche ; introProgress : 0 à 1
  update(anchor, introProgress) {
    if (!this.#triggered && !this.#dismissed && introProgress >= 1) {
      this.#triggered = true;
      this.el.classList.add('is-in');
    }
    if (!anchor) return;

    // La queue de la flèche (son côté droit) doit être au milieu du texte, quel que soit le
    // nombre de lignes. On mesure la hauteur réelle du texte, puis on descend la flèche
    // (texte plus haut qu'elle) ou le texte (texte très court).
    const arrowH = this.arrow.offsetHeight;
    const delta = this.text.offsetHeight / 2 - arrowH * TAIL_Y;
    const arrowTop = Math.max(0, delta);
    const textTop = Math.max(0, -delta);

    const margins = `${arrowTop.toFixed(1)}/${textTop.toFixed(1)}`;
    if (margins !== this.#margins) {
      this.#margins = margins;
      this.arrow.style.marginTop = `${arrowTop}px`;
      this.text.style.marginTop = `${textTop}px`;
    }

    // Position de la pointe dans le composant
    const tipX = this.arrow.offsetWidth * TIP_X;
    const tipY = arrowTop + arrowH * TIP_Y;

    // L'animation d'apparition grandit à partir de la pointe
    const origin = `${tipX.toFixed(1)}px ${tipY.toFixed(1)}px`;
    if (origin !== this.#origin) {
      this.#origin = origin;
      this.el.style.setProperty('--hint-origin', origin);
    }

    // La pointe se pose sur le point d'ancrage, sans que le composant sorte du parent
    const parent = this.parent.getBoundingClientRect();
    const left = Math.min(Math.max(anchor.x - parent.left - tipX, 8), parent.width - this.el.offsetWidth - 8);
    const top = Math.max(anchor.y - parent.top - tipY, 8);
    this.el.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  // Appelé au premier clic sur le micro : l'indice disparaît et ne revient pas
  dismiss() {
    if (this.#dismissed) return;
    this.#dismissed = true;
    this.el.classList.add('is-gone');
  }

  dispose() {
    this.el.remove();
  }
}