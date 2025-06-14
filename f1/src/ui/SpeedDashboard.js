export class SpeedDashboard {
    constructor() {
        this.createDashboard();
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

    update(speed) {
        // Convert speed to km/h (assuming speed is in units/second)
        const speedKmh = Math.round(Math.abs(speed) * 100);
        this.speedValue.textContent = speedKmh;
    }

    getObject() {
        return this.container;
    }
} 