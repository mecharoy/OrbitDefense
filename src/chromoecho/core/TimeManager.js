/**
 * TimeManager - The brain of the time-loop system
 * Manages ticks, input recording, and timeline playback
 */
export class TimeManager {
  constructor(loopDuration = 15, maxLoops = 3) {
    this.TICKS_PER_SECOND = 60;
    this.loopDuration = loopDuration; // seconds
    this.maxTicks = loopDuration * this.TICKS_PER_SECOND;
    this.maxLoops = maxLoops;

    this.currentTick = 0;
    this.currentLoop = 1;
    this.isRunning = false;
    this.isPaused = false;

    // Input history for all completed loops
    this.loopHistory = []; // Array of recorded inputs per loop
    this.currentRecording = []; // Current loop's inputs being recorded

    // Fixed time step accumulator
    this.accumulator = 0;
    this.tickDuration = 1000 / this.TICKS_PER_SECOND; // ms per tick

    // Callbacks
    this.onLoopEnd = null;
    this.onLevelComplete = null;
    this.onParadox = null;
  }

  reset() {
    this.currentTick = 0;
    this.currentLoop = 1;
    this.loopHistory = [];
    this.currentRecording = [];
    this.accumulator = 0;
    this.isRunning = false;
    this.isPaused = false;
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  /**
   * Record an input frame
   * @param {Object} inputState - { keys: Set of pressed keys, action: boolean }
   */
  recordInput(inputState) {
    if (!this.isRunning || this.isPaused) return;

    // Record input every frame for accurate replay
    const keys = Array.from(inputState.keys || []);
    this.currentRecording.push({
      tick: this.currentTick,
      keys: keys,
      action: inputState.action || false
    });
  }

  /**
   * Get recorded input for a specific tick and loop
   * @param {number} loopIndex - Which past loop (0-indexed)
   * @param {number} tick - Which tick to query
   * @returns {Object|null} Input frame or null
   */
  getRecordedInput(loopIndex, tick) {
    if (loopIndex >= this.loopHistory.length) return null;

    const loopData = this.loopHistory[loopIndex];

    // Find input frame for this tick (or closest one before it)
    let bestMatch = null;
    for (const frame of loopData) {
      if (frame.tick === tick) {
        return frame; // Exact match
      }
      if (frame.tick < tick) {
        if (!bestMatch || frame.tick > bestMatch.tick) {
          bestMatch = frame;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Update time - call this every frame with deltaTime in ms
   * @param {number} deltaTime - Time since last frame in ms
   * @returns {number} Number of ticks to process this frame
   */
  update(deltaTime) {
    if (!this.isRunning || this.isPaused) return 0;

    this.accumulator += deltaTime;
    let ticksToProcess = 0;

    while (this.accumulator >= this.tickDuration) {
      this.accumulator -= this.tickDuration;
      ticksToProcess++;
      this.currentTick++;

      // Check if loop ended
      if (this.currentTick >= this.maxTicks) {
        this.endLoop();
        break;
      }
    }

    return ticksToProcess;
  }

  /**
   * End current loop and start next one
   */
  endLoop() {
    // Save current recording to history
    this.loopHistory.push([...this.currentRecording]);
    this.currentRecording = [];

    // Check if we've used all loops
    if (this.currentLoop >= this.maxLoops) {
      this.isRunning = false;
      if (this.onLoopEnd) {
        this.onLoopEnd({ failed: true, reason: 'out_of_loops' });
      }
      return;
    }

    // Start next loop
    this.currentLoop++;
    this.currentTick = 0;
    this.accumulator = 0;

    if (this.onLoopEnd) {
      this.onLoopEnd({ failed: false, loopNumber: this.currentLoop });
    }
  }

  /**
   * Manually reset loop (R key)
   */
  manualReset() {
    if (!this.isRunning || this.isPaused) return;
    this.endLoop();
  }

  /**
   * Trigger paradox - level fails
   */
  triggerParadox() {
    this.isRunning = false;
    if (this.onParadox) {
      this.onParadox();
    }
  }

  /**
   * Level completed successfully
   */
  completeLevel() {
    this.isRunning = false;
    if (this.onLevelComplete) {
      this.onLevelComplete({
        loops: this.currentLoop,
        totalTicks: this.currentTick + (this.currentLoop - 1) * this.maxTicks
      });
    }
  }

  /**
   * Get current progress as percentage
   */
  getLoopProgress() {
    return this.currentTick / this.maxTicks;
  }

  /**
   * Get remaining time in current loop (seconds)
   */
  getRemainingTime() {
    return (this.maxTicks - this.currentTick) / this.TICKS_PER_SECOND;
  }

  /**
   * Get number of ghost entities needed
   */
  getGhostCount() {
    return this.loopHistory.length;
  }
}
