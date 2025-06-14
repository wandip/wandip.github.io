import * as THREE from 'three';
import { TRACK_CONFIG, ROAD_TYPES } from '../utils/RoadConfig';

export class TrackDashboard {
    constructor() {
        this.createDashboard();
    }

    createDashboard() {
        // Create dashboard container
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
        `;

        // Create canvas for track view
        this.canvas = document.createElement('canvas');
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.canvas.style.cssText = `
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
        `;

        // Get canvas context
        this.ctx = this.canvas.getContext('2d');

        // Add canvas to container
        this.container.appendChild(this.canvas);

        // Add to document
        document.body.appendChild(this.container);
    }

    update(carPosition, carRotation) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate track bounds
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        TRACK_CONFIG.forEach(segment => {
            minX = Math.min(minX, segment.start.x, segment.end.x);
            maxX = Math.max(maxX, segment.start.x, segment.end.x);
            minZ = Math.min(minZ, segment.start.z, segment.end.z);
            maxZ = Math.max(maxZ, segment.start.z, segment.end.z);
        });

        // Add padding to bounds
        const padding = 10;
        minX -= padding;
        maxX += padding;
        minZ -= padding;
        maxZ += padding;

        // Calculate scale to fit track in canvas
        const trackWidth = maxX - minX;
        const trackHeight = maxZ - minZ;
        const scaleX = (this.canvas.width * 0.9) / trackWidth;
        const scaleZ = (this.canvas.height * 0.9) / trackHeight;
        const scale = Math.min(scaleX, scaleZ);

        // Calculate center offset
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const offsetX = (minX + maxX) / 2;
        const offsetZ = (minZ + maxZ) / 2;

        // Draw road segments
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        TRACK_CONFIG.forEach((segment, index) => {
            const startX = centerX - (segment.start.x - offsetX) * scale;
            const startZ = centerY - (segment.start.z - offsetZ) * scale;
            const endX = centerX - (segment.end.x - offsetX) * scale;
            const endZ = centerY - (segment.end.z - offsetZ) * scale;

            if (segment.type === ROAD_TYPES.STRAIGHT) {
                if (index === 0) {
                    this.ctx.moveTo(startX, startZ);
                }
                this.ctx.lineTo(endX, endZ);
            } else if (segment.type === ROAD_TYPES.CURVED) {
                // Calculate curve parameters
                const dx = segment.end.x - segment.start.x;
                const dz = segment.end.z - segment.start.z;
                const radius = Math.sqrt(dx * dx + dz * dz) / 2;
                
                // Calculate control points for the curve
                const midX = (segment.start.x + segment.end.x) / 2;
                const midZ = (segment.start.z + segment.end.z) / 2;
                
                // Draw the curve using quadratic bezier
                this.ctx.quadraticCurveTo(
                    centerX - (midX - offsetX) * scale,
                    centerY - (midZ - offsetZ) * scale,
                    endX,
                    endZ
                );
            }
        });

        this.ctx.stroke();

        // Draw car position
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(
            centerX - (carPosition.x - offsetX) * scale,
            centerY - (carPosition.z - offsetZ) * scale,
            5,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Draw car direction indicator
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(
            centerX - (carPosition.x - offsetX) * scale,
            centerY - (carPosition.z - offsetZ) * scale
        );
        this.ctx.lineTo(
            centerX - (carPosition.x + Math.sin(carRotation) * 10 - offsetX) * scale,
            centerY - (carPosition.z + Math.cos(carRotation) * 10 - offsetZ) * scale
        );
        this.ctx.stroke();
    }

    getObject() {
        return this.container;
    }
} 