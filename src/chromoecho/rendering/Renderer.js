/**
 * ChromoEcho Renderer
 * Cyberpunk neon aesthetic with scanlines and glitch effects
 */
export class ChromoEchoRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Visual settings
    this.tileSize = 60;
    this.offsetX = 0;
    this.offsetY = 0;

    // Colors - Cyberpunk Neon palette
    this.colors = {
      background: '#0A0E27',
      grid: '#1a1f3d',
      wall: '#2a2f4d',
      wallHighlight: '#3a3f5d',
      floor: '#0d1230',
      player: '#00D9FF',
      playerGlow: 'rgba(0, 217, 255, 0.5)',
      ghost: 'rgba(0, 217, 255, 0.4)',
      ghostTrail: 'rgba(0, 217, 255, 0.2)',
      guard: '#FF2E63',
      guardVision: 'rgba(255, 46, 99, 0.15)',
      guardVisionAlert: 'rgba(255, 46, 99, 0.4)',
      pressurePlateActive: '#39FF14',
      pressurePlateInactive: '#1a4a0a',
      doorClosed: '#FF2E63',
      doorOpen: '#2EFF63',
      exit: '#FFD700',
      terminal: '#00FFFF',
      text: '#00D9FF',
      textShadow: 'rgba(0, 217, 255, 0.8)'
    };

    // Scanline effect
    this.scanlineOpacity = 0.03;
    this.time = 0;

    // Glitch effect
    this.glitchIntensity = 0;
    this.glitchTimer = 0;
  }

  /**
   * Set tile size and calculate offsets for centering
   */
  configure(levelWidth, levelHeight, tileSize) {
    this.tileSize = tileSize;
    this.offsetX = (this.width - levelWidth * tileSize) / 2;
    this.offsetY = (this.height - levelHeight * tileSize) / 2;
  }

  /**
   * Clear canvas with background
   */
  clear() {
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw background grid pattern
   */
  drawGrid(levelWidth, levelHeight) {
    this.ctx.strokeStyle = this.colors.grid;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.3;

    for (let x = 0; x <= levelWidth; x++) {
      const px = this.offsetX + x * this.tileSize;
      this.ctx.beginPath();
      this.ctx.moveTo(px, this.offsetY);
      this.ctx.lineTo(px, this.offsetY + levelHeight * this.tileSize);
      this.ctx.stroke();
    }

    for (let y = 0; y <= levelHeight; y++) {
      const py = this.offsetY + y * this.tileSize;
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX, py);
      this.ctx.lineTo(this.offsetX + levelWidth * this.tileSize, py);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw level layout (walls and floors)
   */
  drawLayout(layout) {
    for (let y = 0; y < layout.length; y++) {
      for (let x = 0; x < layout[y].length; x++) {
        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;

        if (layout[y][x] === 1) {
          // Wall
          this.ctx.fillStyle = this.colors.wall;
          this.ctx.fillRect(px, py, this.tileSize, this.tileSize);

          // Wall highlight (top-left edges)
          this.ctx.fillStyle = this.colors.wallHighlight;
          this.ctx.fillRect(px, py, this.tileSize, 2);
          this.ctx.fillRect(px, py, 2, this.tileSize);
        } else {
          // Floor
          this.ctx.fillStyle = this.colors.floor;
          this.ctx.fillRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
        }
      }
    }
  }

  /**
   * Draw pressure plate
   */
  drawPressurePlate(plate) {
    const px = this.offsetX + plate.tileX * this.tileSize + this.tileSize / 2;
    const py = this.offsetY + plate.tileY * this.tileSize + this.tileSize / 2;
    const radius = this.tileSize * 0.35;

    // Outer ring
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = plate.active ? this.colors.pressurePlateActive : this.colors.pressurePlateInactive;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Inner fill
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius * 0.7, 0, Math.PI * 2);
    this.ctx.fillStyle = plate.active ? this.colors.pressurePlateActive : this.colors.pressurePlateInactive;
    this.ctx.globalAlpha = plate.active ? 0.6 : 0.3;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    // Glow when active
    if (plate.active) {
      this.ctx.beginPath();
      this.ctx.arc(px, py, radius * 1.2, 0, Math.PI * 2);
      const gradient = this.ctx.createRadialGradient(px, py, radius * 0.5, px, py, radius * 1.5);
      gradient.addColorStop(0, 'rgba(57, 255, 20, 0.4)');
      gradient.addColorStop(1, 'rgba(57, 255, 20, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }

  /**
   * Draw door
   */
  drawDoor(door) {
    const px = this.offsetX + door.tileX * this.tileSize;
    const py = this.offsetY + door.tileY * this.tileSize;

    // Door frame
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // Door panel (slides based on openProgress)
    const slideOffset = door.openProgress * this.tileSize * 0.9;
    this.ctx.fillStyle = door.isOpen ? this.colors.doorOpen : this.colors.doorClosed;

    if (door.orientation === 'vertical') {
      // Slides up
      this.ctx.fillRect(px + 5, py + 5 - slideOffset, this.tileSize - 10, this.tileSize - 10);
    } else {
      // Slides left
      this.ctx.fillRect(px + 5 - slideOffset, py + 5, this.tileSize - 10, this.tileSize - 10);
    }

    // Glow effect
    if (!door.isOpen) {
      this.ctx.strokeStyle = this.colors.doorClosed;
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = this.colors.doorClosed;
      this.ctx.strokeRect(px + 3, py + 3, this.tileSize - 6, this.tileSize - 6);
      this.ctx.shadowBlur = 0;
    }
  }

  /**
   * Draw exit zone
   */
  drawExit(exit) {
    const px = this.offsetX + exit.tileX * this.tileSize;
    const py = this.offsetY + exit.tileY * this.tileSize;
    const centerX = px + this.tileSize / 2;
    const centerY = py + this.tileSize / 2;

    // Pulsing glow
    const glowIntensity = typeof exit.getGlowIntensity === 'function' ? exit.getGlowIntensity() : 0.8;

    // Outer glow
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.tileSize * 0.8
    );
    gradient.addColorStop(0, `rgba(255, 215, 0, ${0.4 * glowIntensity})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(px - 10, py - 10, this.tileSize + 20, this.tileSize + 20);

    // Exit symbol (arrow or star)
    this.ctx.fillStyle = this.colors.exit;
    this.ctx.font = `${this.tileSize * 0.5}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = this.colors.exit;
    this.ctx.fillText('★', centerX, centerY);
    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw player
   */
  drawPlayer(player) {
    const px = this.offsetX + player.x;
    const py = this.offsetY + player.y;

    // Glow effect
    const gradient = this.ctx.createRadialGradient(
      px, py, 0,
      px, py, player.radius * 2
    );
    gradient.addColorStop(0, `rgba(0, 217, 255, ${0.5 * player.glowIntensity})`);
    gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(px, py, player.radius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Main body
    this.ctx.fillStyle = this.colors.player;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = this.colors.player;
    this.ctx.beginPath();
    this.ctx.arc(px, py, player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(px - player.radius * 0.3, py - player.radius * 0.3, player.radius * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw ghost (past self)
   */
  drawGhost(ghost) {
    // Draw trail as a danger path - touching it causes paradox
    if (ghost.trail.length > 1) {
      // Draw connected trail line
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.offsetX + ghost.trail[0].x,
        this.offsetY + ghost.trail[0].y
      );

      for (let i = 1; i < ghost.trail.length; i++) {
        this.ctx.lineTo(
          this.offsetX + ghost.trail[i].x,
          this.offsetY + ghost.trail[i].y
        );
      }

      // Stroke with glowing effect
      this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
      this.ctx.lineWidth = ghost.radius * 1.2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();

      // Inner line
      this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
      this.ctx.lineWidth = ghost.radius * 0.6;
      this.ctx.stroke();
    }

    // Draw trail circles at each point
    for (let i = 0; i < ghost.trail.length; i++) {
      const trail = ghost.trail[i];
      const px = this.offsetX + trail.x;
      const py = this.offsetY + trail.y;
      const fade = 1 - (i / ghost.trail.length);

      this.ctx.fillStyle = `rgba(255, 80, 80, ${0.3 * fade})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, ghost.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    // Ghost body with glitch offset
    const px = this.offsetX + ghost.x + ghost.glitchOffset.x;
    const py = this.offsetY + ghost.y + ghost.glitchOffset.y;

    // Glow
    const gradient = this.ctx.createRadialGradient(px, py, 0, px, py, ghost.radius * 1.5);
    gradient.addColorStop(0, `rgba(0, 217, 255, ${0.3 * ghost.alpha})`);
    gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(px, py, ghost.radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Main body (with scanline effect)
    this.ctx.globalAlpha = ghost.alpha;
    this.ctx.fillStyle = this.colors.ghost;
    this.ctx.strokeStyle = this.colors.player;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.arc(px, py, ghost.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;

    // Loop number indicator
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = `bold ${ghost.radius}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.globalAlpha = ghost.alpha;
    this.ctx.fillText(`${ghost.loopIndex + 1}`, px, py);
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw guard with vision cone
   */
  drawGuard(guard) {
    const px = this.offsetX + guard.x;
    const py = this.offsetY + guard.y;

    // Vision cone
    const conePoints = guard.getVisionConePoints();
    this.ctx.beginPath();
    this.ctx.moveTo(this.offsetX + conePoints[0].x, this.offsetY + conePoints[0].y);
    for (let i = 1; i < conePoints.length; i++) {
      this.ctx.lineTo(this.offsetX + conePoints[i].x, this.offsetY + conePoints[i].y);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = guard.isAlert ? this.colors.guardVisionAlert : this.colors.guardVision;
    this.ctx.fill();

    // Guard body (triangle pointing in facing direction)
    this.ctx.save();
    this.ctx.translate(px, py);
    this.ctx.rotate(guard.facingAngle);

    this.ctx.fillStyle = this.colors.guard;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = this.colors.guard;
    this.ctx.beginPath();
    this.ctx.moveTo(guard.radius, 0);
    this.ctx.lineTo(-guard.radius * 0.7, -guard.radius * 0.7);
    this.ctx.lineTo(-guard.radius * 0.7, guard.radius * 0.7);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  /**
   * Draw scanline overlay effect
   */
  drawScanlines() {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${this.scanlineOpacity})`;
    for (let y = 0; y < this.height; y += 4) {
      this.ctx.fillRect(0, y, this.width, 2);
    }
  }

  /**
   * Draw CRT vignette effect
   */
  drawVignette() {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.3,
      this.width / 2, this.height / 2, this.height * 0.8
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw UI elements (timer, loop counter)
   */
  drawUI(gameState) {
    const { currentLoop, maxLoops, remainingTime, loopProgress } = gameState;

    // Timer bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = (this.width - barWidth) / 2;
    const barY = 30;

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Progress
    const progressWidth = barWidth * (1 - loopProgress);
    const hue = 180 - loopProgress * 120; // Cyan to red as time runs out
    this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    this.ctx.fillRect(barX, barY, progressWidth, barHeight);

    // Border
    this.ctx.strokeStyle = this.colors.text;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Time text
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = this.colors.textShadow;
    this.ctx.fillText(`${remainingTime.toFixed(1)}s`, this.width / 2, barY + barHeight + 20);

    // Loop counter
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillText(`LOOP ${currentLoop}/${maxLoops}`, this.width / 2, barY + barHeight + 50);

    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw tutorial text
   */
  drawTutorial(text, y = null) {
    if (!text) return;

    const lines = text.split('\n');
    const lineHeight = 28;
    const startY = y || this.height - 80;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, startY - 20, this.width, lines.length * lineHeight + 30);

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = this.colors.textShadow;

    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], this.width / 2, startY + i * lineHeight);
    }

    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw game over / level complete overlay
   */
  drawOverlay(type, stats = {}) {
    // Darken background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 20;

    if (type === 'complete') {
      this.ctx.fillStyle = '#39FF14';
      this.ctx.shadowColor = '#39FF14';
      this.ctx.font = 'bold 48px monospace';
      this.ctx.fillText('LEVEL COMPLETE', this.width / 2, this.height / 2 - 50);

      this.ctx.font = '24px monospace';
      this.ctx.fillText(`Loops Used: ${stats.loops}`, this.width / 2, this.height / 2 + 20);
      this.ctx.fillText(`Time: ${stats.time?.toFixed(1)}s`, this.width / 2, this.height / 2 + 55);
    } else if (type === 'paradox') {
      this.ctx.fillStyle = '#FF2E63';
      this.ctx.shadowColor = '#FF2E63';
      this.ctx.font = 'bold 48px monospace';
      this.ctx.fillText('PARADOX!', this.width / 2, this.height / 2 - 30);

      this.ctx.font = '20px monospace';
      this.ctx.fillText('You blocked your past self\'s path', this.width / 2, this.height / 2 + 30);
    } else if (type === 'failed') {
      this.ctx.fillStyle = '#FF2E63';
      this.ctx.shadowColor = '#FF2E63';
      this.ctx.font = 'bold 48px monospace';
      this.ctx.fillText('TIME COLLAPSED', this.width / 2, this.height / 2 - 30);

      this.ctx.font = '20px monospace';
      this.ctx.fillText('Out of loops - Try again', this.width / 2, this.height / 2 + 30);
    } else if (type === 'detected') {
      this.ctx.fillStyle = '#FF2E63';
      this.ctx.shadowColor = '#FF2E63';
      this.ctx.font = 'bold 48px monospace';
      this.ctx.fillText('DETECTED!', this.width / 2, this.height / 2 - 30);

      this.ctx.font = '20px monospace';
      this.ctx.fillText('The guard spotted you', this.width / 2, this.height / 2 + 30);
    }

    // Restart prompt
    this.ctx.fillStyle = this.colors.text;
    this.ctx.shadowColor = this.colors.textShadow;
    this.ctx.font = '18px monospace';
    this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 100);

    this.ctx.shadowBlur = 0;
  }

  /**
   * Update time for animations
   */
  updateTime(deltaTime) {
    this.time += deltaTime;
  }
}
