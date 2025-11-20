// Game constants
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const CENTER_X = CANVAS_WIDTH / 2;
export const CENTER_Y = CANVAS_HEIGHT / 2;

// Planet
export const PLANET_RADIUS = 50;
export const PLANET_EXPANSION_RATE = 0.02; // pixels per second (gradual growth)
export const MAX_PLANET_RADIUS = 100;

// Orbits
export const ORBIT_RADII = [120, 180, 240, 300, 360];
export const ORBITAL_SPEED_BASE = 0.3; // radians per second

// Satellites
export const SATELLITE_RADIUS = 8;
export const SATELLITE_RANGE = {
  laser: 150,
  missile: 200,
  shield: 100
};
export const SATELLITE_FIRE_RATE = {
  laser: 500,   // milliseconds
  missile: 1500,
  shield: 3000
};
export const SATELLITE_DAMAGE = {
  laser: 20,
  missile: 50,
  shield: 0
};
export const SATELLITE_COST = {
  laser: 20,
  missile: 50,
  shield: 80
};
export const SATELLITE_MAX_HEALTH = {
  laser: 100,
  missile: 150,
  shield: 200
};
export const SATELLITE_MAX_AMMO = {
  laser: 50,    // 50 shots
  missile: 20,  // 20 shots
  shield: 30    // 30 shield activations
};
export const METEOR_DAMAGE_TO_SATELLITE = 50;

// Enemies
export const ENEMY_TYPES = {
  basic: { health: 50, speed: 30, reward: 10, color: '#f00' },
  fast: { health: 30, speed: 60, reward: 15, color: '#ff0' },
  tank: { health: 100, speed: 20, reward: 25, color: '#f0f' },
  shielded: { health: 80, speed: 35, reward: 30, color: '#0ff', hasShield: true },
  meteor: { health: 150, speed: 120, reward: 50, color: '#fa0', isMeteor: true, damageOnContact: 30 }
};
export const METEOR_SPAWN_CHANCE = 0.4; // 40% chance per wave (increased visibility)
export const METEOR_MIN_WAVE = 2; // Meteors start appearing from wave 2 (earlier)

// Enemy scaling per wave
export const ENEMY_HEALTH_SCALING = 1.15; // 15% more health per wave
export const ENEMY_SPEED_SCALING = 1.08; // 8% faster per wave
export const ENEMY_DAMAGE_SCALING = 1.1; // 10% more damage per wave

// Projectiles
export const PROJECTILE_SPEED = 200;
export const PROJECTILE_RADIUS = 3;
export const MISSILE_EXPLOSION_RADIUS = 40;

// Wave system
export const WAVE_DELAY = 3000; // milliseconds between waves
export const BASE_ENEMIES_PER_WAVE = 5;
export const ENEMY_INCREASE_PER_WAVE = 2;

// Game settings
export const INITIAL_ENERGY = 100;
export const INITIAL_HEALTH = 100;
export const PASSIVE_ENERGY_RATE = 5; // energy per second
export const TARGET_FPS = 60;

// Colors
export const COLORS = {
  background: '#000',
  planet: '#4169e1',
  orbit: '#333',
  laser: '#0f0',
  missile: '#f80',
  shield: '#00f',
  explosion: '#ff0',
  ui: '#0f0'
};
