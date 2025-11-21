/**
 * ChromoEcho Entry Point
 * Time-Loop Heist Puzzle Game
 */
import { ChromoEchoGame } from './core/Game.js';

// Initialize game when DOM is ready
export function initChromoEcho(canvas) {
  if (!canvas) {
    console.error('Canvas element not found!');
    return null;
  }

  // Set canvas size
  canvas.width = 1200;
  canvas.height = 800;

  // Create game instance
  const game = new ChromoEchoGame(canvas);

  // Show loading message
  console.log('🕐 ChromoEcho: The Time-Loop Heist');
  console.log('Cooperate with your past selves to pull off impossible heists!');
  console.log('Controls:');
  console.log('  [WASD/Arrows] - Move');
  console.log('  [Space] - Interact');
  console.log('  [R] - Reset loop early');
  console.log('  [P/Escape] - Pause');

  return game;
}

// Standalone initialization for direct access
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('chromoEchoCanvas');
  if (canvas) {
    const game = initChromoEcho(canvas);
    if (game) {
      game.start();

      // Handle visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.state === 'playing') {
          game.togglePause();
        }
      });

      // Cleanup on unload
      window.addEventListener('beforeunload', () => {
        game.stop();
      });
    }
  }
});
