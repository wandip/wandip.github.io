import * as THREE from 'three';
import { CAR_CONFIG } from '../utils/Constants';

/**
 * Handles car physics and movement calculations
 */
export class CarPhysics {
    constructor() {
        this.speed = 0;
        this.turnSpeed = 0;
        this.carRotation = 0;
        this.carDirection = new THREE.Vector3(0, 0, 1);
        this.carVelocity = new THREE.Vector3(0, 0, 0);
    }

    /**
     * Updates car physics based on input controls
     * @param {Object} controls - The controls object
     * @returns {Object} Updated physics state
     */
    update(controls) {
        this.updateSpeed(controls);
        this.updateSteering(controls);
        this.updatePosition();
        
        return {
            speed: this.speed,
            turnSpeed: this.turnSpeed,
            carRotation: this.carRotation,
            carDirection: this.carDirection,
            carVelocity: this.carVelocity
        };
    }

    /**
     * Updates car speed based on acceleration/deceleration
     * @param {Object} controls - The controls object
     */
    updateSpeed(controls) {
        if (controls.isKeyPressed('ArrowUp')) {
            this.speed = Math.min(this.speed + CAR_CONFIG.ACCELERATION, CAR_CONFIG.MAX_SPEED);
        } else if (controls.isKeyPressed('ArrowDown')) {
            this.speed = Math.max(this.speed - CAR_CONFIG.ACCELERATION, -CAR_CONFIG.MAX_SPEED/2);
        } else {
            // Natural deceleration
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - CAR_CONFIG.DECELERATION);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + CAR_CONFIG.DECELERATION);
            }
        }
    }

    /**
     * Updates car steering based on input
     * @param {Object} controls - The controls object
     */
    updateSteering(controls) {
        // Calculate steering based on speed, but with a higher minimum factor
        const steeringFactor = Math.abs(this.speed) / CAR_CONFIG.MAX_SPEED;
        const effectiveSteeringFactor = Math.max(steeringFactor, CAR_CONFIG.MIN_STEERING_FACTOR);

        // Only allow car rotation if the car has some velocity
        if (Math.abs(this.speed) > 0.01) {
            const turnDirection = this.speed < 0 ? -1 : 1;
            // Increase steering responsiveness when in reverse
            const reverseMultiplier = this.speed < 0 ? 1.5 : 1;

            if (controls.isKeyPressed('ArrowLeft')) {
                this.turnSpeed = Math.min(
                    this.turnSpeed + CAR_CONFIG.TURN_ACCELERATION * reverseMultiplier,
                    CAR_CONFIG.TURN_SPEED * reverseMultiplier
                ) * turnDirection;
            } else if (controls.isKeyPressed('ArrowRight')) {
                this.turnSpeed = Math.max(
                    this.turnSpeed - CAR_CONFIG.TURN_ACCELERATION * reverseMultiplier,
                    -CAR_CONFIG.TURN_SPEED * reverseMultiplier
                ) * turnDirection;
            } else {
                // Natural turn deceleration
                if (this.turnSpeed > 0) {
                    this.turnSpeed = Math.max(0, this.turnSpeed - CAR_CONFIG.TURN_DECELERATION);
                } else if (this.turnSpeed < 0) {
                    this.turnSpeed = Math.min(0, this.turnSpeed + CAR_CONFIG.TURN_DECELERATION);
                }
            }
        } else {
            this.turnSpeed = 0;
        }
    }

    /**
     * Updates car position and rotation
     */
    updatePosition() {
        // Update car rotation
        this.carRotation += this.turnSpeed;
        
        // Update car direction vector
        this.carDirection.set(
            Math.sin(this.carRotation),
            0,
            Math.cos(this.carRotation)
        );

        // Calculate new velocity
        this.carVelocity.copy(this.carDirection).multiplyScalar(this.speed);
    }

    /**
     * Gets the target wheel rotation for steering
     * @param {Object} controls - The controls object
     * @returns {number} Target wheel rotation angle
     */
    getTargetWheelRotation(controls) {
        if (controls.isKeyPressed('ArrowLeft')) {
            return Math.PI / 4; // 45 degrees left
        } else if (controls.isKeyPressed('ArrowRight')) {
            return -Math.PI / 4; // 45 degrees right
        }
        return 0;
    }
} 