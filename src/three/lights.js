import * as THREE from 'three';

export class LightRig {
  constructor(config) {
    this.config = config;
    this.group = new THREE.Group();

    this.key = this.#create(config.key);
    this.fill = this.#create(config.fill);
    this.rim = this.#create(config.rim);

    this.group.add(this.key, this.fill, this.rim);
  }

  // pointer : position lissée du curseur, de -1 à 1 sur chaque axe
  // rimMultiplier : facteur appliqué au contre-jour (effet de survol)
  update(pointer, rimMultiplier = 1) {
    const { key, rim, follow } = this.config;

    const offsetX = follow.enabled ? pointer.x * follow.rangeX : 0;
    const offsetY = follow.enabled ? pointer.y * follow.rangeY : 0;
    this.key.position.set(
        key.position[0] + offsetX,
        key.position[1] + offsetY,
        key.position[2],
    );

    this.rim.intensity = rim.intensity * rimMultiplier;
  }

  #create({ color, intensity, position }) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position);
    return light;
  }
}