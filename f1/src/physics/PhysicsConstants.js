/**
 * Physics-specific constants and configuration values
 */

export const PHYSICS_CONFIG = {
    // Physics engine settings
    GRAVITY: { x: 0.0, y: -9.81, z: 0.0 },
    FRAME_RATE: 60,
    
    // Car physics properties
    CAR_MASS: 800,
    CAR_RESTITUTION: 0.1,
    
    // Wheel physics properties
    WHEEL_RADIUS: 0.45,
    WHEEL_WIDTH: 0.35,
    SUSPENSION_REST_LENGTH: 0.1,
    SUSPENSION_STIFFNESS: 25.0,
    SUSPENSION_DAMPING: 2.0,
    SUSPENSION_COMPRESSION: 2.0,
    WHEEL_FRICTION_SLIP: 2.0,
    
    // Vehicle control properties
    MAX_STEER_ANGLE: Math.PI / 6, // Reduced from PI/4 to PI/6 for more realistic steering
    STEERING_RESPONSE: 0.1, // Slower steering response
    ENGINE_FORCE_STEP: 30,
    ENGINE_FORCE_MIN: -500,
    ENGINE_FORCE_MAX: 1000,
    BRAKE_FORCE_STEP: 5,
    BRAKE_FORCE_MAX: 50,
    FORCE_DECAY: 0.9, // Gradually reduce force when no input
    
    // Ground physics
    GROUND_SIZE: 500,
    GROUND_THICKNESS: 0.1,
    
    // Car positioning
    WHEEL_Y_OFFSET: -0.45,
    GROUND_LEVEL: 0,
    CAR_HEIGHT_OFFSET: 0.05 // Small offset for better physics contact
};

export const WHEEL_POSITIONS = [
    { x: 1.0, y: -0.01, z: 3.0, isFront: true, compound: 'MEDIUM' },     // Front Left
    { x: -1.0, y: -0.01, z: 3.0, isFront: true, compound: 'MEDIUM' },    // Front Right
    { x: 1.1, y: -0.01, z: -1.0, isFront: false, compound: 'MEDIUM' },  // Rear Left
    { x: -1.1, y: -0.01, z: -1.0, isFront: false, compound: 'MEDIUM' }  // Rear Right
];

export const WHEEL_DIRECTIONS = {
    DIRECTION: { x: 0.0, y: -1.0, z: 0.0 },
    AXLE: { x: -1.0, y: 0.0, z: 0.0 }
}; 