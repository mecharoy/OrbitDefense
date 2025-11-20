import { Entity } from '../entities/Entity.js';

export class Particle extends Entity {
  constructor(x, y, vx, vy, color, size, lifetime) {
    super(x, y);
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.alpha = 1;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    this.lifetime -= deltaTime;
    this.alpha = this.lifetime / this.maxLifetime;

    if (this.lifetime <= 0) {
      this.destroy();
    }
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 4;
      const lifetime = 0.3 + Math.random() * 0.7;

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  createTrail(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 20;
      const vy = (Math.random() - 0.5) * 20;
      const size = 1 + Math.random() * 2;
      const lifetime = 0.2 + Math.random() * 0.3;

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  createImpact(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 50;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1 + Math.random() * 3;
      const lifetime = 0.2 + Math.random() * 0.4;

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(deltaTime);
      if (!this.particles[i].active) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const particle of this.particles) {
      particle.render(ctx);
    }
  }

  clear() {
    this.particles = [];
  }
}
