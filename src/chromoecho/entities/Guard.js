/**
 * Guard Entity for ChromoEcho
 * Patrols predetermined paths with vision cones
 */
export class Guard {
  constructor(patrolPath, tileSize, config = {}) {
    this.patrolPath = patrolPath; // Array of {x, y} tile coordinates
    this.tileSize = tileSize;

    // Position (pixel coordinates)
    this.x = patrolPath[0].x * tileSize + tileSize / 2;
    this.y = patrolPath[0].y * tileSize + tileSize / 2;

    // Patrol state
    this.currentPathIndex = 0;
    this.targetPathIndex = 1;
    this.speed = config.speed || tileSize * 1.5; // Slower than player
    this.waitTime = config.waitTime || 0.5; // Pause at each waypoint
    this.currentWait = 0;
    this.isWaiting = false;

    // Vision cone
    this.visionRange = config.visionRange || tileSize * 4;
    this.visionAngle = config.visionAngle || Math.PI / 3; // 60 degrees
    this.facingAngle = 0; // Direction guard is facing

    // Appearance
    this.radius = tileSize * 0.4;
    this.color = '#FF2E63';
    this.visionColor = 'rgba(255, 46, 99, 0.2)';
    this.alertColor = 'rgba(255, 46, 99, 0.5)';

    // State
    this.isAlert = false;
    this.alertTimer = 0;

    // Calculate initial facing angle
    this.updateFacingAngle();
  }

  /**
   * Update guard position and state
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime) {
    // Update alert visual
    if (this.isAlert) {
      this.alertTimer += deltaTime;
    }

    // Handle waiting at waypoints
    if (this.isWaiting) {
      this.currentWait += deltaTime;
      if (this.currentWait >= this.waitTime) {
        this.isWaiting = false;
        this.currentWait = 0;
        this.advanceToNextWaypoint();
      }
      return;
    }

    // Move toward current target
    const target = this.patrolPath[this.targetPathIndex];
    const targetX = target.x * this.tileSize + this.tileSize / 2;
    const targetY = target.y * this.tileSize + this.tileSize / 2;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      // Reached waypoint
      this.x = targetX;
      this.y = targetY;
      this.currentPathIndex = this.targetPathIndex;
      this.isWaiting = true;
    } else {
      // Move toward target
      const moveX = (dx / dist) * this.speed * deltaTime;
      const moveY = (dy / dist) * this.speed * deltaTime;
      this.x += moveX;
      this.y += moveY;

      // Update facing angle while moving
      this.facingAngle = Math.atan2(dy, dx);
    }
  }

  /**
   * Move to next waypoint in patrol
   */
  advanceToNextWaypoint() {
    this.targetPathIndex = (this.targetPathIndex + 1) % this.patrolPath.length;
    this.updateFacingAngle();
  }

  /**
   * Update facing angle toward next waypoint
   */
  updateFacingAngle() {
    const target = this.patrolPath[this.targetPathIndex];
    const targetX = target.x * this.tileSize + this.tileSize / 2;
    const targetY = target.y * this.tileSize + this.tileSize / 2;
    this.facingAngle = Math.atan2(targetY - this.y, targetX - this.x);
  }

  /**
   * Check if a point is within the guard's vision cone
   * @param {number} px - Point x
   * @param {number} py - Point y
   * @returns {boolean}
   */
  canSee(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check distance
    if (dist > this.visionRange) return false;

    // Check angle
    const angleToPoint = Math.atan2(dy, dx);
    let angleDiff = angleToPoint - this.facingAngle;

    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    return Math.abs(angleDiff) <= this.visionAngle / 2;
  }

  /**
   * Check if guard can see player or ghost
   * @param {Player|Ghost} entity
   * @returns {boolean}
   */
  canSeeEntity(entity) {
    return this.canSee(entity.x, entity.y);
  }

  /**
   * Reset guard to starting position
   */
  reset() {
    this.currentPathIndex = 0;
    this.targetPathIndex = 1 % this.patrolPath.length;
    this.x = this.patrolPath[0].x * this.tileSize + this.tileSize / 2;
    this.y = this.patrolPath[0].y * this.tileSize + this.tileSize / 2;
    this.isWaiting = false;
    this.currentWait = 0;
    this.isAlert = false;
    this.alertTimer = 0;
    this.updateFacingAngle();
  }

  /**
   * Get vision cone polygon points for rendering
   * @returns {Array} Array of {x, y} points
   */
  getVisionConePoints() {
    const points = [{ x: this.x, y: this.y }];
    const segments = 12;

    for (let i = 0; i <= segments; i++) {
      const angle = this.facingAngle - this.visionAngle / 2 +
                   (this.visionAngle * i / segments);
      points.push({
        x: this.x + Math.cos(angle) * this.visionRange,
        y: this.y + Math.sin(angle) * this.visionRange
      });
    }

    return points;
  }
}
