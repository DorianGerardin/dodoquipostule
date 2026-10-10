import * as THREE from 'three';
import { createLights } from './lights.js';
import { loadModel } from './loadModel.js';
import { DragRotate } from './DragRotate.js';
import { createEnvironment } from './environment.js';

export class Viewer {
  constructor(container, config) {
    this.container = container;
    this.config = config;

    this.scene = new THREE.Scene();
    this.camera = this.#createCamera();
    this.renderer = this.#createRenderer();
    this.scene.environment = createEnvironment(this.renderer);
    this.scene.environmentIntensity = this.config.lighting.envIntensity;

    // tiltGroup : inclinaison + position fixes / spinGroup : rotation à la souris
    this.tiltGroup = new THREE.Group();
    this.spinGroup = new THREE.Group();
    this.spinGroup.add(this.tiltGroup);
    this.scene.add(this.spinGroup);
    this.#applyPlacement();

    this.scene.add(createLights(this.config.lighting));

    this.dragRotate = new DragRotate(
        this.renderer.domElement,
        this.spinGroup,
        this.config.interaction,
    );

    this.resizeObserver = new ResizeObserver(() => this.#onResize());
    this.resizeObserver.observe(container);
  }

  async init() {
    try {
      const model = await loadModel(this.config.modelUrl, this.config.model.size);
      this.tiltGroup.add(model);
    } catch (err) {
      console.error('Impossible de charger le modèle 3D :', err);
    }
    this.renderer.setAnimationLoop(() => this.#render());
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.dragRotate.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // --- méthodes privées ---

  #applyPlacement() {
    const { tiltZ, offsetX, offsetY, startRotationY } = this.config.model;
    this.spinGroup.position.set(offsetX, offsetY, 0);
    this.spinGroup.rotation.y = THREE.MathUtils.degToRad(startRotationY);
    this.tiltGroup.rotation.z = THREE.MathUtils.degToRad(tiltZ);
  }

  #createCamera() {
    const { fov, position } = this.config.camera;
    const { clientWidth: w, clientHeight: h } = this.container;
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
    camera.position.set(...position);
    return camera;
  }

  #createRenderer() {
    const { clientWidth: w, clientHeight: h } = this.container;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, this.config.maxPixelRatio));
    renderer.setSize(w, h);
    this.container.appendChild(renderer.domElement);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = this.config.lighting.exposure;
    return renderer;
  }

  #onResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  #render() {
    this.dragRotate.update();
    this.renderer.render(this.scene, this.camera);
  }
}