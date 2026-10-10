import { MathUtils } from 'three';

export const deg = MathUtils.degToRad;

export const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

// Lissage exponentiel indépendant du framerate : `rate` est en 1/seconde.
export const damp = (current, target, rate, dt) =>
    current + (target - current) * (1 - Math.exp(-rate * dt));

export const easeOutCubic = (t) => 1 - (1 - t) ** 3;

export const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

// Ramène un angle (radians) dans [-PI, PI] : le chemin le plus court.
export const shortestAngle = (a) =>
    ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;