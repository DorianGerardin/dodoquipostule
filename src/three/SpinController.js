import { damp, deg, easeInOutCubic, shortestAngle } from './math.js';

const TAP_MAX_MOVE = 6;         // px : au-delà, c'est un glissé et non un tap
const TAP_MAX_TIME = 350;       // ms
const DOUBLE_TAP_DELAY = 350;   // ms entre deux taps
const DOUBLE_TAP_DISTANCE = 30; // px entre deux taps

// Gère la rotation du micro autour de l'axe vertical global :
// glissé horizontal, inertie, rotation lente au repos, retour par double-clic.
export class SpinController {
  #dragging = false;
  #lastX = 0;
  #lastTime = 0;
  #velocity = 0;   // rad/s
  #idleTimer = 0;
  #idleBlend = 0;  // 0 = pas de rotation au repos, 1 = pleine vitesse
  #tween = null;   // retour animé à l'angle de départ
  #down = null;    // infos du dernier appui, pour distinguer tap et glissé
  #lastTap = null;

  constructor(element, target, config, { startAngle = 0, onTap = null } = {}) {
    this.element = element;
    this.target = target; // objet 3D dont on fait varier rotation.y
    this.config = config;
    this.startAngle = startAngle;
    this.onTap = onTap;

    element.addEventListener('pointerdown', this.#onDown);
    element.addEventListener('pointermove', this.#onMove);
    element.addEventListener('pointerup', this.#onUp);
    element.addEventListener('pointercancel', this.#onUp);
  }

  // À appeler à chaque frame, avec dt en secondes.
  update(dt) {
    if (this.#tween) {
      this.#updateTween(dt);
      return;
    }
    if (this.#dragging) return;

    const { idle, inertiaDamping } = this.config;

    this.#idleTimer += dt;
    const idleTarget = idle.enabled && this.#idleTimer >= idle.delay ? 1 : 0;
    this.#idleBlend = damp(this.#idleBlend, idleTarget, 1.5, dt);

    const idleVelocity = deg(idle.speed) * this.#idleBlend;
    this.target.rotation.y += (this.#velocity + idleVelocity) * dt;

    // Freinage exponentiel : même durée quel que soit le framerate
    this.#velocity *= Math.exp(-inertiaDamping * dt);
  }

  returnToStart() {
    const from = this.target.rotation.y;
    const delta = shortestAngle(this.startAngle - from);
    this.#velocity = 0;
    this.#idleBlend = 0;
    this.#idleTimer = 0;
    this.#tween = { from, delta, t: 0 };
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.#onDown);
    this.element.removeEventListener('pointermove', this.#onMove);
    this.element.removeEventListener('pointerup', this.#onUp);
    this.element.removeEventListener('pointercancel', this.#onUp);
  }

  // --- interne ---

  #updateTween(dt) {
    const tween = this.#tween;
    tween.t += dt / this.config.doubleClick.duration;

    const k = easeInOutCubic(Math.min(tween.t, 1));
    this.target.rotation.y = tween.from + tween.delta * k;

    if (tween.t >= 1) {
      this.#tween = null;
      this.#idleTimer = 0;
    }
  }

  #onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // clic gauche seulement

    this.#dragging = true;
    this.#tween = null;
    this.#velocity = 0;
    this.#idleTimer = 0;
    this.#idleBlend = 0;

    this.#lastX = e.clientX;
    this.#lastTime = e.timeStamp;
    this.#down = { x: e.clientX, y: e.clientY, time: e.timeStamp, moved: false };

    this.element.setPointerCapture(e.pointerId);
  };

  #onMove = (e) => {
    if (!this.#dragging) return;

    const dx = e.clientX - this.#lastX;
    const dtMs = e.timeStamp - this.#lastTime;
    this.#lastX = e.clientX;
    this.#lastTime = e.timeStamp;

    if (Math.hypot(e.clientX - this.#down.x, e.clientY - this.#down.y) > TAP_MAX_MOVE) {
      this.#down.moved = true;
    }

    // Sensibilité proportionnelle à la largeur : même geste = même rotation
    // sur mobile et sur grand écran.
    const angle = (dx / this.element.clientWidth) * deg(this.config.degreesPerWidth);
    this.target.rotation.y += angle;

    // Vitesse mesurée en rad/s (indépendante du framerate), légèrement lissée
    if (dtMs >= 1) {
      const instant = angle / (dtMs / 1000);
      this.#velocity = this.#velocity * 0.6 + instant * 0.4;
    }
  };

  #onUp = (e) => {
    if (!this.#dragging) return;

    this.#dragging = false;
    this.#idleTimer = 0;

    if (this.element.hasPointerCapture(e.pointerId)) {
      this.element.releasePointerCapture(e.pointerId);
    }

    // Si on s'est arrêté avant de lâcher, pas de lancer
    if (e.timeStamp - this.#lastTime > 80) this.#velocity = 0;

    if (e.type === 'pointerup') this.#detectTap(e);
  };

  #detectTap(e) {
    const down = this.#down;
    if (!down || down.moved || e.timeStamp - down.time > TAP_MAX_TIME) {
      this.#lastTap = null;
      return;
    }

    const prev = this.#lastTap;
    const isDouble =
        prev &&
        e.timeStamp - prev.time < DOUBLE_TAP_DELAY &&
        Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_DISTANCE;

    if (isDouble && this.config.doubleClick.enabled) {
      this.#lastTap = null;
      this.returnToStart();
      return;
    }

    this.#lastTap = { x: e.clientX, y: e.clientY, time: e.timeStamp };
    this.onTap?.(e.clientX, e.clientY);
  }
}