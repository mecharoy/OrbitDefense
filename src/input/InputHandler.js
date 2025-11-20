import { CENTER_X, CENTER_Y, ORBIT_RADII } from '../utils/constants.js';
import { distance, angle as calculateAngle } from '../utils/math.js';

export class InputHandler {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;

    this.isDragging = false;
    this.selectedWeaponType = null;

    this.mouseX = 0;
    this.mouseY = 0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  findClosestOrbit(x, y) {
    const distFromCenter = distance(x, y, CENTER_X, CENTER_Y);

    let closestOrbit = ORBIT_RADII[0];
    let minDiff = Math.abs(distFromCenter - closestOrbit);

    for (const orbitRadius of ORBIT_RADII) {
      const diff = Math.abs(distFromCenter - orbitRadius);
      if (diff < minDiff) {
        minDiff = diff;
        closestOrbit = orbitRadius;
      }
    }

    return closestOrbit;
  }

  handleMouseMove(e) {
    const pos = this.getMousePos(e);
    this.mouseX = pos.x;
    this.mouseY = pos.y;

    if (this.isDragging && this.selectedWeaponType) {
      const orbitRadius = this.findClosestOrbit(pos.x, pos.y);
      const angle = calculateAngle(CENTER_X, CENTER_Y, pos.x, pos.y);

      // Snap to orbit
      const snappedX = CENTER_X + Math.cos(angle) * orbitRadius;
      const snappedY = CENTER_Y + Math.sin(angle) * orbitRadius;

      this.game.updateDrag(snappedX, snappedY, orbitRadius);
    }
  }

  handleMouseDown(e) {
    // Handled by button clicks
  }

  handleMouseUp(e) {
    if (this.isDragging && this.selectedWeaponType) {
      this.game.placeSatellite();
      this.isDragging = false;
      this.selectedWeaponType = null;
    }
  }

  handleMouseLeave() {
    if (this.isDragging) {
      this.game.cancelDrag();
      this.isDragging = false;
      this.selectedWeaponType = null;
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = this.getMousePos(touch);
    this.mouseX = pos.x;
    this.mouseY = pos.y;
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.handleMouseMove(touch);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.handleMouseUp(e);
  }

  handleKeyDown(e) {
    switch (e.key.toLowerCase()) {
      case 'l':
        this.game.selectWeapon('laser');
        break;
      case 'm':
        this.game.selectWeapon('missile');
        break;
      case 's':
        this.game.selectWeapon('shield');
        break;
      case 'p':
        this.game.togglePause();
        break;
      case 'escape':
        if (this.isDragging) {
          this.game.cancelDrag();
          this.isDragging = false;
          this.selectedWeaponType = null;
        }
        break;
    }
  }

  startDragging(weaponType) {
    this.isDragging = true;
    this.selectedWeaponType = weaponType;
  }
}
