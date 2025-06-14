import * as THREE from 'three';
import { ROAD_SEGMENT_CONFIG } from '../utils/RoadConfig';

export class CoordinateSystem {
    constructor() {
        if (ROAD_SEGMENT_CONFIG.SHOW_COORDINATES) {
            this.createCoordinateSystem();
        }
    }

    createCoordinateSystem() {
        // Create container for coordinate display
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;

        // Create coordinate display
        this.coordinateDisplay = document.createElement('div');
        this.coordinateDisplay.style.cssText = `
            font-size: 14px;
            line-height: 1.5;
        `;

        // Add to container
        this.container.appendChild(this.coordinateDisplay);

        // Add to document
        document.body.appendChild(this.container);

        // Create grid helper
        this.gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        this.gridHelper.position.y = 0.01; // Slightly above ground to prevent z-fighting
    }

    update(carPosition, carRotation) {
        if (!ROAD_SEGMENT_CONFIG.SHOW_COORDINATES) return;
        
        // Update coordinate display
        this.coordinateDisplay.innerHTML = `
            X: ${carPosition.x.toFixed(2)}<br>
            Y: ${carPosition.y.toFixed(2)}<br>
            Z: ${carPosition.z.toFixed(2)}<br>
            Rotation: ${(carRotation * (180/Math.PI)).toFixed(2)}°
        `;
    }

    getObject() {
        return ROAD_SEGMENT_CONFIG.SHOW_COORDINATES ? this.gridHelper : null;
    }
} 