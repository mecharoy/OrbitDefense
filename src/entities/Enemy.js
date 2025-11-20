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
    this.isMeteor = typeData.isMeteor || false;
    this.damageOnContact = typeData.damageOnContact || 0;

    this.radius = this.isMeteor ? 15 : 10;
    this.movementPattern = movementPattern;
    this.trailParticles = [];

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
    // Store previous position for trail
    if (this.isMeteor) {
      this.trailParticles.push({ x: this.x, y: this.y, alpha: 1 });
      if (this.trailParticles.length > 10) {
        this.trailParticles.shift();
      }
      // Fade trail
      for (const particle of this.trailParticles) {
        particle.alpha -= deltaTime * 2;
      }
    }

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

    // Draw meteor trail
    if (this.isMeteor && this.trailParticles.length > 0) {
      for (let i = 0; i < this.trailParticles.length; i++) {
        const particle = this.trailParticles[i];
        if (particle.alpha > 0) {
          ctx.globalAlpha = particle.alpha * 0.6;
          const size = (i / this.trailParticles.length) * this.radius;

          const trailGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, size * 2
          );
          trailGradient.addColorStop(0, '#ff8800');
          trailGradient.addColorStop(0.5, '#ff4400');
          trailGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

          ctx.fillStyle = trailGradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

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

    // Enemy glow - enhanced for meteors
    const glowRadius = this.isMeteor ? this.radius * 3 : this.radius * 2;
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Enemy body
    ctx.fillStyle = isFlashing ? '#fff' : this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Special meteor effects
    if (this.isMeteor) {
      // Jagged edges for rocky appearance
      ctx.strokeStyle = '#a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radiusVar = this.radius * (0.8 + Math.random() * 0.4);
        const px = this.x + Math.cos(angle) * radiusVar;
        const py = this.y + Math.sin(angle) * radiusVar;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Pulsing glow
      const pulseAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
      ctx.globalAlpha = pulseAlpha;
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Enemy detail (non-meteor)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 2;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.radius - 8;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const healthPercent = this.health / this.maxHealth;
      ctx.fillStyle = this.isMeteor ? '#ff8800' : '#f00';
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    ctx.restore();
  }
}
