export class LapTimer {
    constructor() {
        this.createTimer();
        this.startTime = null;
        this.timerInterval = null;
        this.running = false;
    }

    createTimer() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 10%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            padding: 10px 30px;
            border-radius: 10px;
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 40px;
            font-weight: bold;
            letter-spacing: 2px;
            z-index: 1001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        this.container.textContent = '00:00.000';
        document.body.appendChild(this.container);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.startTime = performance.now();
        this.timerInterval = setInterval(() => this.update(), 16);
    }

    stop() {
        this.running = false;
        clearInterval(this.timerInterval);
    }

    reset() {
        this.stop();
        this.container.textContent = '00:00.000';
    }

    update() {
        if (!this.running) return;
        const elapsed = performance.now() - this.startTime;
        this.container.textContent = this.formatTime(elapsed);
    }

    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const millis = Math.floor(ms % 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
    }

    getObject() {
        return this.container;
    }
} 