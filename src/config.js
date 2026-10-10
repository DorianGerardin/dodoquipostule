export const VIEWER_CONFIG = {
  modelUrl: '/models/micro_v2.glb',

  model: {
    size: 2,            // hauteur normalisée du micro
    tiltZ: 0,           // inclinaison par défaut (axe de profondeur)
    offsetX: 0,         // position du pivot (point jaune) dans la scène
    offsetY: -1,
    startRotationY: 0,  // angle de départ, et angle de retour au double-clic
  },

  camera: { fov: 45, position: [0, 0, 4] },
  maxPixelRatio: 2,

  lighting: {
    exposure: 1,
    envIntensity: 0.6,                                          // lumière douce du « studio »
    key:  { color: 0xe6d4ff, intensity: 2.2, position: [-3, 4, 4] },  // principale
    fill: { color: 0xdde8ff, intensity: 0.7, position: [4, 1, 3] },   // remplissage
    rim:  { color: 0xffffff, intensity: 2.0, position: [0, 3, -4] },  // contre-jour
    follow: {
      enabled: true,
      rangeX: 3,        // déplacement max de la lumière principale (gauche/droite)
      rangeY: 2,        // déplacement max de la lumière principale (haut/bas)
    },
  },

  // Lissage de la position du curseur (parallaxe + lumière). Plus haut = plus réactif.
  pointer: { smoothing: 5 },

  interaction: {
    degreesPerWidth: 400,  // rotation pour un glissé sur toute la largeur du viewer
    inertiaDamping: 3,     // freinage après le lâcher (par seconde). Plus haut = s'arrête plus vite
    idle: {
      enabled: false,       // rotation lente quand on n'interagit pas
      speed: 10,           // degrés par seconde
      delay: 3,            // secondes d'inactivité avant de démarrer
    },
    doubleClick: {
      enabled: true,       // double-clic / double-tap : retour à startRotationY
      duration: 0.8,
    },
  },

  intro: {
    enabled: true,
    delay: 0.2,
    duration: 1.4,
    distance: 1.5,         // le micro monte depuis cette distance sous sa position finale
    fade: true,            // apparition en fondu
  },

  float: {
    enabled: true,
    amplitude: 0.015,       // hauteur du flottement
    speed: 0.3,            // cycles par seconde
  },

  parallax: {
    enabled: true,
    tiltX: 2,              // inclinaison max avant/arrière (suit la hauteur du curseur)
    tiltZ: 3,              // inclinaison max gauche/droite (suit la position horizontale)
  },

  hover: {
    enabled: true,
    scale: 1.04,           // agrandissement au survol
    rimBoost: 1.5,         // le contre-jour s'intensifie de +150 % au survol
    speed: 8,              // rapidité de la transition
    checkInterval: 50,     // ms entre deux tests de survol (augmente si le modèle est lourd)
  },

  tap: {
    enabled: true,
    variation: 0.5,       // secousse : 0 = toujours identique, 1 = très variable
    amplitude: 3,          // secousse max (degrés)
    frequency: 5,          // oscillations par seconde
    decay: 7,              // amortissement (plus haut = s'arrête plus vite)
    duration: 0.8,
    sound: {
      enabled: true,
      variation: 0.25,     // son : 0 = toujours identique, 1 = très variable
      volume: 0.25,
      pitch: 1,
      url: null,           // ex : '/sounds/tap.mp3' ; sinon un son synthétisé est généré
    },
  },
};