/**
 * Physics-specific constants and configuration values
 */

export const PHYSICS_CONFIG = {
    // Physics engine settings
    GRAVITY: { x: 0.0, y: -9.81, z: 0.0 },
    FRAME_RATE: 60,
    
    // Car physics properties
    CAR_MASS: 50,
    CAR_RESTITUTION: 0.2,
    
    // Wheel physics properties
    WHEEL_RADIUS: 0.45,
    WHEEL_WIDTH: 0.35,
    SUSPENSION_REST_LENGTH: 0.2,
    WHEEL_FRICTION_SLIP: 3000,
    
    // Vehicle control properties
    MAX_STEER_ANGLE: Math.PI / 6,
    STEERING_RESPONSE: 0.1, // Slower steering response
    ENGINE_FORCE_STEP: 50,
    ENGINE_FORCE_MIN: -500,
    ENGINE_FORCE_MAX: 5000,
    BRAKE_FORCE_STEP: 50,
    BRAKE_FORCE_MAX: 500,
    FORCE_DECAY: 0.9, // Gradually reduce force when no input
    
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