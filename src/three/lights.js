import * as THREE from 'three';

export function createLights({ key, fill, rim }) {
  const group = new THREE.Group();

  const keyLight = new THREE.DirectionalLight(key.color, key.intensity);
  keyLight.position.set(-3, 4, 4); // haut-gauche, devant

  const fillLight = new THREE.DirectionalLight(fill.color, fill.intensity);
  fillLight.position.set(4, 1, 3); // droite, plus bas

  const rimLight = new THREE.DirectionalLight(rim.color, rim.intensity);
  rimLight.position.set(0, 3, -4); // derrière

  group.add(keyLight, fillLight, rimLight);
  return group;
}