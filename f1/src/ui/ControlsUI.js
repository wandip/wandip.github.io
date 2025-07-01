export class ControlsUI {
    constructor() {
        this.controlsUI = null;
        this.styleElement = null;
    }

    show() {
        if (this.controlsUI) return;

        this.controlsUI = document.createElement('div');
        this.controlsUI.id = 'controls-ui';
        this.controlsUI.innerHTML = `
            <div class="controls-container">
                <h3>🏎️ Controls</h3>
                <div class="controls-grid">
                    <div class="control-group">
                        <h4>Movement</h4>
                        <div class="control-row">
                            <span class="key">↑</span>/<span class="key">W</span>
                            <span class="action">Accelerate</span>
                        </div>
                        <div class="control-row">
                            <span class="key">↓</span>/<span class="key">S</span>
                            <span class="action">Reverse</span>
                        </div>
                        <div class="control-row">
                            <span class="key">←</span>/<span class="key">A</span>
                            <span class="action">Turn Left</span>
                        </div>
                        <div class="control-row">
                            <span class="key">→</span>/<span class="key">D</span>
                            <span class="action">Turn Right</span>
                        </div>
                        <div class="control-row">
                            <span class="key">Space</span>
                            <span class="action">Brake</span>
                        </div>
                    </div>
                    <div class="control-group">
                        <h4>Camera</h4>
                        <div class="control-row">
                            <span class="key">C</span>
                            <span class="action">Toggle View</span>
                        </div>
                    </div>
                    <div class="control-group">
                        <h4>Game</h4>
                        <div class="control-row">
                            <span class="key">R</span>
                            <span class="action">Restart Game</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.controlsUI.style.cssText = `
            position: fixed;
            top: 40%;
            right: 20px;
            left: auto;
            transform: translateY(-50%);
            background: #111;
            color: white;
            border-radius: 15px;
            padding: 18px 18px 18px 18px;
            font-family: 'Arial', sans-serif;
            z-index: 10000;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
            border: 2px solid #222;
            min-width: 300px;
            max-width: 400px;
            width: 350px;
            text-align: center;
        `;

        // Add CSS for the controls elements
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .controls-container h3 {
                margin: 0 0 16px 0;
                font-size: 20px;
                color: #ffd700;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }
            .controls-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 12px;
                margin-bottom: 12px;
            }
            .control-group h4 {
                margin: 0 0 10px 0;
                font-size: 15px;
                color: #87ceeb;
                border-bottom: 1px solid #444;
                padding-bottom: 3px;
            }
            .control-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
                padding: 2px 0;
            }
            .key {
                background: #222;
                color: #ecf0f1;
                padding: 3px 7px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                min-width: 24px;
                text-align: center;
                border: 1px solid #333;
                font-size: 13px;
            }
            .action {
                color: #bdc3c7;
                font-size: 12px;
            }
        `;
        document.head.appendChild(this.styleElement);
        document.body.appendChild(this.controlsUI);
    }

    hide() {
        if (this.controlsUI) {
            this.controlsUI.remove();
            this.controlsUI = null;
        }
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }
    }
} 