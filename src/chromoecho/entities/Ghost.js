/**
 * Ghost Entity for ChromoEcho
 * Replays recorded inputs from previous time loops
 */
export class Ghost {
  constructor(x, y, tileSize, loopIndex) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.radius = tileSize * 0.35;
    this.loopIndex = loopIndex; // Which past loop this ghost represents

    // Movement (same as player)
    this.speed = tileSize * 4;
    this.vx = 0;
    this.vy = 0;

    // State
    this.isInteracting = false;
    this.isBlocked = false; // For paradox detection
    this.expectedX = x;
    this.expectedY = y;

    // Visual - faded cyan with glitch
    this.baseAlpha = 0.5;
    this.alpha = this.baseAlpha;
    this.glitchOffset = { x: 0, y: 0 };
    this.glitchTimer = 0;

    // Trail effect
    this.trail = [];
    this.maxTrailLength = 8;
  }

  /**
   * Update ghost position by replaying recorded input
   * @param {Object|null} recordedInput - Input frame from TimeManager
   * @param {number} deltaTime - Time step
   * @param {Function} collisionCheck - Collision check function
   */
  update(recordedInput, deltaTime, collisionCheck) {
    // Update trail
    if (this.vx !== 0 || this.vy !== 0) {
      this.trail.unshift({ x: this.x, y: this.y, alpha: this.alpha });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.pop();
      }
    }

    // Fade trail
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha *= 0.85;
    }

    // Update glitch effect
    this.glitchTimer += deltaTime;
    if (Math.random() < 0.02) {
      this.glitchOffset.x = (Math.random() - 0.5) * 4;
      this.glitchOffset.y = (Math.random() - 0.5) * 4;
      this.alpha = this.baseAlpha * (0.3 + Math.random() * 0.7);
    } else {
      this.glitchOffset.x *= 0.9;
      this.glitchOffset.y *= 0.9;
      this.alpha = this.baseAlpha;
    }

    // No input recorded for this tick - ghost stays still
    if (!recordedInput) {
      this.vx = 0;
      this.vy = 0;
      this.isInteracting = false;
      return;
    }

    // Convert recorded keys to movement
    const input = this.keysToMovement(recordedInput.keys);
    this.isInteracting = recordedInput.action;

    // Calculate movement
    const moveX = input.dx * this.speed * deltaTime;
    const moveY = input.dy * this.speed * deltaTime;

    // Calculate expected position (where ghost SHOULD be)
    this.expectedX = this.x + moveX;
    this.expectedY = this.y + moveY;

    // Try to move (may be blocked by player causing paradox)
    const newX = this.x + moveX;
    if (!collisionCheck(newX, this.y, this.radius)) {
      this.x = newX;
    } else {
      this.isBlocked = true;
    }

    const newY = this.y + moveY;
    if (!collisionCheck(this.x, newY, this.radius)) {
      this.y = newY;
    } else {
      this.isBlocked = true;
    }

    this.vx = input.dx * this.speed;
    this.vy = input.dy * this.speed;
  }

  /**
   * Convert recorded key array to movement vector
   */
  keysToMovement(keys) {
    let dx = 0, dy = 0;

    if (keys.includes('LEFT')) dx -= 1;
    if (keys.includes('RIGHT')) dx += 1;
    if (keys.includes('UP')) dy -= 1;
    if (keys.includes('DOWN')) dy += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }

  /**
   * Reset ghost for new loop
   */
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.isInteracting = false;
    this.isBlocked = false;
    this.trail = [];
    this.expectedX = this.startX;
    this.expectedY = this.startY;
  }

  /**
   * Check if ghost is on a specific tile
   */
  isOnTile(tileX, tileY) {
    const ghostTileX = Math.floor(this.x / this.tileSize);
    const ghostTileY = Math.floor(this.y / this.tileSize);
    return ghostTileX === tileX && ghostTileY === tileY;
  }

  /**
   * Get bounding box
   */
  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
}
