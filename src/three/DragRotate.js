export class DragRotate {
  #dragging = false;
  #lastX = 0;
  #velocity = 0;

  constructor(element, target, { speed, friction }) {
    this.element = element;
    this.target = target;
    this.speed = speed;
    this.friction = friction;

    element.addEventListener('pointerdown', this.#onDown);
    element.addEventListener('pointermove', this.#onMove);
    element.addEventListener('pointerup', this.#onUp);
    element.addEventListener('pointercancel', this.#onUp);
  }

  // À appeler à chaque frame : applique l'inertie
  update() {
    if (this.#dragging) return;
    this.target.rotation.y += this.#velocity;
    this.#velocity *= this.friction;
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.#onDown);
    this.element.removeEventListener('pointermove', this.#onMove);
    this.element.removeEventListener('pointerup', this.#onUp);
    this.element.removeEventListener('pointercancel', this.#onUp);
  }

  #onDown = (e) => {
    this.#dragging = true;
    this.#lastX = e.clientX;
    this.#velocity = 0;
    this.element.setPointerCapture(e.pointerId);
  };

  #onMove = (e) => {
    if (!this.#dragging) return;
    const dx = e.clientX - this.#lastX; // seul le mouvement horizontal compte
    this.#lastX = e.clientX;
    this.#velocity = dx * this.speed;
    this.target.rotation.y += this.#velocity;
  };

  #onUp = (e) => {
    this.#dragging = false;
    this.element.releasePointerCapture(e.pointerId);
  };
}