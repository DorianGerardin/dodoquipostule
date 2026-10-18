import { clamp01, damp } from './math.js';

// Mesure de combien l'énergie des basses dépasse sa moyenne récente :
// 0 entre les coups, proche de 1 sur un gros coup. Fonctionne quel que soit le volume
// ou le mixage du morceau, car on compare le son à lui-même.
export class BeatFollower {
  #avg = 0;
  #peak = 0;
  #started = false;

  // raw : énergie des basses, de 0 à 1 ; active : le son est en lecture
  update(raw, dt, active) {
    if (active && !this.#started) {
      // Départ à la valeur courante : pas de grosse pulsation à l'instant du play
      this.#avg = raw;
      this.#peak = raw;
    }
    this.#started = active;

    this.#avg = damp(this.#avg, raw, 1.5, dt);        // moyenne lente (environ 0,7 s)
    this.#peak = Math.max(raw, this.#peak - 0.3 * dt); // sommet récent, qui redescend lentement

    const range = Math.max(0.12, this.#peak - this.#avg);
    return clamp01((raw - this.#avg) / range);
  }
}