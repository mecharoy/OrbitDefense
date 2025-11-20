import { Game } from './core/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Ensure canvas has proper size
  const resizeCanvas = () => {
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 40;
    const aspectRatio = 1200 / 800;

    let width = 1200;
    let height = 800;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Initialize game
  const game = new Game(canvas);

  // Show loading message
  console.log('🚀 Orbit Defense');
  console.log('Defend your planet from incoming threats!');
  console.log('Controls:');
  console.log('  [L] - Place Laser Satellite (20 Energy)');
  console.log('  [M] - Place Missile Satellite (50 Energy)');
  console.log('  [S] - Place Shield Satellite (80 Energy)');
  console.log('  [P] - Pause/Resume');

  // Start game
  game.start();

  // Handle visibility change to pause when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'playing') {
      game.togglePause();
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    game.stop();
  });
});
