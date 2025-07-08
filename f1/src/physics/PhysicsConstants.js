/**
 * Physics-specific constants and configuration values
 */

export const PHYSICS_CONFIG = {
    // Physics engine settings
    GRAVITY: { x: 0.0, y: -9.81, z: 0.0 },
    FRAME_RATE: 60,
    
    // Car physics properties
    CAR_MASS: 800, // Increased from 200 to 800 kg for more realistic car mass
    CAR_RESTITUTION: 0.2,
    CAR_CENTER_OF_MASS_OFFSET: { x: 0.0, y: -0.5, z: 0.0 }, // Much lower center of mass for stability
    
    // Wheel physics properties
    WHEEL_RADIUS: 0.45,
    WHEEL_WIDTH: 0.35,
    SUSPENSION_REST_LENGTH: 0.2,
    WHEEL_FRICTION_SLIP: 9000,
    
    // Suspension properties
    SUSPENSION_STIFFNESS: 1, // Higher stiffness for less body roll
    SUSPENSION_DAMPING: 0,    // Damping to prevent oscillation
    SUSPENSION_COMPRESSION: 0, // Compression ratio
    SUSPENSION_REBOUND: 0,     // Rebound ratio
    SUSPENSION_TRAVEL: 0,      // Maximum suspension travel
    
    // Vehicle control properties
    MAX_STEER_ANGLE: Math.PI / 6,
    STEERING_RESPONSE: 1.0, // Direct steering (no lerp) for step-based approach
    ENGINE_FORCE_STEP: 200, // Increased for heavier car
    ENGINE_FORCE_MIN: -2000, // Increased for heavier car
    ENGINE_FORCE_MAX: 2000, // Increased for heavier car
    BRAKE_FORCE_STEP: 5, // Increased for heavier car
    BRAKE_FORCE_MAX: 200, // Increased for heavier car
    FORCE_DECAY: 0.8, // Gradually reduce force when no input
    
    // Car positioning
    GROUND_LEVEL: 0,
    CAR_HEIGHT_OFFSET: 0.05 // Small offset for better physics contact
};

export const PHYSICS_WHEEL_POSITIONS = [
    { x: 1.0, y: -0.01, z: 3.0, isFront: true, compound: 'MEDIUM' },     // Front Left
    { x: -1.0, y: -0.01, z: 3.0, isFront: true, compound: 'MEDIUM' },    // Front Right
    { x: 1.1, y: -0.01, z: -1.0, isFront: false, compound: 'MEDIUM' },  // Rear Left
    { x: -1.1, y: -0.01, z: -1.0, isFront: false, compound: 'MEDIUM' }  // Rear Right
];

export const WHEEL_DIRECTIONS = {
    DIRECTION: { x: 0.0, y: -1.0, z: 0.0 },
    AXLE: { x: -1.0, y: 0.0, z: 0.0 }
};

// Default steering sensitivity for car and UI
export const DEFAULT_STEERING_SENSITIVITY = 0.4; 