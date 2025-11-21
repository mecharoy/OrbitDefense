/**
 * Interactive Objects for ChromoEcho
 * Pressure plates, doors, switches, terminals
 */

/**
 * Base class for interactive objects
 */
class InteractiveObject {
  constructor(tileX, tileY, tileSize) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.tileSize = tileSize;
    this.x = tileX * tileSize + tileSize / 2;
    this.y = tileY * tileSize + tileSize / 2;
    this.active = false;
  }

  /**
   * Check if an entity is on this object's tile
   */
  isEntityOn(entity) {
    const entityTileX = Math.floor(entity.x / this.tileSize);
    const entityTileY = Math.floor(entity.y / this.tileSize);
    return entityTileX === this.tileX && entityTileY === this.tileY;
  }

  reset() {
    this.active = false;
  }
}

/**
 * Pressure Plate - Activated when stood on
 */
export class PressurePlate extends InteractiveObject {
  constructor(tileX, tileY, tileSize, linkedDoorIds = []) {
    super(tileX, tileY, tileSize);
    this.linkedDoorIds = linkedDoorIds;
    this.wasActive = false;

    // Visual
    this.color = '#39FF14';
    this.inactiveColor = '#1a4a0a';
    this.pulsePhase = 0;
  }

  /**
   * Update pressure plate state
   * @param {Array} entities - All entities that can activate (player + ghosts)
   * @returns {boolean} Whether state changed
   */
  update(entities, deltaTime) {
    this.wasActive = this.active;
    this.active = false;

    // Check if any entity is standing on the plate
    for (const entity of entities) {
      if (this.isEntityOn(entity)) {
        this.active = true;
        break;
      }
    }

    // Update visual pulse
    this.pulsePhase += deltaTime * 4;

    return this.active !== this.wasActive;
  }

  /**
   * Get current color based on state
   */
  getCurrentColor() {
    if (this.active) {
      const pulse = 0.7 + Math.sin(this.pulsePhase) * 0.3;
      return this.color;
    }
    return this.inactiveColor;
  }
}

/**
 * Door - Opens when linked pressure plates are active
 */
export class Door extends InteractiveObject {
  constructor(tileX, tileY, tileSize, id, orientation = 'vertical') {
    super(tileX, tileY, tileSize);
    this.id = id;
    this.orientation = orientation; // 'vertical' or 'horizontal'
    this.isOpen = false;
    this.openProgress = 0; // 0 = closed, 1 = open

    // Visual
    this.closedColor = '#FF2E63';
    this.openColor = '#2EFF63';
    this.frameColor = '#444';
  }

  /**
   * Update door state based on linked pressure plates
   * @param {Array} pressurePlates - All pressure plates in level
   * @param {number} deltaTime
   */
  update(pressurePlates, deltaTime) {
    // Check if any linked plate is active
    const shouldBeOpen = pressurePlates.some(plate =>
      plate.linkedDoorIds.includes(this.id) && plate.active
    );

    this.isOpen = shouldBeOpen;

    // Animate open/close
    const targetProgress = this.isOpen ? 1 : 0;
    const speed = 5; // Animation speed

    if (this.openProgress < targetProgress) {
      this.openProgress = Math.min(this.openProgress + speed * deltaTime, 1);
    } else if (this.openProgress > targetProgress) {
      this.openProgress = Math.max(this.openProgress - speed * deltaTime, 0);
    }
  }

  /**
   * Check if door blocks passage
   */
  blocksPassage() {
    return !this.isOpen && this.openProgress < 0.5;
  }

  reset() {
    this.isOpen = false;
    this.openProgress = 0;
  }
}

/**
 * Exit Zone - Level complete when player reaches here
 */
export class ExitZone extends InteractiveObject {
  constructor(tileX, tileY, tileSize) {
    super(tileX, tileY, tileSize);
    this.color = '#FFD700';
    this.pulsePhase = 0;
  }

  update(deltaTime) {
    this.pulsePhase += deltaTime * 2;
  }

  /**
   * Check if player has reached the exit
   * Note: Only the live player can complete the level, not ghosts
   */
  isPlayerAtExit(player) {
    return this.isEntityOn(player);
  }

  /**
   * Get glow intensity for rendering
   */
  getGlowIntensity() {
    return 0.5 + Math.sin(this.pulsePhase) * 0.5;
  }
}

/**
 * Data Terminal - Requires standing still to hack
 */
export class DataTerminal extends InteractiveObject {
  constructor(tileX, tileY, tileSize, hackDuration = 5) {
    super(tileX, tileY, tileSize);
    this.hackDuration = hackDuration; // seconds to complete hack
    this.hackProgress = 0;
    this.isHacked = false;
    this.isBeingHacked = false;

    // Visual
    this.color = '#00FFFF';
    this.hackedColor = '#39FF14';
    this.progressColor = '#FFD700';
  }

  /**
   * Update terminal state
   * @param {Array} entities - Entities that can hack (player + ghosts with action)
   * @param {number} deltaTime
   */
  update(entities, deltaTime) {
    if (this.isHacked) return;

    this.isBeingHacked = false;

    // Check if any entity is hacking (on tile + action pressed)
    for (const entity of entities) {
      if (this.isEntityOn(entity) && entity.isInteracting) {
        this.isBeingHacked = true;
        this.hackProgress += deltaTime;

        if (this.hackProgress >= this.hackDuration) {
          this.isHacked = true;
          this.hackProgress = this.hackDuration;
        }
        break;
      }
    }

    // Progress decays slowly when not being hacked
    if (!this.isBeingHacked && this.hackProgress > 0) {
      this.hackProgress = Math.max(0, this.hackProgress - deltaTime * 0.5);
    }
  }

  /**
   * Get hack progress as percentage
   */
  getHackPercent() {
    return this.hackProgress / this.hackDuration;
  }

  reset() {
    this.hackProgress = 0;
    this.isHacked = false;
    this.isBeingHacked = false;
  }
}

/**
 * Noise Maker pickup - Can be thrown to distract guards
 */
export class NoiseMaker extends InteractiveObject {
  constructor(tileX, tileY, tileSize) {
    super(tileX, tileY, tileSize);
    this.isPickedUp = false;
    this.isThrown = false;
    this.throwX = 0;
    this.throwY = 0;
    this.noiseRadius = tileSize * 3;
    this.noiseActive = false;
    this.noiseTimer = 0;
    this.noiseDuration = 3; // seconds

    // Visual
    this.color = '#FF8800';
  }

  /**
   * Check if entity can pick up this noise maker
   */
  canPickup(entity) {
    return !this.isPickedUp && !this.isThrown && this.isEntityOn(entity);
  }

  /**
   * Throw the noise maker to a position
   */
  throw(x, y) {
    this.isThrown = true;
    this.throwX = x;
    this.throwY = y;
    this.noiseActive = true;
    this.noiseTimer = 0;
  }

  update(deltaTime) {
    if (this.noiseActive) {
      this.noiseTimer += deltaTime;
      if (this.noiseTimer >= this.noiseDuration) {
        this.noiseActive = false;
      }
    }
  }

  /**
   * Check if a guard would be attracted to the noise
   */
  wouldAttractGuard(guard) {
    if (!this.noiseActive) return false;

    const dx = this.throwX - guard.x;
    const dy = this.throwY - guard.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < this.noiseRadius;
  }

  reset() {
    this.isPickedUp = false;
    this.isThrown = false;
    this.noiseActive = false;
    this.noiseTimer = 0;
  }
}
