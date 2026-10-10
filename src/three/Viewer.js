import * as THREE from 'three';
import { createEnvironment } from './environment.js';
import { LightRig } from './lights.js';
import { loadModel } from './loadModel.js';
import { Motion } from './Motion.js';
import { Picker } from './Picker.js';
import { PointerTracker } from './PointerTracker.js';
import { SpinController } from './SpinController.js';
import { TapSound } from './TapSound.js';
import { deg } from './math.js';

export class Viewer {
  #lastTime = null;

  constructor(container, config) {
    this.container = container;
    this.config = config;

    this.scene = new THREE.Scene();
    this.camera = this.#createCamera();
    this.renderer = this.#createRenderer();

    this.scene.environment = createEnvironment(this.renderer);
    this.scene.environmentIntensity = config.lighting.envIntensity;

    this.lights = new LightRig(config.lighting);
    this.scene.add(this.lights.group);

    // rootGroup : position + animations (entrée, flottement, parallaxe, tap, survol)
    //  └ spinGroup : rotation à la souris (axe vertical global)
    //     └ tiltGroup : inclinaison fixe du micro (axe de profondeur)
    //        └ micro
    this.rootGroup = new THREE.Group();
    this.spinGroup = new THREE.Group();
    this.tiltGroup = new THREE.Group();
    this.rootGroup.add(this.spinGroup);
    this.spinGroup.add(this.tiltGroup);
    this.scene.add(this.rootGroup);

    const startAngle = deg(config.model.startRotationY);
    this.spinGroup.rotation.y = startAngle;
    this.tiltGroup.rotation.z = deg(config.model.tiltZ);

    const canvas = this.renderer.domElement;
    this.tapSound = new TapSound(config.tap.sound);
    this.pointer = new PointerTracker(config.pointer.smoothing);
    this.picker = new Picker(canvas, this.camera, config.hover.checkInterval);
    this.motion = new Motion(this.rootGroup, canvas, config);
    this.spin = new SpinController(canvas, this.spinGroup, config.interaction, {
      startAngle,
      onTap: (x, y) => this.#onTap(x, y),
    });

    this.resizeObserver = new ResizeObserver(() => this.#onResize());
    this.resizeObserver.observe(container);
  }

  async init() {
    try {
      const model = await loadModel(this.config.modelUrl, this.config.model.size);
      this.tiltGroup.add(model);
      this.picker.setObject(model);
      this.motion.startIntro();
    } catch (err) {
      console.error('Impossible de charger le modèle 3D :', err);
    }
    this.renderer.setAnimationLoop((time) => this.#render(time));
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.spin.dispose();
    this.pointer.dispose();
    this.picker.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // --- méthodes privées ---

  #onTap(x, y) {
    if (!this.config.tap.enabled || !this.picker.hit(x, y)) return;
    this.motion.tap();
    this.tapSound.play().catch(() => {});
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
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = this.config.lighting.exposure;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  #onResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  #render(time) {
    // dt borné : évite un gros saut quand l'onglet revient au premier plan
    const dt =
        this.#lastTime === null ? 0 : Math.min((time - this.#lastTime) / 1000, 0.05);
    this.#lastTime = time;

    const { hover } = this.config;

    this.pointer.update(dt);
    this.spin.update(dt);

    const hovered = hover.enabled && this.picker.isHovered(time);
    this.motion.update(dt, this.pointer.value, hovered);

    const rimMultiplier = 1 + hover.rimBoost * this.motion.hoverAmount;
    this.lights.update(this.pointer.value, rimMultiplier);

    this.renderer.render(this.scene, this.camera);
  }
}