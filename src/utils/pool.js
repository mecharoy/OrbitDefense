// Object pool for performance optimization

export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.available = [];
    this.inUse = [];

    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.createFn());
    }
  }

  acquire() {
    let obj;
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = this.createFn();
    }
    this.inUse.push(obj);
    return obj;
  }

  release(obj) {
    const index = this.inUse.indexOf(obj);
    if (index > -1) {
      this.inUse.splice(index, 1);
      this.resetFn(obj);
      this.available.push(obj);
    }
  }

  releaseAll() {
    while (this.inUse.length > 0) {
      const obj = this.inUse.pop();
      this.resetFn(obj);
      this.available.push(obj);
    }
  }

  getInUse() {
    return this.inUse;
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.length,
      total: this.available.length + this.inUse.length
    };
  }
}
