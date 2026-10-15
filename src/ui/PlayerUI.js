import { clamp01 } from '../three/math.js';

const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

// Lecteur en forme de pilule : bouton pause/lecture à gauche, forme d'onde avec curseur
// de lecture à droite (cliquer ou glisser dessus pour avancer ou reculer).
// Créé en JavaScript et ajouté au parent (la section hero, qui doit être en position: relative).
export class PlayerUI {
  #peaks = null;
  #flat;
  #seeking = false;
  #visible = false;
  #playing = null;

  constructor(parent, config, audio) {
    this.parent = parent;
    this.config = config;
    this.audio = audio;
    this.#flat = new Float32Array(config.barCount).fill(0.15);

    this.el = document.createElement('div');
    this.el.className = 'player';
    this.el.style.setProperty('--player-from', config.from);
    this.el.style.setProperty('--player-to', config.to);
    this.el.style.setProperty('--player-width', `${config.width}px`);
    this.el.style.setProperty('--player-height', `${config.height}px`);
    this.el.innerHTML = `
      <div class="player__pill">
        <button class="player__toggle" type="button"></button>
        <canvas class="player__wave"></canvas>
      </div>`;
    parent.appendChild(this.el);

    this.button = this.el.querySelector('.player__toggle');
    this.canvas = this.el.querySelector('.player__wave');
    this.ctx = this.canvas.getContext('2d');
    this.#setIcon(false);

    this.button.addEventListener('click', this.#onToggle);
    this.canvas.addEventListener('pointerdown', this.#onSeekStart);
    this.canvas.addEventListener('pointermove', this.#onSeekMove);
    this.canvas.addEventListener('pointerup', this.#onSeekEnd);
    this.canvas.addEventListener('pointercancel', this.#onSeekEnd);
  }

  setPeaks(peaks) {
    this.#peaks = peaks;
  }

  // À appeler à chaque frame. anchor : position écran (px) du sommet du micro, ou null.
  update(anchor) {
    const active = this.audio.active;
    if (active !== this.#visible) {
      this.#visible = active;
      this.el.classList.toggle('is-visible', active);
    }

    if (anchor) this.#place(anchor);
    if (!active) return;

    const playing = this.audio.playing;
    if (playing !== this.#playing) {
      this.#playing = playing;
      this.#setIcon(playing);
    }
    this.#draw(this.audio.progress);
  }

  dispose() {
    this.button.removeEventListener('click', this.#onToggle);
    this.canvas.removeEventListener('pointerdown', this.#onSeekStart);
    this.canvas.removeEventListener('pointermove', this.#onSeekMove);
    this.canvas.removeEventListener('pointerup', this.#onSeekEnd);
    this.canvas.removeEventListener('pointercancel', this.#onSeekEnd);
    this.el.remove();
  }

  // --- interne ---

  // Centré au-dessus du point d'ancrage, sans sortir du parent
  #place({ x, y }) {
    const parent = this.parent.getBoundingClientRect();
    const half = this.el.offsetWidth / 2;
    const left = Math.min(Math.max(x - parent.left, half + 8), parent.width - half - 8);
    const top = y - parent.top - this.config.gap;
    this.el.style.transform = `translate3d(${left}px, ${top}px, 0) translate(-50%, -100%)`;
  }

  #setIcon(playing) {
    this.button.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    this.button.setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
  }

  #draw(progress) {
    const { canvas, ctx } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.config.bars;

    const peaks = this.#peaks ?? this.#flat;
    const count = peaks.length;
    const slot = w / count;
    const barW = Math.max(2 * dpr, slot * 0.5);

    // Barres : pleines pour la partie déjà jouée, atténuées pour la suite
    for (let i = 0; i < count; i++) {
      const barH = Math.max(4 * dpr, peaks[i] * h * 0.85);
      ctx.globalAlpha = (i + 0.5) / count <= progress ? 1 : 0.45;
      this.#bar(i * slot + (slot - barW) / 2, (h - barH) / 2, barW, barH);
    }

    // Curseur de lecture
    const cursorW = 3 * dpr;
    ctx.globalAlpha = 1;
    this.#bar(Math.min(Math.max(progress * w - cursorW / 2, 0), w - cursorW), h * 0.08, cursorW, h * 0.84);
  }

  #bar(x, y, w, h) {
    const { ctx } = this;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, w / 2);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  #seekTo(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.audio.seek(clamp01((e.clientX - rect.left) / rect.width));
  }

  #onToggle = () => this.audio.togglePause();

  #onSeekStart = (e) => {
    this.#seeking = true;
    this.canvas.setPointerCapture(e.pointerId);
    this.#seekTo(e);
  };

  #onSeekMove = (e) => {
    if (this.#seeking) this.#seekTo(e);
  };

  #onSeekEnd = (e) => {
    this.#seeking = false;
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
  };
}
