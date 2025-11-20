import {
  WAVE_DELAY,
  BASE_ENEMIES_PER_WAVE,
  ENEMY_INCREASE_PER_WAVE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CENTER_X,
  CENTER_Y
} from '../utils/constants.js';
import { randomRange, randomInt } from '../utils/math.js';

export class WaveSystem {
  constructor() {
    this.currentWave = 0;
    this.waveInProgress = false;
    this.waveDelay = WAVE_DELAY;
    this.lastWaveTime = 0;
    this.enemiesRemaining = 0;
  }

  startWave() {
    this.currentWave++;
    this.waveInProgress = true;
    return this.generateWave();
  }

  generateWave() {
    const enemies = [];
    const enemyCount = BASE_ENEMIES_PER_WAVE + (this.currentWave - 1) * ENEMY_INCREASE_PER_WAVE;
    this.enemiesRemaining = enemyCount;

    for (let i = 0; i < enemyCount; i++) {
      enemies.push(this.generateEnemy());
    }

    return enemies;
  }

  generateEnemy() {
    // Determine enemy type based on wave progression
    let type = 'basic';
    const rand = Math.random();

    if (this.currentWave >= 3) {
      if (rand < 0.3) type = 'fast';
      else if (rand < 0.6) type = 'basic';
      else if (rand < 0.85) type = 'tank';
      else type = 'shielded';
    } else if (this.currentWave >= 2) {
      if (rand < 0.4) type = 'fast';
      else if (rand < 0.8) type = 'basic';
      else type = 'tank';
    } else {
      type = rand < 0.7 ? 'basic' : 'fast';
    }

    // Determine movement pattern
    let pattern = 'straight';
    const patternRand = Math.random();

    if (this.currentWave >= 4) {
      if (patternRand < 0.4) pattern = 'straight';
      else if (patternRand < 0.7) pattern = 'spiral';
      else pattern = 'zigzag';
    } else if (this.currentWave >= 2) {
      pattern = patternRand < 0.7 ? 'straight' : 'spiral';
    }

    // Generate spawn position (from edges)
    const spawnData = this.generateSpawnPosition();

    return {
      x: spawnData.x,
      y: spawnData.y,
      type: type,
      pattern: pattern
    };
  }

  generateSpawnPosition() {
    const side = randomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
    const margin = 50;

    let x, y;

    switch (side) {
      case 0: // top
        x = randomRange(margin, CANVAS_WIDTH - margin);
        y = -margin;
        break;
      case 1: // right
        x = CANVAS_WIDTH + margin;
        y = randomRange(margin, CANVAS_HEIGHT - margin);
        break;
      case 2: // bottom
        x = randomRange(margin, CANVAS_WIDTH - margin);
        y = CANVAS_HEIGHT + margin;
        break;
      case 3: // left
        x = -margin;
        y = randomRange(margin, CANVAS_HEIGHT - margin);
        break;
    }

    return { x, y };
  }

  enemyDestroyed() {
    this.enemiesRemaining--;
    if (this.enemiesRemaining <= 0) {
      this.waveInProgress = false;
      this.lastWaveTime = Date.now();
    }
  }

  canStartNextWave(currentTime) {
    return !this.waveInProgress && (currentTime - this.lastWaveTime >= this.waveDelay);
  }

  reset() {
    this.currentWave = 0;
    this.waveInProgress = false;
    this.enemiesRemaining = 0;
    this.lastWaveTime = 0;
  }
}
