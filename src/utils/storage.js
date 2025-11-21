// High score storage using localStorage

const HIGH_SCORE_KEY = 'orbitDefense_highScore';
const HIGH_WAVE_KEY = 'orbitDefense_highWave';

export class Storage {
  static getHighScore() {
    try {
      const score = localStorage.getItem(HIGH_SCORE_KEY);
      return score ? parseInt(score, 10) : 0;
    } catch (e) {
      console.warn('Failed to load high score from localStorage:', e);
      return 0;
    }
  }

  static setHighScore(score) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      return true;
    } catch (e) {
      console.warn('Failed to save high score to localStorage:', e);
      return false;
    }
  }

  static getHighWave() {
    try {
      const wave = localStorage.getItem(HIGH_WAVE_KEY);
      return wave ? parseInt(wave, 10) : 1;
    } catch (e) {
      console.warn('Failed to load high wave from localStorage:', e);
      return 1;
    }
  }

  static setHighWave(wave) {
    try {
      localStorage.setItem(HIGH_WAVE_KEY, wave.toString());
      return true;
    } catch (e) {
      console.warn('Failed to save high wave to localStorage:', e);
      return false;
    }
  }

  static checkAndUpdateHighScore(score, wave) {
    let isNewHighScore = false;
    let isNewHighWave = false;

    const currentHighScore = Storage.getHighScore();
    if (score > currentHighScore) {
      Storage.setHighScore(score);
      isNewHighScore = true;
    }

    const currentHighWave = Storage.getHighWave();
    if (wave > currentHighWave) {
      Storage.setHighWave(wave);
      isNewHighWave = true;
    }

    return { isNewHighScore, isNewHighWave };
  }

  static clearHighScores() {
    try {
      localStorage.removeItem(HIGH_SCORE_KEY);
      localStorage.removeItem(HIGH_WAVE_KEY);
      return true;
    } catch (e) {
      console.warn('Failed to clear high scores:', e);
      return false;
    }
  }
}
