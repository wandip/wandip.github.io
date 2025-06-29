import { Game } from './core/Game.js';

// Create game container if it doesn't exist
if (!document.getElementById('game-container')) {
    const container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
}

// Create game instance
const game = new Game();

// Make game instance globally accessible for debugging
window.game = game; 