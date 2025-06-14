import { Game } from './core/Game';

// Create game container if it doesn't exist
if (!document.getElementById('game-container')) {
    const container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
}

// Start the game
new Game(); 