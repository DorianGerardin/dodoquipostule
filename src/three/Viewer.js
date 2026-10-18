import * as THREE from 'three';
import { createEnvironment } from './environment.js';
import { LightRig } from './lights.js';
import { loadModel } from './loadModel.js';
import { Motion } from './Motion.js';
import { Picker } from './Picker.js';
import { PointerTracker } from './PointerTracker.js';
import { SpinController } from './SpinController.js';
import { TapSound } from './TapSound.js';
import { AudioPlayer } from './AudioPlayer.js';
import { PlayerUI } from '../ui/PlayerUI.js';
import { LogoUI } from '../ui/LogoUI.js';
import { deg } from './math.js';

export class Viewer {
  audio = null;
  playerUI = null;
  logoUI = null;
  #lastTime = null;
  #modelTop = 0;                    // hauteur du sommet du micro, par rapport à son pivot
  #anchor = new THREE.Vector3();

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
      onTap: () => this.#onTap(),
      canStart: (x, y) => this.picker.hit(x, y, config.interaction.hitPadding),
    });

    // Musique : un clic sur le micro lance le morceau et affiche le lecteur
    if (config.audio?.enabled) {
      this.audio = new AudioPlayer(config.audio);
      this.playerUI = new PlayerUI(container.parentElement, config.audio.player, this.audio);
    }

    // Logo accroché au sommet du micro
    if (config.logo?.enabled) {
      this.logoUI = new LogoUI(container.parentElement, config.logo);
    }

    this.resizeObserver = new ResizeObserver(() => this.#onResize());
    this.resizeObserver.observe(container);
    this.resizeObserver.observe(container.parentElement);
    this.#onResize();
  }

  async init() {
    try {
      const model = await loadModel(this.config.modelUrl, this.config.model.size);
      this.#modelTop = new THREE.Box3().setFromObject(model).max.y; // avant l'ajout à la scène
      this.tiltGroup.add(model);
      this.picker.setObject(model);
      this.motion.startIntro();
    } catch (err) {
      console.error('Impossible de charger le modèle 3D :', err);
    }

    // Chargement du fichier audio en arrière-plan : il sera prêt au premier clic
    this.audio
        ?.load()
        .then((peaks) => this.playerUI?.setPeaks(peaks))
        .catch((err) => console.error('Audio :', err));

    this.renderer.setAnimationLoop((time) => this.#render(time));
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.spin.dispose();
    this.pointer.dispose();
    this.picker.dispose();
    this.audio?.dispose();
    this.playerUI?.dispose();
    this.logoUI?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // --- méthodes privées ---

  // Un tap n'est détecté que si l'appui a commencé sur le micro (voir canStart)
  #onTap() {
    if (this.config.tap.enabled) {
      this.motion.tap();
      this.tapSound.play().catch(() => {});
    }
    this.#toggleAudio();
  }

  // 1er clic : lance la musique et affiche le lecteur. Clic suivant : arrête et cache.
  #toggleAudio() {
    if (!this.audio) return;
    if (this.audio.active) this.audio.stop();
    else
    {
      this.spin.returnToStart();
      this.audio.start().catch(console.error);
    }
  }

  // Position écran (px) du sommet du micro : le logo et le lecteur s'y accrochent
  #headAnchor() {
    const { position, scale } = this.rootGroup;
    this.#anchor.set(position.x, position.y + this.#modelTop * scale.y, 0).project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + (this.#anchor.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (1 - (this.#anchor.y * 0.5 + 0.5)) * rect.height,
    };
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

  // Le canvas n'est qu'une « fenêtre » découpée dans une scène calculée comme si elle
  // occupait tout le parent (la section hero) : le micro garde la même taille et la
  // même position, quelles que soient la taille et la place du canvas.
  #onResize() {
    const stage = this.container.parentElement.getBoundingClientRect();
    const view = this.container.getBoundingClientRect();
    if (!stage.width || !stage.height || !view.width || !view.height) return;

    this.camera.aspect = stage.width / stage.height;
    this.camera.setViewOffset(
        stage.width,
        stage.height,
        view.left - stage.left,
        view.top - stage.top,
        view.width,
        view.height,
    );
    this.renderer.setSize(view.width, view.height);
  }

  #render(time) {
    // dt borné : évite un gros saut quand l'onglet revient au premier plan
    const dt =
        this.#lastTime === null ? 0 : Math.min((time - this.#lastTime) / 1000, 0.05);
    this.#lastTime = time;

    const { hover, pointer } = this.config;

    const overModel = this.picker.isHovered(time);
    const cursor = this.spin.dragging ? 'grabbing' : overModel ? 'grab' : 'default';
    if (this.renderer.domElement.style.cursor !== cursor) {
      this.renderer.domElement.style.cursor = cursor;
    }

    // Parallaxe et lumière : sur toute la fenêtre, ou seulement quand le curseur est sur le micro
    const cursorActive = !pointer.onlyOnModel || overModel || this.spin.dragging;
    this.pointer.update(dt, cursorActive);
    this.spin.update(dt);

    this.audio?.update(dt);
    this.motion.update(dt, this.pointer.value, hover.enabled && overModel, this.audio?.level ?? 0);
    // Point d'accroche (sommet du micro) pour le logo et le lecteur
    const anchor = this.logoUI || this.audio?.active ? this.#headAnchor() : null;
    this.playerUI?.update(this.audio?.active ? anchor : null);

    // Le logo remonte quand le lecteur s'ouvre, pour lui laisser la place
    const player = this.config.audio?.player;
    const shift = this.audio?.active && player ? player.height + player.gap : 0;
    this.logoUI?.update(anchor, dt, this.motion.introProgress, shift);

    const rimMultiplier = 1 + hover.rimBoost * this.motion.hoverAmount;
    this.lights.update(this.pointer.value, rimMultiplier);

    this.renderer.render(this.scene, this.camera);
  }
}