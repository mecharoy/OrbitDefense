import { Entity } from './Entity.js';
import { PLANET_RADIUS, CENTER_X, CENTER_Y, MAX_PLANET_RADIUS } from '../utils/constants.js';

export class Planet extends Entity {
  constructor() {
    super(CENTER_X, CENTER_Y);
    this.radius = PLANET_RADIUS;
    this.initialRadius = PLANET_RADIUS;
    this.maxRadius = MAX_PLANET_RADIUS;
    this.health = 100;
    this.maxHealth = 100;
    this.growthRate = 0; // Will be set based on game progress
  }

  update(deltaTime) {
    // Gradually expand planet
    if (this.growthRate > 0 && this.radius < this.maxRadius) {
      this.radius = Math.min(this.radius + this.growthRate * deltaTime, this.maxRadius);
    }
  }

  setGrowthRate(rate) {
    this.growthRate = rate;
  }

  expandRadius(amount) {
    this.radius = Math.min(this.radius + amount, this.maxRadius);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.destroy();
    }
  }

  render(ctx) {
    // Draw planet
    ctx.save();

    // Outer glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.5);
    gradient.addColorStop(0, 'rgba(65, 105, 225, 0.5)');
    gradient.addColorStop(1, 'rgba(65, 105, 225, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Planet body
    ctx.fillStyle = '#4169e1';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Surface details
    ctx.strokeStyle = '#2c5aa0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Health bar
    const barWidth = this.radius * 2;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.radius + 15;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.restore();
  }
}
