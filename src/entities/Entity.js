// Base entity class

export class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
  }

  update(deltaTime) {
    // Override in subclasses
  }

  render(ctx) {
    // Override in subclasses
  }

  destroy() {
    this.active = false;
  }
}
