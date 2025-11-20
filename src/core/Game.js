import { Renderer } from '../rendering/Renderer.js';
import { InputHandler } from '../input/InputHandler.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { ObjectPool } from '../utils/pool.js';
import { Planet } from '../entities/Planet.js';
import { Satellite } from '../entities/Satellite.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import {
  INITIAL_ENERGY,
  INITIAL_HEALTH,
  PASSIVE_ENERGY_RATE,
  SATELLITE_COST,
  CENTER_X,
  CENTER_Y
} from '../utils/constants.js';
import { distance, angle as calculateAngle } from '../utils/math.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.inputHandler = new InputHandler(canvas, this);
    this.collisionSystem = new CollisionSystem();
    this.waveSystem = new WaveSystem();

    // Game state
    this.state = 'playing'; // 'playing', 'paused', 'gameover'
    this.energy = INITIAL_ENERGY;
    this.score = 0;

    // Entities
    this.planet = new Planet();
    this.satellites = [];
    this.enemies = [];
    this.projectiles = [];
    this.damageNumbers = [];

    // Object pools
    this.projectilePool = new ObjectPool(
      () => new Projectile(0, 0, 0, 0, 'laser', 0),
      (proj) => {
        proj.active = false;
        proj.isExploding = false;
        proj.trail = [];
      },
      100
    );

    this.enemyPool = new ObjectPool(
      () => new Enemy(0, 0, 'basic', 'straight'),
      (enemy) => {
        enemy.active = false;
        enemy.reachedPlanet = false;
      },
      50
    );

    // Drag state
    this.isDragging = false;
    this.dragWeaponType = null;
    this.dragX = 0;
    this.dragY = 0;
    this.dragOrbitRadius = 0;
    this.canPlace = false;

    // Timing
    this.lastTime = 0;
    this.lastEnergyTime = 0;
    this.animationFrameId = null;

    // UI elements
    this.setupUI();

    // Start first wave
    this.startNextWave();
  }

  setupUI() {
    // Weapon buttons
    document.getElementById('laserBtn').addEventListener('click', () => {
      this.selectWeapon('laser');
    });

    document.getElementById('missileBtn').addEventListener('click', () => {
      this.selectWeapon('missile');
    });

    document.getElementById('shieldBtn').addEventListener('click', () => {
      this.selectWeapon('shield');
    });

    // Pause button
    document.getElementById('pauseBtn').addEventListener('click', () => {
      this.togglePause();
    });

    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
      this.restart();
    });
  }

  selectWeapon(weaponType) {
    if (this.state !== 'playing') return;

    const cost = SATELLITE_COST[weaponType];
    if (this.energy >= cost) {
      this.dragWeaponType = weaponType;
      this.isDragging = true;
      this.inputHandler.startDragging(weaponType);
    }
  }

  updateDrag(x, y, orbitRadius) {
    this.dragX = x;
    this.dragY = y;
    this.dragOrbitRadius = orbitRadius;

    // Check if placement is valid (not too close to other satellites)
    const angle = calculateAngle(CENTER_X, CENTER_Y, x, y);
    this.canPlace = this.canPlaceSatellite(orbitRadius, angle);
  }

  canPlaceSatellite(orbitRadius, angle) {
    const minAngleDiff = 0.3; // radians

    for (const satellite of this.satellites) {
      if (Math.abs(satellite.orbitRadius - orbitRadius) < 5) {
        let angleDiff = Math.abs(satellite.angle - angle);
        if (angleDiff > Math.PI) {
          angleDiff = Math.PI * 2 - angleDiff;
        }

        if (angleDiff < minAngleDiff) {
          return false;
        }
      }
    }

    return true;
  }

  placeSatellite() {
    if (!this.canPlace || !this.dragWeaponType) {
      this.cancelDrag();
      return;
    }

    const cost = SATELLITE_COST[this.dragWeaponType];
    if (this.energy >= cost) {
      const angle = calculateAngle(CENTER_X, CENTER_Y, this.dragX, this.dragY);
      const satellite = new Satellite(this.dragOrbitRadius, angle, this.dragWeaponType);
      this.satellites.push(satellite);

      this.energy -= cost;
      this.updateUI();
    }

    this.cancelDrag();
  }

  cancelDrag() {
    this.isDragging = false;
    this.dragWeaponType = null;
    this.canPlace = false;
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pauseBtn').textContent = 'Resume [P]';
    } else if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('pauseBtn').textContent = 'Pause [P]';
      this.lastTime = performance.now();
    }
  }

  startNextWave() {
    const enemyData = this.waveSystem.startWave();

    for (const data of enemyData) {
      const enemy = this.enemyPool.acquire();
      enemy.x = data.x;
      enemy.y = data.y;
      enemy.type = data.type;
      enemy.movementPattern = data.pattern;

      const typeData = enemy.constructor.name === 'Enemy'
        ? require('../utils/constants.js').ENEMY_TYPES[data.type]
        : {};

      Object.assign(enemy, {
        active: true,
        maxHealth: typeData.health || 50,
        health: typeData.health || 50,
        speed: typeData.speed || 30,
        reward: typeData.reward || 10,
        color: typeData.color || '#f00',
        hasShield: typeData.hasShield || false,
        shieldActive: typeData.hasShield || false,
        reachedPlanet: false,
        targetX: CENTER_X,
        targetY: CENTER_Y,
        currentRadius: distance(data.x, data.y, CENTER_X, CENTER_Y)
      });

      this.enemies.push(enemy);
    }

    this.updateUI();
  }

  update(deltaTime) {
    if (this.state !== 'playing') return;

    // Update passive energy
    const currentTime = Date.now();
    if (currentTime - this.lastEnergyTime >= 1000) {
      this.energy += PASSIVE_ENERGY_RATE;
      this.lastEnergyTime = currentTime;
      this.updateUI();
    }

    // Update satellites
    for (const satellite of this.satellites) {
      satellite.update(deltaTime);

      // Fire at enemies in range
      if (satellite.weaponType !== 'shield' && satellite.canFire(currentTime)) {
        const enemiesInRange = this.collisionSystem.checkSatelliteInRange(satellite, this.enemies);

        if (enemiesInRange.length > 0) {
          const target = enemiesInRange[0];
          satellite.fire(currentTime);

          const projectile = this.projectilePool.acquire();
          projectile.x = satellite.x;
          projectile.y = satellite.y;
          projectile.targetX = target.x;
          projectile.targetY = target.y;
          projectile.type = satellite.weaponType;
          projectile.damage = satellite.damage;
          projectile.angle = calculateAngle(satellite.x, satellite.y, target.x, target.y);
          projectile.active = true;
          projectile.isExploding = false;
          projectile.trail = [];

          this.projectiles.push(projectile);
        }
      }
    }

    // Update enemies
    this.collisionSystem.clear();
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      enemy.update(deltaTime);
      this.collisionSystem.addToGrid(enemy);

      // Check if reached planet
      if (enemy.reachedPlanet) {
        this.planet.takeDamage(10);
        enemy.destroy();
        this.waveSystem.enemyDestroyed();

        if (this.planet.health <= 0) {
          this.gameOver();
        }
      }
    }

    // Update projectiles
    for (const projectile of this.projectiles) {
      if (!projectile.active) continue;
      projectile.update(deltaTime);
    }

    // Check collisions
    this.checkCollisions();

    // Remove inactive entities
    this.projectiles = this.projectiles.filter(p => p.active);
    this.enemies = this.enemies.filter(e => e.active);

    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dmg = this.damageNumbers[i];
      dmg.y -= 30 * deltaTime;
      dmg.alpha -= deltaTime;

      if (dmg.alpha <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // Check for next wave
    if (this.waveSystem.canStartNextWave(currentTime)) {
      this.startNextWave();
    }

    this.updateUI();
  }

  checkCollisions() {
    // Projectile-Enemy collisions
    const hits = this.collisionSystem.checkProjectileEnemyCollisions(this.projectiles, this.enemies);

    for (const { projectile, enemy } of hits) {
      if (projectile.type === 'missile') {
        projectile.explode();
      } else {
        const killed = enemy.takeDamage(projectile.damage);
        this.addDamageNumber(enemy.x, enemy.y, projectile.damage);

        if (killed) {
          this.enemyDestroyed(enemy);
        }

        projectile.destroy();
      }
    }

    // Explosion-Enemy collisions
    for (const projectile of this.projectiles) {
      if (projectile.type === 'missile' && projectile.isExploding) {
        const hitEnemies = this.collisionSystem.checkExplosionEnemyCollisions(projectile, this.enemies);

        for (const enemy of hitEnemies) {
          const killed = enemy.takeDamage(projectile.damage);
          this.addDamageNumber(enemy.x, enemy.y, projectile.damage);

          if (killed) {
            this.enemyDestroyed(enemy);
          }
        }
      }
    }
  }

  addDamageNumber(x, y, damage) {
    this.damageNumbers.push({
      x,
      y: y - 20,
      damage,
      alpha: 1
    });
  }

  enemyDestroyed(enemy) {
    this.score += enemy.reward;
    this.energy += enemy.reward;
    this.waveSystem.enemyDestroyed();
  }

  gameOver() {
    this.state = 'gameover';

    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalWave').textContent = this.waveSystem.currentWave;
    document.getElementById('gameOver').style.display = 'block';
  }

  restart() {
    // Reset state
    this.state = 'playing';
    this.energy = INITIAL_ENERGY;
    this.score = 0;

    // Clear entities
    this.satellites = [];
    this.enemies = [];
    this.projectiles = [];
    this.damageNumbers = [];

    // Reset pools
    this.projectilePool.releaseAll();
    this.enemyPool.releaseAll();

    // Reset planet
    this.planet = new Planet();

    // Reset wave system
    this.waveSystem.reset();
    this.startNextWave();

    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('pauseBtn').textContent = 'Pause [P]';

    this.updateUI();
  }

  updateUI() {
    document.getElementById('energy').textContent = Math.floor(this.energy);
    document.getElementById('score').textContent = this.score;
    document.getElementById('wave').textContent = this.waveSystem.currentWave;
    document.getElementById('health').textContent = Math.floor(this.planet.health);

    // Update button states
    const buttons = {
      laserBtn: 'laser',
      missileBtn: 'missile',
      shieldBtn: 'shield'
    };

    for (const [btnId, weaponType] of Object.entries(buttons)) {
      const btn = document.getElementById(btnId);
      const cost = SATELLITE_COST[weaponType];
      btn.disabled = this.energy < cost || this.state !== 'playing';
    }
  }

  render() {
    this.renderer.renderFrame({
      planet: this.planet,
      satellites: this.satellites,
      enemies: this.enemies,
      projectiles: this.projectiles,
      damageNumbers: this.damageNumbers,
      isDragging: this.isDragging,
      dragX: this.dragX,
      dragY: this.dragY,
      dragOrbitRadius: this.dragOrbitRadius,
      dragWeaponType: this.dragWeaponType,
      canPlace: this.canPlace
    });
  }

  gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  start() {
    this.lastTime = performance.now();
    this.lastEnergyTime = Date.now();
    this.gameLoop(this.lastTime);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
