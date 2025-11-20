import { Renderer } from '../rendering/Renderer.js';
import { InputHandler } from '../input/InputHandler.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { ObjectPool } from '../utils/pool.js';
import { Storage } from '../utils/storage.js';
import { Planet } from '../entities/Planet.js';
import { Satellite } from '../entities/Satellite.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import {
  INITIAL_ENERGY,
  INITIAL_HEALTH,
  PASSIVE_ENERGY_RATE,
  SATELLITE_BASE_COST,
  SATELLITE_COST_SCALING,
  SATELLITE_DAMAGE,
  PLANET_EXPANSION_RATE,
  METEOR_DAMAGE_TO_SATELLITE,
  ENEMY_HEALTH_SCALING,
  ENEMY_SPEED_SCALING,
  ENEMY_DAMAGE_SCALING,
  ENEMY_TYPES,
  ORBIT_RADII,
  SHIELD_ORBIT_LIMITS,
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
    this.particleSystem = new ParticleSystem();

    // Game state
    this.state = 'playing'; // 'playing', 'paused', 'gameover'
    this.energy = INITIAL_ENERGY;
    this.score = 0;
    this.highScore = Storage.getHighScore();
    this.highWave = Storage.getHighWave();

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

    // Screen shake
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

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

  getSatelliteCost(weaponType) {
    const baseCost = SATELLITE_BASE_COST[weaponType];
    const scaling = SATELLITE_COST_SCALING[weaponType];
    const wave = this.waveSystem.currentWave;
    return Math.floor(baseCost * Math.pow(scaling, wave - 1));
  }

  selectWeapon(weaponType) {
    if (this.state !== 'playing') return;

    const cost = this.getSatelliteCost(weaponType);
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

    // Check shield limits for this orbit
    if (this.dragWeaponType === 'shield') {
      const orbitIndex = ORBIT_RADII.indexOf(orbitRadius);
      if (orbitIndex !== -1) {
        const limit = SHIELD_ORBIT_LIMITS[orbitIndex];
        const shieldsOnOrbit = this.satellites.filter(
          s => s.active && s.weaponType === 'shield' && s.orbitRadius === orbitRadius
        ).length;

        if (shieldsOnOrbit >= limit) {
          return false; // Too many shields on this orbit
        }
      }
    }

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

    const cost = this.getSatelliteCost(this.dragWeaponType);
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

    // Set planet growth rate based on wave (grows faster in later waves)
    const growthMultiplier = Math.min(this.waveSystem.currentWave / 10, 1.5);
    this.planet.setGrowthRate(PLANET_EXPANSION_RATE * growthMultiplier);

    // Show wave notification
    this.showWaveNotification(this.waveSystem.currentWave);

    for (const data of enemyData) {
      const enemy = this.enemyPool.acquire();
      enemy.x = data.x;
      enemy.y = data.y;
      enemy.type = data.type;
      enemy.movementPattern = data.pattern;

      // Get base stats
      const baseTypeData = ENEMY_TYPES[data.type];

      // Apply wave scaling
      const waveNumber = this.waveSystem.currentWave;
      const healthMultiplier = Math.pow(ENEMY_HEALTH_SCALING, waveNumber - 1);
      const speedMultiplier = Math.pow(ENEMY_SPEED_SCALING, waveNumber - 1);
      const damageMultiplier = Math.pow(ENEMY_DAMAGE_SCALING, waveNumber - 1);

      Object.assign(enemy, {
        active: true,
        maxHealth: Math.floor(baseTypeData.health * healthMultiplier),
        health: Math.floor(baseTypeData.health * healthMultiplier),
        speed: baseTypeData.speed * speedMultiplier,
        reward: baseTypeData.reward,
        color: baseTypeData.color,
        hasShield: baseTypeData.hasShield || false,
        shieldActive: baseTypeData.hasShield || false,
        isMeteor: baseTypeData.isMeteor || false,
        damageOnContact: baseTypeData.damageOnContact ? Math.floor(baseTypeData.damageOnContact * damageMultiplier) : 0,
        reachedPlanet: false,
        targetX: CENTER_X,
        targetY: CENTER_Y,
        currentRadius: distance(data.x, data.y, CENTER_X, CENTER_Y),
        trailParticles: []
      });

      this.enemies.push(enemy);
    }

    this.updateUI();
  }

  showWaveNotification(waveNumber) {
    const notification = document.getElementById('waveNotification');
    notification.textContent = `WAVE ${waveNumber}`;
    notification.style.animation = 'waveAnnounce 2s ease-out';

    setTimeout(() => {
      notification.style.animation = '';
    }, 2000);
  }

  addScreenShake(intensity, duration) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  updateScreenShake(deltaTime) {
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
      this.screenShake.intensity = 0;
    }
  }

  update(deltaTime) {
    if (this.state !== 'playing') return;

    // Update screen shake
    this.updateScreenShake(deltaTime);

    // Update passive energy
    const currentTime = Date.now();
    if (currentTime - this.lastEnergyTime >= 1000) {
      this.energy += PASSIVE_ENERGY_RATE;
      this.lastEnergyTime = currentTime;
      this.updateUI();
    }

    // Update particles
    this.particleSystem.update(deltaTime);

    // Update planet (gradual expansion)
    this.planet.update(deltaTime);

    // Update satellites
    for (const satellite of this.satellites) {
      satellite.update(deltaTime);

      // Fire at enemies in range
      if (satellite.weaponType !== 'shield' && satellite.canFire(currentTime)) {
        const enemiesInRange = this.collisionSystem.checkSatelliteInRange(satellite, this.enemies);

        if (enemiesInRange.length > 0) {
          const target = enemiesInRange[0];

          // Check if satellite still active after firing (might run out of ammo)
          const wasActive = satellite.active;
          satellite.fire(currentTime);

          // If satellite was destroyed due to ammo depletion
          if (!satellite.active && wasActive) {
            this.particleSystem.createExplosion(satellite.x, satellite.y, satellite.getColor(), 20);
            this.addScreenShake(2, 0.1);
          }

          // Only create projectile if satellite is still active
          if (satellite.active) {
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
    }

    // Reset shield effects on all enemies
    for (const enemy of this.enemies) {
      enemy.slowedByShield = false;
    }

    // Process shield satellites
    for (const satellite of this.satellites) {
      if (!satellite.active || satellite.weaponType !== 'shield') continue;

      const enemiesInRange = this.collisionSystem.checkSatelliteInRange(satellite, this.enemies);

      if (enemiesInRange.length > 0) {
        // Activate shield (consumes ammo periodically)
        const activated = satellite.activateShield(currentTime);

        // Apply effects to enemies in range
        for (const enemy of enemiesInRange) {
          // Slow down enemy
          enemy.slowedByShield = true;

          // Accumulate damage over time
          enemy.shieldDamageAccumulator += SATELLITE_DAMAGE.shield * deltaTime;

          // Apply damage when accumulator reaches 1
          if (enemy.shieldDamageAccumulator >= 1) {
            const damage = Math.floor(enemy.shieldDamageAccumulator);
            enemy.shieldDamageAccumulator -= damage;

            const killed = enemy.takeDamage(damage);
            this.addDamageNumber(enemy.x, enemy.y, damage);

            if (killed) {
              this.enemyDestroyed(enemy);
              this.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color, 20);
              this.addScreenShake(2, 0.1);
            }
          }
        }

        // Visual effect when shield is active
        if (activated && enemiesInRange.length > 0) {
          this.particleSystem.createImpact(satellite.x, satellite.y, '#00f', 5);
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
        // Use scaled damage based on wave
        const baseDamage = enemy.isMeteor ? 30 : 10;
        const waveNumber = this.waveSystem.currentWave;
        const damageMultiplier = Math.pow(ENEMY_DAMAGE_SCALING, waveNumber - 1);
        const damage = Math.floor(baseDamage * damageMultiplier);

        this.planet.takeDamage(damage);
        enemy.destroy();
        this.waveSystem.enemyDestroyed();

        // Extra screen shake for meteor impact
        if (enemy.isMeteor) {
          this.addScreenShake(12, 0.4);
          this.particleSystem.createExplosion(enemy.x, enemy.y, '#ff8800', 40);
        }

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

    // Check meteor-satellite collisions
    this.checkMeteorSatelliteCollisions();

    // Remove inactive entities
    this.projectiles = this.projectiles.filter(p => p.active);
    this.enemies = this.enemies.filter(e => e.active);
    this.satellites = this.satellites.filter(s => s.active);

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
        this.addScreenShake(5, 0.2);
      } else {
        const killed = enemy.takeDamage(projectile.damage);
        this.addDamageNumber(enemy.x, enemy.y, projectile.damage);

        // Add impact particles
        this.particleSystem.createImpact(enemy.x, enemy.y, projectile.getColor(), 8);

        if (killed) {
          this.enemyDestroyed(enemy);
          // Add explosion particles
          this.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color, 25);
          this.addScreenShake(3, 0.15);
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
            this.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color, 20);
          }
        }

        if (hitEnemies.length > 0) {
          this.addScreenShake(8, 0.3);
        }
      }
    }
  }

  checkMeteorSatelliteCollisions() {
    for (const enemy of this.enemies) {
      if (!enemy.active || !enemy.isMeteor) continue;

      for (const satellite of this.satellites) {
        if (!satellite.active) continue;

        const dist = distance(enemy.x, enemy.y, satellite.x, satellite.y);
        if (dist < enemy.radius + satellite.radius) {
          // Meteor damages satellite
          const destroyed = satellite.takeDamage(METEOR_DAMAGE_TO_SATELLITE);
          this.addDamageNumber(satellite.x, satellite.y, METEOR_DAMAGE_TO_SATELLITE);
          this.particleSystem.createImpact(satellite.x, satellite.y, '#ff8800', 15);
          this.addScreenShake(6, 0.25);

          if (destroyed) {
            // Satellite destroyed
            this.particleSystem.createExplosion(satellite.x, satellite.y, satellite.getColor(), 30);
            this.addScreenShake(8, 0.3);
          }

          // Meteor also takes damage
          const meteorKilled = enemy.takeDamage(50);
          this.addDamageNumber(enemy.x, enemy.y, 50);

          if (meteorKilled) {
            this.enemyDestroyed(enemy);
            this.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color, 35);
            this.addScreenShake(10, 0.35);
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

    // Check for new high scores
    const { isNewHighScore, isNewHighWave } = Storage.checkAndUpdateHighScore(
      this.score,
      this.waveSystem.currentWave
    );

    // Update high score in memory
    this.highScore = Storage.getHighScore();
    this.highWave = Storage.getHighWave();

    // Update UI
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalWave').textContent = this.waveSystem.currentWave;
    document.getElementById('gameOverHighScore').textContent = this.highScore;

    // Show high score celebration if applicable
    const highScoreMsg = document.getElementById('highScoreMessage');
    if (isNewHighScore) {
      highScoreMsg.style.display = 'block';
      highScoreMsg.classList.add('show');
    } else {
      highScoreMsg.style.display = 'none';
      highScoreMsg.classList.remove('show');
    }

    const gameOverEl = document.getElementById('gameOver');
    gameOverEl.style.display = 'block';
    gameOverEl.classList.add('show');

    // Screen shake for game over
    this.addScreenShake(15, 0.5);
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

    // Reset particles
    this.particleSystem.clear();

    // Reset screen shake
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

    // Reset wave system
    this.waveSystem.reset();
    this.startNextWave();

    // Hide game over screen
    const gameOverEl = document.getElementById('gameOver');
    gameOverEl.style.display = 'none';
    gameOverEl.classList.remove('show');
    document.getElementById('pauseBtn').textContent = 'Pause [P]';

    this.updateUI();
  }

  updateUI() {
    document.getElementById('energy').textContent = Math.floor(this.energy);
    document.getElementById('score').textContent = this.score;
    document.getElementById('highScore').textContent = this.highScore;
    document.getElementById('wave').textContent = this.waveSystem.currentWave;
    document.getElementById('health').textContent = Math.floor(this.planet.health);

    // Update button states and costs
    const buttons = {
      laserBtn: 'laser',
      missileBtn: 'missile',
      shieldBtn: 'shield'
    };

    for (const [btnId, weaponType] of Object.entries(buttons)) {
      const btn = document.getElementById(btnId);
      const cost = this.getSatelliteCost(weaponType);
      btn.disabled = this.energy < cost || this.state !== 'playing';

      // Update button text with current cost
      const label = weaponType.charAt(0).toUpperCase() + weaponType.slice(1);
      const hotkey = weaponType.charAt(0).toUpperCase();
      btn.textContent = `${label} [${hotkey}] - ${cost}E`;
    }
  }

  render() {
    this.renderer.renderFrame({
      planet: this.planet,
      satellites: this.satellites,
      enemies: this.enemies,
      projectiles: this.projectiles,
      particles: this.particleSystem.particles,
      damageNumbers: this.damageNumbers,
      isDragging: this.isDragging,
      dragX: this.dragX,
      dragY: this.dragY,
      dragOrbitRadius: this.dragOrbitRadius,
      dragWeaponType: this.dragWeaponType,
      canPlace: this.canPlace,
      screenShake: this.screenShake
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
