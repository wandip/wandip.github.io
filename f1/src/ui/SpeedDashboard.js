import { GAME_CONFIG } from '../utils/Constants';

export class SpeedDashboard {
    constructor() {
        this.createDashboard();
        // Only create debug panel if debug mode is enabled
        if (GAME_CONFIG.DEBUG_MODE) {
            this.createDebugPanel();
        }
    }

    createDashboard() {
        // Create dashboard container
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 30px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
        `;

        // Create speed value display
        this.speedValue = document.createElement('div');
        this.speedValue.style.cssText = `
            font-size: 48px;
            font-weight: bold;
        `;

        // Create unit display
        this.unit = document.createElement('div');
        this.unit.style.cssText = `
            font-size: 24px;
            opacity: 0.8;
        `;
        this.unit.textContent = 'KM/H';

        // Add elements to container
        this.container.appendChild(this.speedValue);
        this.container.appendChild(this.unit);

        // Add to document
        document.body.appendChild(this.container);
    }

    createDebugPanel() {
        // Create debug panel container
        this.debugContainer = document.createElement('div');
        this.debugContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px;
            border-radius: 10px;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            z-index: 1000;
            min-width: 350px;
            max-width: 450px;
            border: 1px solid #00ff00;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Create debug title
        this.debugTitle = document.createElement('div');
        this.debugTitle.style.cssText = `
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            text-align: center;
            border-bottom: 1px solid #00ff00;
            padding-bottom: 5px;
        `;
        this.debugTitle.textContent = '🚗 DEBUG PANEL';

        // Create debug content
        this.debugContent = document.createElement('div');
        this.debugContent.innerHTML = `
            <div><strong>Position:</strong> <span id="debug-pos">Loading...</span></div>
            <div><strong>Velocity:</strong> <span id="debug-vel">Loading...</span></div>
            <div><strong>Speed:</strong> <span id="debug-speed">Loading...</span></div>
            <div><strong>Rotation:</strong> <span id="debug-rotation">Loading...</span></div>
            <div><strong>Engine Force:</strong> <span id="debug-engine">Loading...</span></div>
            <div><strong>Brake Force:</strong> <span id="debug-brake">Loading...</span></div>
            <div><strong>Input:</strong> <span id="debug-input">Loading...</span></div>
            <div><strong>Wheel Forces:</strong> <span id="debug-wheels">Loading...</span></div>
            <div><strong>Suspension:</strong> <span id="debug-suspension">Loading...</span></div>
            <div><strong>Physics Ready:</strong> <span id="debug-physics">Loading...</span></div>
            <div><strong>Delta Time:</strong> <span id="debug-delta">Loading...</span></div>
            <div><strong>Vehicle State:</strong> <span id="debug-vehicle">Loading...</span></div>
            <div><strong>Ground Contact:</strong> <span id="debug-ground">Loading...</span></div>
        `;

        // Add elements to debug container
        this.debugContainer.appendChild(this.debugTitle);
        this.debugContainer.appendChild(this.debugContent);

        // Add to document
        document.body.appendChild(this.debugContainer);
    }

    update(speed) {
        // Convert speed to km/h (assuming speed is in units/second)
        const speedKmh = Math.round(Math.abs(speed) * 100);
        this.speedValue.textContent = speedKmh;
    }

    updateDebug(data) {
        // Only update debug information if debug panel exists (debug mode is enabled)
        if (!this.debugContainer) {
            return;
        }
        
        // Update debug information
        const posEl = document.getElementById('debug-pos');
        const velEl = document.getElementById('debug-vel');
        const speedEl = document.getElementById('debug-speed');
        const rotationEl = document.getElementById('debug-rotation');
        const engineEl = document.getElementById('debug-engine');
        const brakeEl = document.getElementById('debug-brake');
        const inputEl = document.getElementById('debug-input');
        const wheelsEl = document.getElementById('debug-wheels');
        const suspensionEl = document.getElementById('debug-suspension');
        const physicsEl = document.getElementById('debug-physics');
        const deltaEl = document.getElementById('debug-delta');
        const vehicleEl = document.getElementById('debug-vehicle');
        const groundEl = document.getElementById('debug-ground');

        if (posEl) posEl.textContent = `X: ${data.position?.x || 'N/A'}, Y: ${data.position?.y || 'N/A'}, Z: ${data.position?.z || 'N/A'}`;
        if (velEl) velEl.textContent = `X: ${data.velocity?.x || 'N/A'}, Y: ${data.velocity?.y || 'N/A'}, Z: ${data.velocity?.z || 'N/A'}`;
        if (speedEl) speedEl.textContent = `${data.speed || 'N/A'} m/s`;
        if (rotationEl) rotationEl.textContent = `${data.rotation || 'N/A'}°`;
        if (engineEl) engineEl.textContent = `${data.engineForce || 'N/A'} N`;
        if (brakeEl) brakeEl.textContent = `${data.brakeForce || 'N/A'} N`;
        if (inputEl) inputEl.textContent = `F: ${data.input?.forward || '0'}, R: ${data.input?.right || '0'}, B: ${data.input?.brake || '0'}`;
        if (wheelsEl) wheelsEl.textContent = `[${data.wheelForces?.join(', ') || 'N/A'}]`;
        if (suspensionEl) suspensionEl.textContent = `[${data.suspension?.join(', ') || 'N/A'}]`;
        if (physicsEl) physicsEl.textContent = data.physicsReady ? '✅ Ready' : '❌ Not Ready';
        if (deltaEl) deltaEl.textContent = `${data.deltaTime || 'N/A'} s`;
        if (vehicleEl) vehicleEl.textContent = data.vehicleState || 'N/A';
        if (groundEl) groundEl.textContent = data.groundContact ? '✅ Contact' : '❌ No Contact';
    }

    getObject() {
        return this.container;
    }
} 