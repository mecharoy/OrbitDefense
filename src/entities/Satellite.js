import { Entity } from './Entity.js';
import {
  CENTER_X,
  CENTER_Y,
  SATELLITE_RADIUS,
  SATELLITE_RANGE,
  SATELLITE_FIRE_RATE,
  SATELLITE_DAMAGE,
  ORBITAL_SPEED_BASE,
  COLORS
} from '../utils/constants.js';
import { polarToCartesian, normalizeAngle } from '../utils/math.js';

export class Satellite extends Entity {
  constructor(orbitRadius, initialAngle, weaponType) {
    const pos = polarToCartesian(CENTER_X, CENTER_Y, orbitRadius, initialAngle);
    super(pos.x, pos.y);

    this.orbitRadius = orbitRadius;
    this.angle = initialAngle;
    this.weaponType = weaponType; // 'laser', 'missile', 'shield'
    this.radius = SATELLITE_RADIUS;

    // Orbital mechanics - inner orbits move faster
    this.angularVelocity = ORBITAL_SPEED_BASE / (orbitRadius / 100);

    // Weapon properties
    this.range = SATELLITE_RANGE[weaponType];
    this.fireRate = SATELLITE_FIRE_RATE[weaponType];
    this.damage = SATELLITE_DAMAGE[weaponType];
    this.lastFireTime = 0;

    // Shield-specific properties
    this.shieldActive = false;
    this.shieldRadius = 0;
    this.maxShieldRadius = 60;
    this.protectedSatellites = new Set();
  }

  update(deltaTime) {
    // Update orbital position
    this.angle += this.angularVelocity * deltaTime;
    this.angle = normalizeAngle(this.angle);

    const pos = polarToCartesian(CENTER_X, CENTER_Y, this.orbitRadius, this.angle);
    this.x = pos.x;
    this.y = pos.y;

    // Update shield animation
    if (this.weaponType === 'shield') {
      this.shieldRadius = this.maxShieldRadius * (0.8 + Math.sin(Date.now() / 300) * 0.2);
    }
  }

  canFire(currentTime) {
    return currentTime - this.lastFireTime >= this.fireRate;
  }

  fire(currentTime) {
    this.lastFireTime = currentTime;
  }

  getColor() {
    return COLORS[this.weaponType];
  }

  render(ctx) {
    ctx.save();

    // Draw weapon range (semi-transparent)
    if (this.weaponType !== 'shield') {
      ctx.strokeStyle = this.getColor();
      ctx.globalAlpha = 0.1;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw shield field
    if (this.weaponType === 'shield') {
      ctx.strokeStyle = COLORS.shield;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.shieldRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Draw satellite body with glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
    gradient.addColorStop(0, this.getColor());
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Satellite core
    ctx.fillStyle = this.getColor();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Satellite detail
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
