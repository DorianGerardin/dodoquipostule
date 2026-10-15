import * as THREE from 'three';

// Détecte si le curseur est sur le micro (survol) ou si un clic l'a touché.
// Le raycast est limité à un test toutes les `interval` ms pour rester léger.
export class Picker {
  #raycaster = new THREE.Raycaster();
  #ndc = new THREE.Vector2();
  #point = null; // dernière position du curseur au-dessus du canvas
  #hovered = false;
  #lastCheck = -Infinity;

  constructor(canvas, camera, interval = 50) {
    this.canvas = canvas;
    this.camera = camera;
    this.interval = interval;
    this.object = null;

    canvas.addEventListener('pointermove', this.#onMove);
    canvas.addEventListener('pointerleave', this.#onLeave);
  }

  setObject(object) {
    this.object = object;
  }

  // Test immédiat : le point écran (clientX, clientY) touche-t-il le modèle ?
  // `padding` (px) élargit la zone : on teste aussi 4 points autour (utile au doigt).
  hit(clientX, clientY, padding = 0) {
    if (!this.object) return false;

    if (this.#hitAt(clientX, clientY)) return true;
    if (padding <= 0) return false;

    return (
        this.#hitAt(clientX + padding, clientY) ||
        this.#hitAt(clientX - padding, clientY) ||
        this.#hitAt(clientX, clientY + padding) ||
        this.#hitAt(clientX, clientY - padding)
    );
  }

  #hitAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.#ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.#raycaster.setFromCamera(this.#ndc, this.camera);
    return this.#raycaster.intersectObject(this.object, true).length > 0;
  }

  // À appeler à chaque frame avec l'horodatage courant (ms).
  isHovered(now) {
    if (!this.#point) return false;

    if (now - this.#lastCheck >= this.interval) {
      this.#lastCheck = now;
      this.#hovered = this.hit(this.#point.x, this.#point.y);
    }
    return this.#hovered;
  }

  dispose() {
    this.canvas.removeEventListener('pointermove', this.#onMove);
    this.canvas.removeEventListener('pointerleave', this.#onLeave);
  }

  #onMove = (e) => {
    if (e.pointerType === 'touch') return; // pas de survol au doigt
    this.#point = { x: e.clientX, y: e.clientY };
  };

  #onLeave = () => {
    this.#point = null;
    this.#hovered = false;
  };
}