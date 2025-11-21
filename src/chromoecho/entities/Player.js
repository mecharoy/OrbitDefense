/**
 * Player Entity for ChromoEcho
 * The live player that the user controls
 */
export class Player {
  constructor(x, y, tileSize) {
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.radius = tileSize * 0.35;

    // Movement
    this.speed = tileSize * 4; // pixels per second
    this.vx = 0;
    this.vy = 0;

    // State
    this.isInteracting = false;
    this.interactionProgress = 0; // 0-1 for hack terminals

    // Visual
    this.color = '#00D9FF';
    this.glowIntensity = 1;
    this.pulsePhase = 0;
  }

  /**
   * Update player position based on input
   * @param {Object} input - { dx, dy, action } normalized movement
   * @param {number} deltaTime - Time step in seconds
   * @param {Function} collisionCheck - Function to check collision
   */
  update(input, deltaTime, collisionCheck) {
    // Update visual pulse
    this.pulsePhase += deltaTime * 3;
    this.glowIntensity = 0.8 + Math.sin(this.pulsePhase) * 0.2;

    // Calculate intended movement
    const moveX = input.dx * this.speed * deltaTime;
    const moveY = input.dy * this.speed * deltaTime;

    // Try horizontal movement
    const newX = this.x + moveX;
    if (!collisionCheck(newX, this.y, this.radius)) {
      this.x = newX;
    }

    // Try vertical movement
    const newY = this.y + moveY;
    if (!collisionCheck(this.x, newY, this.radius)) {
      this.y = newY;
    }

    // Update velocity for trail effects
    this.vx = input.dx * this.speed;
    this.vy = input.dy * this.speed;

    // Handle interaction
    this.isInteracting = input.action;
  }

  /**
   * Reset player to starting position
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isInteracting = false;
    this.interactionProgress = 0;
    this.pulsePhase = 0;
  }

  /**
   * Get bounding box for collision
   */
  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  /**
   * Check if player is on a specific tile
   */
  isOnTile(tileX, tileY) {
    const playerTileX = Math.floor(this.x / this.tileSize);
    const playerTileY = Math.floor(this.y / this.tileSize);
    return playerTileX === tileX && playerTileY === tileY;
  }

  /**
   * Get current tile coordinates
   */
  getTile() {
    return {
      x: Math.floor(this.x / this.tileSize),
      y: Math.floor(this.y / this.tileSize)
    };
  }
}
