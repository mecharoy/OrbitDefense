import { circleIntersects, distance } from '../utils/math.js';
import { MISSILE_EXPLOSION_RADIUS } from '../utils/constants.js';

export class CollisionSystem {
  constructor() {
    this.cellSize = 100;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  addToGrid(entity) {
    const key = this.getCellKey(entity.x, entity.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  }

  getNearbyEntities(entity) {
    const nearby = [];
    const cellX = Math.floor(entity.x / this.cellSize);
    const cellY = Math.floor(entity.y / this.cellSize);

    // Check surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        if (this.grid.has(key)) {
          nearby.push(...this.grid.get(key));
        }
      }
    }

    return nearby;
  }

  checkProjectileEnemyCollisions(projectiles, enemies) {
    const hits = [];

    for (const projectile of projectiles) {
      if (!projectile.active || projectile.isExploding) continue;

      const nearbyEnemies = this.getNearbyEntities(projectile);

      for (const enemy of nearbyEnemies) {
        if (!enemy.active) continue;

        if (circleIntersects(
          projectile.x, projectile.y, projectile.radius,
          enemy.x, enemy.y, enemy.radius
        )) {
          hits.push({ projectile, enemy });
        }
      }
    }

    return hits;
  }

  checkExplosionEnemyCollisions(projectile, enemies) {
    const hits = [];

    if (projectile.type !== 'missile' || !projectile.isExploding) {
      return hits;
    }

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const dist = distance(projectile.x, projectile.y, enemy.x, enemy.y);
      if (dist < projectile.explosionRadius + enemy.radius) {
        hits.push(enemy);
      }
    }

    return hits;
  }

  checkEnemyPlanetCollisions(enemies, planet) {
    const collisions = [];

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      if (circleIntersects(
        enemy.x, enemy.y, enemy.radius,
        planet.x, planet.y, planet.radius
      )) {
        collisions.push(enemy);
      }
    }

    return collisions;
  }

  checkSatelliteInRange(satellite, enemies) {
    const inRange = [];

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const dist = distance(satellite.x, satellite.y, enemy.x, enemy.y);
      if (dist < satellite.range) {
        inRange.push(enemy);
      }
    }

    return inRange;
  }

  checkSatellitesInShieldRange(shield, satellites) {
    const protectedSatellites = [];

    for (const satellite of satellites) {
      if (!satellite.active || satellite === shield) continue;

      const dist = distance(shield.x, shield.y, satellite.x, satellite.y);
      if (dist < shield.shieldRadius) {
        protectedSatellites.push(satellite);
      }
    }

    return protectedSatellites;
  }
}
