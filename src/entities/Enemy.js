import { Entity } from './Entity.js';
import { ENEMY_TYPES, CENTER_X, CENTER_Y, PLANET_RADIUS } from '../utils/constants.js';
import { distance, angle as calculateAngle } from '../utils/math.js';

export class Enemy extends Entity {
  constructor(x, y, type, movementPattern = 'straight') {
    super(x, y);

    const typeData = ENEMY_TYPES[type];
    this.type = type;
    this.maxHealth = typeData.health;
    this.health = this.maxHealth;
    this.speed = typeData.speed;
    this.reward = typeData.reward;
    this.color = typeData.color;
    this.hasShield = typeData.hasShield || false;
    this.shieldActive = this.hasShield;

    this.radius = 10;
    this.movementPattern = movementPattern;

    // Movement-specific properties
    this.targetX = CENTER_X;
    this.targetY = CENTER_Y;
    this.angle = 0;
    this.spiralSpeed = 0.5; // radians per second
    this.currentRadius = distance(x, y, CENTER_X, CENTER_Y);

    // Visual effects
    this.flashTime = 0;
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      this.shieldActive = false;
      return false;
    }

    this.health -= amount;
    this.flashTime = Date.now();

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  update(deltaTime) {
    switch (this.movementPattern) {
      case 'straight':
        this.updateStraight(deltaTime);
        break;
      case 'spiral':
        this.updateSpiral(deltaTime);
        break;
      case 'zigzag':
        this.updateZigzag(deltaTime);
        break;
    }

    // Check if reached planet
    const distToPlanet = distance(this.x, this.y, CENTER_X, CENTER_Y);
    if (distToPlanet < PLANET_RADIUS + this.radius) {
      this.reachedPlanet = true;
    }
  }

  updateStraight(deltaTime) {
    const angle = calculateAngle(this.x, this.y, this.targetX, this.targetY);
    this.x += Math.cos(angle) * this.speed * deltaTime;
    this.y += Math.sin(angle) * this.speed * deltaTime;
  }

  updateSpiral(deltaTime) {
    this.angle += this.spiralSpeed * deltaTime;
    this.currentRadius = Math.max(this.currentRadius - this.speed * deltaTime, PLANET_RADIUS);

    this.x = CENTER_X + Math.cos(this.angle) * this.currentRadius;
    this.y = CENTER_Y + Math.sin(this.angle) * this.currentRadius;
  }

  updateZigzag(deltaTime) {
    const baseAngle = calculateAngle(this.x, this.y, this.targetX, this.targetY);
    const zigzag = Math.sin(Date.now() / 200) * 0.5;

    this.x += Math.cos(baseAngle + zigzag) * this.speed * deltaTime;
    this.y += Math.sin(baseAngle + zigzag) * this.speed * deltaTime;
  }

  render(ctx) {
    ctx.save();

    // Flash effect when hit
    const isFlashing = Date.now() - this.flashTime < 100;

    // Draw shield if active
    if (this.shieldActive) {
      ctx.strokeStyle = '#0ff';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Enemy glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Enemy body
    ctx.fillStyle = isFlashing ? '#fff' : this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Enemy detail
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 2;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.radius - 8;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const healthPercent = this.health / this.maxHealth;
      ctx.fillStyle = '#f00';
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    ctx.restore();
  }
}
