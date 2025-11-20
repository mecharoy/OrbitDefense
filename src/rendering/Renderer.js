import { CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, CENTER_Y, ORBIT_RADII, COLORS } from '../utils/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Enable image smoothing for better visuals
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  clear() {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  renderBackground() {
    // Draw starfield
    this.ctx.fillStyle = '#fff';
    this.ctx.globalAlpha = 0.8;

    for (let i = 0; i < 100; i++) {
      const x = (i * 137.508) % CANVAS_WIDTH; // Golden angle for distribution
      const y = (i * 223.618) % CANVAS_HEIGHT;
      const size = Math.random() * 2;

      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;

    // Draw orbital paths
    this.ctx.strokeStyle = COLORS.orbit;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.3;

    for (const radius of ORBIT_RADII) {
      this.ctx.beginPath();
      this.ctx.arc(CENTER_X, CENTER_Y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  renderPlanet(planet) {
    if (planet.active) {
      planet.render(this.ctx);
    }
  }

  renderSatellites(satellites) {
    for (const satellite of satellites) {
      if (satellite.active) {
        satellite.render(this.ctx);
      }
    }
  }

  renderEnemies(enemies) {
    for (const enemy of enemies) {
      if (enemy.active) {
        enemy.render(this.ctx);
      }
    }
  }

  renderProjectiles(projectiles) {
    for (const projectile of projectiles) {
      if (projectile.active) {
        projectile.render(this.ctx);
      }
    }
  }

  renderPlacementPreview(x, y, orbitRadius, weaponType, isValid) {
    this.ctx.save();

    // Draw orbit highlight
    this.ctx.strokeStyle = isValid ? '#0f0' : '#f00';
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.5;
    this.ctx.beginPath();
    this.ctx.arc(CENTER_X, CENTER_Y, orbitRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw preview satellite
    this.ctx.globalAlpha = isValid ? 0.7 : 0.3;
    const color = weaponType === 'laser' ? '#0f0' : weaponType === 'missile' ? '#f80' : '#00f';

    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 16);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 16, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  renderDamageNumber(x, y, damage, alpha) {
    this.ctx.save();

    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`-${damage}`, x, y);

    this.ctx.restore();
  }

  renderParticles(particles) {
    for (const particle of particles) {
      if (particle.active) {
        particle.render(this.ctx);
      }
    }
  }

  renderFrame(gameState) {
    this.ctx.save();

    // Apply screen shake
    if (gameState.screenShake) {
      this.ctx.translate(gameState.screenShake.x, gameState.screenShake.y);
    }

    this.clear();
    this.renderBackground();
    this.renderPlanet(gameState.planet);
    this.renderProjectiles(gameState.projectiles);
    this.renderEnemies(gameState.enemies);
    this.renderSatellites(gameState.satellites);
    this.renderParticles(gameState.particles || []);

    // Render damage numbers
    for (const dmg of gameState.damageNumbers) {
      this.renderDamageNumber(dmg.x, dmg.y, dmg.damage, dmg.alpha);
    }

    // Render placement preview if dragging
    if (gameState.isDragging && gameState.dragWeaponType) {
      this.renderPlacementPreview(
        gameState.dragX,
        gameState.dragY,
        gameState.dragOrbitRadius,
        gameState.dragWeaponType,
        gameState.canPlace
      );
    }

    this.ctx.restore();
  }
}
