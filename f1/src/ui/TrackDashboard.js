import { TRACK_CONFIG, ROAD_TYPES } from '../utils/RoadConfig';

export class TrackDashboard {
    constructor() {
        this.displayWidth = 200;
        this.displayHeight = 200;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Precompute static track bounds once
        this.trackBounds = this.computeTrackBounds();
        this.staticCanvas = document.createElement('canvas');
        this.staticCtx = this.staticCanvas.getContext('2d');

        this.createDashboard();
        this.resizeCanvas(this.displayWidth, this.displayHeight);
    }

    computeTrackBounds() {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        TRACK_CONFIG.forEach(segment => {
            minX = Math.min(minX, segment.start.x, segment.end.x);
            maxX = Math.max(maxX, segment.start.x, segment.end.x);
            minZ = Math.min(minZ, segment.start.z, segment.end.z);
            maxZ = Math.max(maxZ, segment.start.z, segment.end.z);
        });

        const padding = 15;
        minX -= padding;
        maxX += padding;
        minZ -= padding;
        maxZ += padding;

        return {
            minX,
            maxX,
            minZ,
            maxZ,
            trackWidth: maxX - minX,
            trackHeight: maxZ - minZ,
            offsetX: (minX + maxX) / 2,
            offsetZ: (minZ + maxZ) / 2
        };
    }

    createDashboard() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            transition: all 0.3s ease;
        `;

        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            display: block;
        `;

        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        document.body.appendChild(this.container);
    }

    /**
     * Renders the static track map once onto an offscreen canvas
     */
    renderStaticTrack() {
        const width = this.displayWidth;
        const height = this.displayHeight;
        const { trackWidth, trackHeight, offsetX, offsetZ } = this.trackBounds;

        const scaleX = (width * 0.88) / trackWidth;
        const scaleZ = (height * 0.88) / trackHeight;
        this.scale = Math.min(scaleX, scaleZ);
        this.centerX = width / 2;
        this.centerY = height / 2;

        this.staticCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.staticCtx.clearRect(0, 0, width, height);

        this.staticCtx.strokeStyle = '#ffffff';
        this.staticCtx.lineWidth = 2.5;
        this.staticCtx.lineCap = 'round';
        this.staticCtx.lineJoin = 'round';
        this.staticCtx.beginPath();

        TRACK_CONFIG.forEach((segment, index) => {
            const startX = this.centerX - (segment.start.x - offsetX) * this.scale;
            const startZ = this.centerY - (segment.start.z - offsetZ) * this.scale;
            const endX = this.centerX - (segment.end.x - offsetX) * this.scale;
            const endZ = this.centerY - (segment.end.z - offsetZ) * this.scale;

            if (segment.type === ROAD_TYPES.STRAIGHT) {
                if (index === 0) {
                    this.staticCtx.moveTo(startX, startZ);
                }
                this.staticCtx.lineTo(endX, endZ);
            } else if (segment.type === ROAD_TYPES.CURVED) {
                const midX = (segment.start.x + segment.end.x) / 2;
                const midZ = (segment.start.z + segment.end.z) / 2;
                this.staticCtx.quadraticCurveTo(
                    this.centerX - (midX - offsetX) * this.scale,
                    this.centerY - (midZ - offsetZ) * this.scale,
                    endX,
                    endZ
                );
            }
        });

        this.staticCtx.closePath();
        this.staticCtx.stroke();
    }

    /**
     * Updates the minimap with the car's position and heading
     * @param {THREE.Vector3} carPosition
     * @param {number|Array} carRotationOrSegments
     * @param {number} [maybeRotation]
     */
    update(carPosition, carRotationOrSegments = 0, maybeRotation = 0) {
        const carRotation = typeof carRotationOrSegments === 'number'
            ? carRotationOrSegments
            : (typeof maybeRotation === 'number' ? maybeRotation : 0);

        const width = this.displayWidth;
        const height = this.displayHeight;
        const { offsetX, offsetZ } = this.trackBounds;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.staticCanvas, 0, 0);

        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        const carX = this.centerX - (carPosition.x - offsetX) * this.scale;
        const carZ = this.centerY - (carPosition.z - offsetZ) * this.scale;

        // Draw car position dot
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(carX, carZ, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw car direction indicator
        if (Number.isFinite(carRotation)) {
            this.ctx.strokeStyle = '#ff3333';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(carX, carZ);
            this.ctx.lineTo(
                this.centerX - (carPosition.x + Math.sin(carRotation) * 12 - offsetX) * this.scale,
                this.centerY - (carPosition.z + Math.cos(carRotation) * 12 - offsetZ) * this.scale
            );
            this.ctx.stroke();
        }
    }

    resizeCanvas(width, height) {
        this.displayWidth = width;
        this.displayHeight = height;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = width * this.dpr;
        this.canvas.height = height * this.dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.staticCanvas.width = width * this.dpr;
        this.staticCanvas.height = height * this.dpr;
        this.renderStaticTrack();
    }

    getObject() {
        return this.container;
    }
}
