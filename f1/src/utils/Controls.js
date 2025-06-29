/**
 * Handles keyboard input and control state management
 */
export class Controls {
    constructor() {
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            c: false,
            w: false,
            a: false,
            s: false,
            d: false,
            ' ': false, // Spacebar for brake
            arrowup: false,
            arrowdown: false,
            arrowleft: false,
            arrowright: false
        };

        this.setupEventListeners();
    }

    /**
     * Sets up keyboard event listeners
     */
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key, 'Code:', e.code);
            if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
                console.log('Key registered:', e.key.toLowerCase(), 'State:', this.keys[e.key.toLowerCase()]);
            }
        });

        window.addEventListener('keyup', (e) => {
            console.log('Key released:', e.key, 'Code:', e.code);
            if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;
                console.log('Key unregistered:', e.key.toLowerCase(), 'State:', this.keys[e.key.toLowerCase()]);
            }
        });
    }

    /**
     * Checks if a specific key is pressed
     * @param {string} key - The key to check
     * @returns {boolean} - Whether the key is pressed
     */
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    /**
     * Checks if the camera toggle key is pressed
     * @returns {boolean} - Whether the camera toggle key is pressed
     */
    isCameraTogglePressed() {
        return this.keys['c'];
    }

    /**
     * Checks if any movement keys are pressed
     * @returns {boolean} - Whether any movement keys are pressed
     */
    isMoving() {
        return this.isKeyPressed('ArrowUp') || 
               this.isKeyPressed('ArrowDown') || 
               this.isKeyPressed('ArrowLeft') || 
               this.isKeyPressed('ArrowRight');
    }
} 