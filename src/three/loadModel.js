// src/three/loadModel.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export async function loadModel(url, targetSize = 2) {
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;

  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  model.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z));

  // Pas de recentrage : le pivot reste l'origine du modèle (point jaune)
  return model;
}