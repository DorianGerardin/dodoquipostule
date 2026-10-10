export const VIEWER_CONFIG = {
  modelUrl: '/models/micro_v2.glb',
  model: {
    size: 2,           // hauteur normalisée du micro
    tiltZ: 0,         // inclinaison par défaut en degrés (négatif = penche de l'autre côté)
    offsetX: 0,
    offsetY: -1,     // plus négatif = plus de micro qui dépasse en bas
    startRotationY: 0, // angle de départ autour de l'axe vertical, en degrés
  },
  camera: { fov: 45, position: [0, 0, 4] },
  interaction: {
    speed: 0.005,      // sensibilité de la rotation
    friction: 0.95,    // inertie après le lâcher (0 = aucune, proche de 1 = longue)
  },
  maxPixelRatio: 2,
  lighting: {
    exposure: 1,
    envIntensity: 0.6,                              // lumière douce ambiante du « studio »
    key:  { color: 0xfff1e0, intensity: 3 },      // principale, légèrement chaude
    fill: { color: 0xdde8ff, intensity: 0.7 },      // remplissage, légèrement froid
    rim:  { color: 0xffffff, intensity: 2.0 },      // contre-jour
  },
};