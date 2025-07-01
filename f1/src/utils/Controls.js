/**
 * Handles keyboard input and control state management
 */
export class Controls {
    constructor() {
        this.keys = {
            arrowup: false,
            arrowdown: false,
            arrowleft: false,
            arrowright: false,
            c: false,
            w: false,
            a: false,
            s: false,
            d: false,
            ' ': false, // Spacebar for brake
            r: false // R key for restart
        };

        this.setupEventListeners();
    }

    /**
     * Sets up keyboard event listeners
     */
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;
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
     * Checks if the restart key is pressed
     * @returns {boolean} - Whether the restart key is pressed
     */
    isRestartPressed() {
        return this.keys['r'];
    }


} 