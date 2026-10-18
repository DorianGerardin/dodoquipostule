// Tous les réglages du viewer.
// Durées en secondes, angles en degrés, distances en unités Three.js
// (le micro fait `model.size` unités de haut).

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const VIEWER_CONFIG = {
  modelUrl: asset('models/micro_v4.glb'),

  model: {
    size: 2,            // hauteur normalisée du micro
    tiltZ: -2,           // inclinaison par défaut (axe de profondeur)
    offsetX: 0,         // position du pivot (point jaune) dans la scène
    offsetY: -0.2,
    startRotationY: 0,  // angle de départ, et angle de retour au double-clic
  },

  camera: { fov: 45, position: [0, 0, 4] },
  maxPixelRatio: 2,

  lighting: {
    exposure: 1,
    envIntensity: 0.6,                                          // lumière douce du « studio »
    key:  { color: 0xe6d4ff, intensity: 5, position: [-3, 4, 4] },  // principale
    fill: { color: 0xdde8ff, intensity: 0.7, position: [4, 1, 3] },   // remplissage
    rim:  { color: 0xffffff, intensity: 2.0, position: [0, 3, -4] },  // contre-jour
    follow: {
      enabled: true,
      rangeX: 3,        // déplacement max de la lumière principale (gauche/droite)
      rangeY: 2,        // déplacement max de la lumière principale (haut/bas)
    },
  },

  pointer: {
    smoothing: 5,        // lissage du curseur (parallaxe + lumière). Plus haut = plus réactif
    onlyOnModel: false,   // true : parallaxe et lumière réagissent seulement quand le curseur est sur le micro
  },

  interaction: {
    degreesPerWidth: 200,  // rotation pour un glissé sur toute la largeur de l'écran
    hitPadding: 10,        // marge (px) autour du micro où un appui compte encore (utile au doigt)
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
    amplitude: 0.03,       // hauteur du flottement
    speed: 0.5,            // cycles par seconde
  },

  parallax: {
    enabled: true,
    tiltX: 3,              // inclinaison max avant/arrière (suit la hauteur du curseur)
    tiltZ: 4,              // inclinaison max gauche/droite (suit la position horizontale)
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
    amplitude: 4,          // secousse max (degrés)
    frequency: 6,          // oscillations par seconde
    decay: 7,              // amortissement (plus haut = s'arrête plus vite)
    duration: 0.8,
    variation: 0.25,       // 0 = secousse toujours identique, 1 = très variable (force, vitesse, sens)
    sound: {
      enabled: true,
      volume: 0.25,
      variation: 0.25,     // 0 = son toujours identique, 1 = très variable (hauteur, volume, timbre)
      pitch: 1,            // 1 = normal ; plus bas = plus grave, plus haut = plus aigu (son synthétisé)
      url: null,           // ex : '/sounds/tap.mp3' ; sinon un son synthétisé est généré
    },
  },
  logo: {
    enabled: true,
    url: asset('src/img/dodo_qui_assiste.webp'),   // chemin de ton image, dans public/
    alt: 'Dodo qui assiste',
    width: 'clamp(120px, 30vmin, 360px)',   // largeur maximale (CSS) : s'adapte à l'écran
    mobileWidth: '100vw',                    // largeur maximale sur mobile (écran de 640 px ou moins)
    gap: 32,                                // px entre le logo et le sommet du micro
    appearAt: 0.3,                          // apparaît quand l'entrée du micro est à 70 %
  },
  audio: {
    enabled: true,
    relative: true,               // false : suit le niveau global des basses (ancien comportement)
    url: asset('audio/dodoquipostule_2.mp3'),   // ton fichier, dans public/audio/
    volume: 0.8,
    loop: false,
    player: {
      from: '#8520bc',       // dégradé du lecteur, de gauche à droite
      to: '#fa0483',
      bars: '#ffffff',       // couleur des barres et du curseur de lecture
      width: 320,            // px
      height: 56,
      barCount: 32,          // nombre de barres de la forme d'onde
      gap: 12,               // px entre le lecteur et le sommet du micro
    },
    reaction: {              // le micro réagit aux basses de la musique
      sensitivity: 1,      // plus haut = réagit plus fort
      attack: 30,            // rapidité de montée
      release: 6,            // rapidité de retombée
      scale: 0.15,           // pulsation maximale (0,04 = 4 %)
      shake: 1.25,            // tremblement maximal, en degrés
      shakeSpeed: 0.5,         // secousses par seconde
    },
  },
  hint: {
    enabled: true,
    text: 'Clique\nsur le\nmicro',                // un retour à la ligne par \n ; '' pour la flèche seule
    color: '#8822bd',
    delay: 0.1,                                    // secondes d'attente après l'entrée du micro
    distance: 0.05,                               // éloignement du micro (unités de la scène)
    heightRatio: 0.5,                            // hauteur du bout de la flèche : 0 = cou, 1 = sommet du micro
    size: 'clamp(14px, 3.2vmin, 24px)',          // taille (CSS) : la flèche et le texte grandissent ensemble
    mobileSize: 'clamp(12px, 3.4vw, 16px)',      // taille sur mobile (écran de 640 px ou moins)
  },
};