import { CAR_CONFIG } from '../utils/Constants';

/**
 * Handles input controls for Rapier physics car movement
 */
export class RapierInputHandler {
    constructor() {
        this.forwardForce = 0;
        this.turnTorque = 0;
        this.maxForwardForce = 1000; // Reduced from 5000 to 1000 Newtons
        this.maxTurnTorque = 200; // Increased from 50 to 200 Newton-meters for better turning
        this.forceAcceleration = 200; // Reduced from 1000 to 200 - slower build-up
        this.torqueAcceleration = 25; // Increased from 15 to 25 for more responsive turning
        this.forceDeceleration = 0.95; // How quickly force decreases
        this.torqueDeceleration = 0.85; // Increased from 0.9 to 0.85 - faster torque decay
    }

    /**
     * Update input handling based on controls
     * @param {Object} controls - The controls object
     * @param {Object} rapierPhysics - The Rapier physics instance
     */
    update(controls, rapierPhysics) {
        if (!rapierPhysics) return;

        this.updateForwardForce(controls);
        this.updateTurnTorque(controls);
        this.applyForces(rapierPhysics);
    }

    /**
     * Update forward/backward force based on up/down arrows
     * @param {Object} controls - The controls object
     */
    updateForwardForce(controls) {
        if (controls.isKeyPressed('ArrowUp')) {
            // Accelerate forward
            this.forwardForce = Math.min(this.forwardForce + this.forceAcceleration, this.maxForwardForce);
        } else if (controls.isKeyPressed('ArrowDown')) {
            // Accelerate backward
            this.forwardForce = Math.max(this.forwardForce - this.forceAcceleration, -this.maxForwardForce);
        } else {
            // Natural deceleration
            this.forwardForce *= this.forceDeceleration;
            
            // Stop completely if force is very small
            if (Math.abs(this.forwardForce) < 50) {
                this.forwardForce = 0;
            }
        }
    }

    /**
     * Update turning torque based on left/right arrows
     * @param {Object} controls - The controls object
     */
    updateTurnTorque(controls) {
        // Only allow turning if there's some forward/backward movement
        if (Math.abs(this.forwardForce) < 50) {
            this.turnTorque *= this.torqueDeceleration;
            if (Math.abs(this.turnTorque) < 5) {
                this.turnTorque = 0;
            }
            return;
        }

        // Calculate speed factor for turning responsiveness
        const speedFactor = Math.min(1.0, Math.abs(this.forwardForce) / this.maxForwardForce);
        const effectiveTorqueAcceleration = this.torqueAcceleration * speedFactor;

        if (controls.isKeyPressed('ArrowLeft')) {
            // Turn left - limit maximum torque based on speed
            const maxTorqueForSpeed = this.maxTurnTorque * speedFactor;
            this.turnTorque = Math.min(this.turnTorque + effectiveTorqueAcceleration, maxTorqueForSpeed);
        } else if (controls.isKeyPressed('ArrowRight')) {
            // Turn right - limit maximum torque based on speed
            const maxTorqueForSpeed = this.maxTurnTorque * speedFactor;
            this.turnTorque = Math.max(this.turnTorque - effectiveTorqueAcceleration, -maxTorqueForSpeed);
        } else {
            // Natural torque deceleration
            this.turnTorque *= this.torqueDeceleration;
            
            // Stop completely if torque is very small
            if (Math.abs(this.turnTorque) < 5) {
                this.turnTorque = 0;
            }
        }
    }

    /**
     * Apply forces and torque to the physics body
     * @param {Object} rapierPhysics - The Rapier physics instance
     */
    applyForces(rapierPhysics) {
        // Get car's current rotation to apply force in the right direction
        const rotation = rapierPhysics.getCarRotation();
        
        // Convert quaternion to euler angles to get Y rotation
        const euler = this.quaternionToEuler(rotation);
        const carAngle = euler.y;
        
        // Calculate force direction based on car's orientation
        const forceX = Math.sin(carAngle) * this.forwardForce;
        const forceZ = Math.cos(carAngle) * this.forwardForce;
        
        // Apply forward/backward force
        if (Math.abs(this.forwardForce) > 0) {
            rapierPhysics.applyForce({ x: forceX, y: 0, z: forceZ });
        }
        
        // Apply turning torque with speed-dependent limiting
        if (Math.abs(this.turnTorque) > 0) {
            // Get current car speed to limit turning at high speeds
            const velocity = rapierPhysics.getCarVelocity();
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            
            // Reduce turn torque at higher speeds to prevent spinning, but less aggressively
            const speedFactor = Math.max(0.3, 1.0 - (speed / 30.0)); // Less aggressive reduction, minimum 0.3
            const adjustedTorque = this.turnTorque * speedFactor;
            
            rapierPhysics.applyTorque({ x: 0, y: adjustedTorque, z: 0 });
        }
    }

    /**
     * Convert quaternion to euler angles
     * @param {Object} quaternion - Quaternion {x, y, z, w}
     * @returns {Object} Euler angles {x, y, z}
     */
    quaternionToEuler(quaternion) {
        // Convert quaternion to euler angles
        const qx = quaternion.x;
        const qy = quaternion.y;
        const qz = quaternion.z;
        const qw = quaternion.w;
        
        // Roll (x-axis rotation)
        const sinr_cosp = 2 * (qw * qx + qy * qz);
        const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);
        
        // Pitch (y-axis rotation)
        const sinp = 2 * (qw * qy - qz * qx);
        let pitch;
        if (Math.abs(sinp) >= 1) {
            pitch = Math.copysign(Math.PI / 2, sinp); // use 90 degrees if out of range
        } else {
            pitch = Math.asin(sinp);
        }
        
        // Yaw (z-axis rotation)
        const siny_cosp = 2 * (qw * qz + qx * qy);
        const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);
        
        return { x: roll, y: pitch, z: yaw };
    }

    /**
     * Get current input state for debugging
     * @returns {Object} Current input state
     */
    getInputState() {
        return {
            forwardForce: this.forwardForce,
            turnTorque: this.turnTorque,
            maxForwardForce: this.maxForwardForce,
            maxTurnTorque: this.maxTurnTorque
        };
    }
} 