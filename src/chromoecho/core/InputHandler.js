/**
 * InputHandler for ChromoEcho
 * Captures keyboard/touch input and normalizes for deterministic replay
 */
export class InputHandler {
  constructor() {
    this.keys = new Set();
    this.actionPressed = false;
    this.actionJustPressed = false;
    this.resetPressed = false;
    this.pausePressed = false;

    // Touch controls state
    this.touchJoystick = { active: false, dx: 0, dy: 0 };
    this.touchAction = false;

    // Bound event handlers for cleanup
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);

    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);
    document.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    document.addEventListener('touchend', this.boundTouchEnd);
  }

  destroy() {
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    document.removeEventListener('touchstart', this.boundTouchStart);
    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend', this.boundTouchEnd);
  }

  handleKeyDown(e) {
    const key = this.normalizeKey(e.key);
    if (key) {
      e.preventDefault();

      if (key === 'ACTION') {
        if (!this.actionPressed) {
          this.actionJustPressed = true;
        }
        this.actionPressed = true;
      } else if (key === 'RESET') {
        this.resetPressed = true;
      } else if (key === 'PAUSE') {
        this.pausePressed = true;
      } else {
        this.keys.add(key);
      }
    }
  }

  handleKeyUp(e) {
    const key = this.normalizeKey(e.key);
    if (key) {
      if (key === 'ACTION') {
        this.actionPressed = false;
      } else if (key === 'RESET') {
        this.resetPressed = false;
      } else if (key === 'PAUSE') {
        this.pausePressed = false;
      } else {
        this.keys.delete(key);
      }
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;

    // Left half = joystick, right half = action
    if (touch.clientX < screenWidth / 2) {
      this.touchJoystick = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        dx: 0,
        dy: 0
      };
    } else {
      this.touchAction = true;
      this.actionPressed = true;
      this.actionJustPressed = true;
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (!this.touchJoystick.active) return;

    const touch = e.touches[0];
    const dx = touch.clientX - this.touchJoystick.startX;
    const dy = touch.clientY - this.touchJoystick.startY;

    // Normalize to -1 to 1 range with deadzone
    const deadzone = 20;
    const maxDist = 80;

    this.touchJoystick.dx = Math.abs(dx) > deadzone ?
      Math.max(-1, Math.min(1, dx / maxDist)) : 0;
    this.touchJoystick.dy = Math.abs(dy) > deadzone ?
      Math.max(-1, Math.min(1, dy / maxDist)) : 0;

    // Convert to key presses
    this.keys.clear();
    if (this.touchJoystick.dx < -0.3) this.keys.add('LEFT');
    if (this.touchJoystick.dx > 0.3) this.keys.add('RIGHT');
    if (this.touchJoystick.dy < -0.3) this.keys.add('UP');
    if (this.touchJoystick.dy > 0.3) this.keys.add('DOWN');
  }

  handleTouchEnd(e) {
    this.touchJoystick.active = false;
    this.touchJoystick.dx = 0;
    this.touchJoystick.dy = 0;
    this.keys.clear();

    if (this.touchAction) {
      this.touchAction = false;
      this.actionPressed = false;
    }
  }

  /**
   * Normalize key names for consistency
   */
  normalizeKey(key) {
    const keyMap = {
      'w': 'UP', 'W': 'UP', 'ArrowUp': 'UP',
      's': 'DOWN', 'S': 'DOWN', 'ArrowDown': 'DOWN',
      'a': 'LEFT', 'A': 'LEFT', 'ArrowLeft': 'LEFT',
      'd': 'RIGHT', 'D': 'RIGHT', 'ArrowRight': 'RIGHT',
      ' ': 'ACTION', 'Spacebar': 'ACTION',
      'r': 'RESET', 'R': 'RESET',
      'p': 'PAUSE', 'P': 'PAUSE', 'Escape': 'PAUSE'
    };
    return keyMap[key] || null;
  }

  /**
   * Get current input state for recording
   */
  getInputState() {
    return {
      keys: new Set(this.keys),
      action: this.actionPressed
    };
  }

  /**
   * Get movement direction as normalized vector
   */
  getMovementVector() {
    let dx = 0, dy = 0;

    if (this.keys.has('LEFT')) dx -= 1;
    if (this.keys.has('RIGHT')) dx += 1;
    if (this.keys.has('UP')) dy -= 1;
    if (this.keys.has('DOWN')) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }

  /**
   * Check and clear one-shot inputs
   */
  consumeActionPress() {
    const was = this.actionJustPressed;
    this.actionJustPressed = false;
    return was;
  }

  consumeResetPress() {
    const was = this.resetPressed;
    this.resetPressed = false;
    return was;
  }

  consumePausePress() {
    const was = this.pausePressed;
    this.pausePressed = false;
    return was;
  }

  /**
   * Clear all input state
   */
  clear() {
    this.keys.clear();
    this.actionPressed = false;
    this.actionJustPressed = false;
    this.resetPressed = false;
    this.pausePressed = false;
    this.touchJoystick = { active: false, dx: 0, dy: 0 };
    this.touchAction = false;
  }
}
