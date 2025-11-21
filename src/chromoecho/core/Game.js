/**
 * ChromoEcho Main Game Class
 * Manages the time-loop heist gameplay
 */
import { TimeManager } from './TimeManager.js';
import { InputHandler } from './InputHandler.js';
import { ChromoEchoRenderer } from '../rendering/Renderer.js';
import { Player } from '../entities/Player.js';
import { Ghost } from '../entities/Ghost.js';
import { Guard } from '../entities/Guard.js';
import { PressurePlate, Door, ExitZone } from '../entities/InteractiveObjects.js';
import { Level1, getLevelById } from '../levels/Level1.js';

export class ChromoEchoGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new ChromoEchoRenderer(canvas);
    this.inputHandler = new InputHandler();

    // Game state
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'complete', 'failed', 'paradox', 'detected'
    this.currentLevelId = 1;
    this.level = null;

    // Timing
    this.lastTime = 0;
    this.animationFrameId = null;

    // Tile size
    this.tileSize = 60;

    // Entities (initialized per level)
    this.timeManager = null;
    this.player = null;
    this.ghosts = [];
    this.guards = [];
    this.pressurePlates = [];
    this.doors = [];
    this.exits = [];

    // Level layout
    this.layout = [];

    // UI callback
    this.onStateChange = null;

    // Completion stats
    this.completionStats = null;
  }

  /**
   * Load a level by ID
   */
  loadLevel(levelId) {
    const level = getLevelById(levelId);
    if (!level) {
      console.error(`Level ${levelId} not found`);
      return false;
    }

    this.level = level;
    this.currentLevelId = levelId;
    this.layout = level.layout;

    // Calculate tile size to fit canvas
    const maxTileWidth = (this.canvas.width - 100) / level.width;
    const maxTileHeight = (this.canvas.height - 150) / level.height;
    this.tileSize = Math.floor(Math.min(maxTileWidth, maxTileHeight));

    // Configure renderer
    this.renderer.configure(level.width, level.height, this.tileSize);

    // Initialize time manager
    this.timeManager = new TimeManager(level.loopDuration, level.maxLoops);
    this.timeManager.onLoopEnd = this.handleLoopEnd.bind(this);
    this.timeManager.onParadox = this.handleParadox.bind(this);
    this.timeManager.onLevelComplete = this.handleLevelComplete.bind(this);

    // Initialize player
    const startX = level.playerStart.x * this.tileSize + this.tileSize / 2;
    const startY = level.playerStart.y * this.tileSize + this.tileSize / 2;
    this.player = new Player(startX, startY, this.tileSize);

    // Initialize ghosts (empty initially)
    this.ghosts = [];

    // Initialize guards
    this.guards = level.guards.map(guardData => {
      return new Guard(guardData.path, this.tileSize, {
        speed: guardData.speed * this.tileSize,
        waitTime: guardData.waitTime || 0.5
      });
    });

    // Initialize pressure plates
    this.pressurePlates = level.pressurePlates.map(plateData => {
      return new PressurePlate(
        plateData.x,
        plateData.y,
        this.tileSize,
        plateData.linkedDoorIds
      );
    });

    // Initialize doors
    this.doors = level.doors.map(doorData => {
      return new Door(
        doorData.x,
        doorData.y,
        this.tileSize,
        doorData.id,
        doorData.orientation
      );
    });

    // Initialize exits
    this.exits = level.exits.map(exitData => {
      return new ExitZone(exitData.x, exitData.y, this.tileSize);
    });

    this.state = 'playing';
    this.completionStats = null;

    return true;
  }

  /**
   * Reset current level
   */
  resetLevel() {
    if (!this.level) return;
    this.loadLevel(this.currentLevelId);
    this.timeManager.start();
  }

  /**
   * Handle end of a time loop
   */
  handleLoopEnd(result) {
    if (result.failed) {
      this.state = 'failed';
      if (this.onStateChange) this.onStateChange('failed');
      return;
    }

    // Create ghost from previous loop
    const startX = this.level.playerStart.x * this.tileSize + this.tileSize / 2;
    const startY = this.level.playerStart.y * this.tileSize + this.tileSize / 2;
    const ghost = new Ghost(startX, startY, this.tileSize, this.ghosts.length);
    this.ghosts.push(ghost);

    // Reset player position
    this.player.reset(startX, startY);

    // Reset all ghosts
    this.ghosts.forEach(g => g.reset());

    // Reset guards
    this.guards.forEach(g => g.reset());

    // Reset interactive objects
    this.pressurePlates.forEach(p => p.reset());
    this.doors.forEach(d => d.reset());

    // Clear input
    this.inputHandler.clear();
  }

  /**
   * Handle paradox (player blocked ghost)
   */
  handleParadox() {
    this.state = 'paradox';
    if (this.onStateChange) this.onStateChange('paradox');
  }

  /**
   * Handle level completion
   */
  handleLevelComplete(stats) {
    this.state = 'complete';
    this.completionStats = {
      loops: stats.loops,
      time: stats.totalTicks / 60 // Convert to seconds
    };
    if (this.onStateChange) this.onStateChange('complete');
  }

  /**
   * Check collision with walls and closed doors
   */
  checkCollision(x, y, radius) {
    // Check walls
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    // Check surrounding tiles
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = tileX + dx;
        const checkY = tileY + dy;

        // Out of bounds = wall
        if (checkY < 0 || checkY >= this.layout.length ||
            checkX < 0 || checkX >= this.layout[0].length) {
          if (this.circleRectCollision(x, y, radius,
              checkX * this.tileSize, checkY * this.tileSize,
              this.tileSize, this.tileSize)) {
            return true;
          }
          continue;
        }

        // Wall tile
        if (this.layout[checkY][checkX] === 1) {
          if (this.circleRectCollision(x, y, radius,
              checkX * this.tileSize, checkY * this.tileSize,
              this.tileSize, this.tileSize)) {
            return true;
          }
        }
      }
    }

    // Check closed doors
    for (const door of this.doors) {
      if (door.blocksPassage()) {
        if (this.circleRectCollision(x, y, radius,
            door.tileX * this.tileSize, door.tileY * this.tileSize,
            this.tileSize, this.tileSize)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Circle-rectangle collision detection
   */
  circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    const dx = cx - closestX;
    const dy = cy - closestY;

    return (dx * dx + dy * dy) < (cr * cr);
  }

  /**
   * Check if a position collides with any ghost (for movement blocking)
   */
  checkGhostCollision(x, y, radius) {
    for (const ghost of this.ghosts) {
      const dx = x - ghost.x;
      const dy = y - ghost.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius + ghost.radius * 0.8) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for paradox - any self colliding with another self
   * Returns true if paradox detected
   */
  checkParadox() {
    const allSelves = [this.player, ...this.ghosts];

    for (let i = 0; i < allSelves.length; i++) {
      for (let j = i + 1; j < allSelves.length; j++) {
        const a = allSelves[i];
        const b = allSelves[j];

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist * 0.9) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Main update loop
   */
  update(deltaTime) {
    if (this.state !== 'playing') return;

    // Handle pause
    if (this.inputHandler.consumePausePress()) {
      this.state = 'paused';
      if (this.onStateChange) this.onStateChange('paused');
      return;
    }

    // Handle manual reset
    if (this.inputHandler.consumeResetPress()) {
      this.timeManager.manualReset();
      return;
    }

    // Update time manager
    const deltaMs = deltaTime * 1000;
    this.timeManager.update(deltaMs);

    // Record current input
    this.timeManager.recordInput(this.inputHandler.getInputState());

    // Get player movement
    const movement = this.inputHandler.getMovementVector();
    const playerInput = {
      dx: movement.dx,
      dy: movement.dy,
      action: this.inputHandler.actionPressed
    };

    // Update player
    this.player.update(playerInput, deltaTime, (x, y, r) => {
      return this.checkCollision(x, y, r) || this.checkGhostCollision(x, y, r);
    });

    // Update ghosts (replay recorded inputs)
    for (let i = 0; i < this.ghosts.length; i++) {
      const ghost = this.ghosts[i];
      const recordedInput = this.timeManager.getRecordedInput(i, this.timeManager.currentTick);

      ghost.update(recordedInput, deltaTime, (x, y, r) => {
        // Ghosts collide with walls but not player (player causes paradox instead)
        return this.checkCollision(x, y, r);
      });
    }

    // Check for paradox - any self touching another self
    if (this.checkParadox()) {
      this.timeManager.triggerParadox();
      return;
    }

    // Update guards
    for (const guard of this.guards) {
      guard.update(deltaTime);

      // Check if guard sees player
      if (guard.canSeeEntity(this.player)) {
        this.state = 'detected';
        if (this.onStateChange) this.onStateChange('detected');
        return;
      }

      // Ghosts don't trigger guards (they're time echoes)
    }

    // Collect all entities for pressure plate checks
    const allEntities = [this.player, ...this.ghosts];

    // Update pressure plates
    for (const plate of this.pressurePlates) {
      plate.update(allEntities, deltaTime);
    }

    // Update doors
    for (const door of this.doors) {
      door.update(this.pressurePlates, deltaTime);
    }

    // Update exits
    for (const exit of this.exits) {
      exit.update(deltaTime);

      // Check if player reached exit
      if (exit.isPlayerAtExit(this.player)) {
        this.timeManager.completeLevel();
        return;
      }
    }

    // Update renderer time
    this.renderer.updateTime(deltaTime);
  }

  /**
   * Render current frame
   */
  render() {
    this.renderer.clear();

    if (!this.level) return;

    // Draw grid
    this.renderer.drawGrid(this.level.width, this.level.height);

    // Draw layout
    this.renderer.drawLayout(this.layout);

    // Draw exits
    for (const exit of this.exits) {
      this.renderer.drawExit(exit);
    }

    // Draw pressure plates
    for (const plate of this.pressurePlates) {
      this.renderer.drawPressurePlate(plate);
    }

    // Draw doors
    for (const door of this.doors) {
      this.renderer.drawDoor(door);
    }

    // Draw guards
    for (const guard of this.guards) {
      this.renderer.drawGuard(guard);
    }

    // Draw ghosts
    for (const ghost of this.ghosts) {
      this.renderer.drawGhost(ghost);
    }

    // Draw player
    if (this.player) {
      this.renderer.drawPlayer(this.player);
    }

    // Draw scanlines and vignette
    this.renderer.drawScanlines();
    this.renderer.drawVignette();

    // Draw UI
    if (this.timeManager) {
      this.renderer.drawUI({
        currentLoop: this.timeManager.currentLoop,
        maxLoops: this.timeManager.maxLoops,
        remainingTime: this.timeManager.getRemainingTime(),
        loopProgress: this.timeManager.getLoopProgress()
      });
    }

    // Draw tutorial text
    if (this.level.tutorial) {
      const tutorialText = this.timeManager.currentLoop === 1 ?
        this.level.tutorial.start :
        this.level.tutorial.loop2 || this.level.tutorial.start;
      this.renderer.drawTutorial(tutorialText);
    }

    // Draw overlays for game states
    if (this.state === 'complete') {
      this.renderer.drawOverlay('complete', this.completionStats);
    } else if (this.state === 'paradox') {
      this.renderer.drawOverlay('paradox');
    } else if (this.state === 'failed') {
      this.renderer.drawOverlay('failed');
    } else if (this.state === 'detected') {
      this.renderer.drawOverlay('detected');
    }
  }

  /**
   * Main game loop
   */
  gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Handle restart in failed states
    if (['failed', 'paradox', 'complete', 'detected'].includes(this.state)) {
      if (this.inputHandler.consumeResetPress()) {
        this.resetLevel();
      }
    }

    // Handle pause resume
    if (this.state === 'paused') {
      if (this.inputHandler.consumePausePress()) {
        this.state = 'playing';
        if (this.onStateChange) this.onStateChange('playing');
      }
    }

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * Start the game
   */
  start() {
    this.loadLevel(this.currentLevelId);
    this.timeManager.start();
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * Stop the game
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.inputHandler.destroy();
  }

  /**
   * Load next level
   */
  nextLevel() {
    const nextId = this.currentLevelId + 1;
    if (this.loadLevel(nextId)) {
      this.timeManager.start();
    } else {
      // No more levels - show completion
      console.log('All levels complete!');
    }
  }

  /**
   * Toggle pause
   */
  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.timeManager.pause();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.timeManager.resume();
    }
    if (this.onStateChange) this.onStateChange(this.state);
  }
}
