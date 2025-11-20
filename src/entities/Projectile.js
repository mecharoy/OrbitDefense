import { Entity } from './Entity.js';
import { PROJECTILE_SPEED, PROJECTILE_RADIUS, MISSILE_EXPLOSION_RADIUS, COLORS } from '../utils/constants.js';
import { distance, angle as calculateAngle } from '../utils/math.js';

export class Projectile extends Entity {
  constructor(x, y, targetX, targetY, type, damage) {
    super(x, y);

    this.type = type; // 'laser', 'missile'
    this.damage = damage;
    this.radius = PROJECTILE_RADIUS;
    this.speed = PROJECTILE_SPEED;

    this.targetX = targetX;
    this.targetY = targetY;
    this.angle = calculateAngle(x, y, targetX, targetY);

    // Missile-specific
    this.isExploding = false;
    this.explosionRadius = 0;
    this.explosionTime = 0;
    this.maxExplosionRadius = MISSILE_EXPLOSION_RADIUS;

    // Visual trail
    this.trail = [];
    this.maxTrailLength = 10;
  }

  update(deltaTime) {
    if (this.isExploding) {
      // Expand explosion
      const explosionDuration = 300; // milliseconds
      const elapsed = Date.now() - this.explosionTime;
      const progress = Math.min(elapsed / explosionDuration, 1);

      this.explosionRadius = this.maxExplosionRadius * progress;

      if (progress >= 1) {
        this.destroy();
      }
      return;
    }

    // Store position for trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Move projectile
    this.x += Math.cos(this.angle) * this.speed * deltaTime;
    this.y += Math.sin(this.angle) * this.speed * deltaTime;

    // Check if reached target (for missiles with tracking)
    if (this.type === 'missile') {
      const dist = distance(this.x, this.y, this.targetX, this.targetY);
      if (dist < 5) {
        this.explode();
      }
    }
  }

  explode() {
    if (this.type === 'missile') {
      this.isExploding = true;
      this.explosionTime = Date.now();
    } else {
      this.destroy();
    }
  }

  getColor() {
    return COLORS[this.type];
  }

  render(ctx) {
    ctx.save();

    if (this.isExploding) {
      // Draw explosion
      const alpha = 1 - (this.explosionRadius / this.maxExplosionRadius);

      // Outer ring
      ctx.strokeStyle = COLORS.explosion;
      ctx.globalAlpha = alpha * 0.6;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.explosionRadius
      );
      gradient.addColorStop(0, `rgba(255, 200, 0, ${alpha})`);
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw trail
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < this.trail.length; i++) {
        const pos = this.trail[i];
        const alpha = i / this.trail.length;
        ctx.globalAlpha = alpha * 0.5;

        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw projectile with glow
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 3
      );
      gradient.addColorStop(0, this.getColor());
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
      ctx.fill();

      // Projectile core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
