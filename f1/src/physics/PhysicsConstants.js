/**
 * Physics-specific constants and configuration values
 */

export const PHYSICS_CONFIG = {
    // Physics engine settings
    GRAVITY: { x: 0.0, y: -9.81, z: 0.0 },
    FRAME_RATE: 60,
    
    // Car physics properties
    CAR_MASS: 800, // 800 kg realistic F1 car mass
    CAR_RESTITUTION: 0.1,
    CHASSIS_HALF_EXTENTS: { x: 0.85, y: 0.22, z: 2.8 },
    CHASSIS_COLLIDER_OFFSET: { x: 0.0, y: 0.35, z: 0.7 },
    CAR_CENTER_OF_MASS_OFFSET: { x: 0.0, y: 0.15, z: 0.5 }, // Low center of mass for F1 stability
    
    // Wheel physics properties
    WHEEL_RADIUS: 0.45,
    WHEEL_WIDTH: 0.35,
    WHEEL_CONNECTION_HEIGHT: 0.55,
    SUSPENSION_REST_LENGTH: 0.20,
    WHEEL_FRICTION_SLIP: 4.5,
    WHEEL_SIDE_FRICTION_STIFFNESS: 3.0,
    
    // Suspension properties (Rapier DynamicRayCastVehicleController)
    SUSPENSION_STIFFNESS: 35.0,   // Proper spring stiffness to support car weight at F1 ride height
    SUSPENSION_DAMPING: 4.0,      // Damping to prevent oscillation
    SUSPENSION_COMPRESSION: 4.0,  // Compression damping
    SUSPENSION_RELAXATION: 5.0,   // Rebound/relaxation damping
    SUSPENSION_REBOUND: 5.0,      // Alias for compatibility
    SUSPENSION_TRAVEL: 0.15,      // Maximum suspension travel (m)
    MAX_SUSPENSION_FORCE: 15000,  // Max suspension force (N)
    
    // Vehicle control properties
    MAX_STEER_ANGLE: Math.PI / 6,
    STEERING_RESPONSE: 1.0, // Direct steering (no lerp) for step-based approach
    ENGINE_FORCE_STEP: 250, // Responsive acceleration step
    ENGINE_FORCE_MIN: -2500,
    ENGINE_FORCE_MAX: 3500,
    BRAKE_FORCE_STEP: 15,
    BRAKE_FORCE_MAX: 250,
    FORCE_DECAY: 0.85, // Gradually reduce force when no input
    
    // Car positioning
    GROUND_LEVEL: 0,
    CAR_HEIGHT_OFFSET: 0.05 // Initial ground clearance at spawn
};

export const PHYSICS_WHEEL_POSITIONS = [
    { x: 1.0, y: 0.40, connectionY: 0.55, z: 3.0, isFront: true, compound: 'MEDIUM' },     // Front Left
    { x: -1.0, y: 0.40, connectionY: 0.55, z: 3.0, isFront: true, compound: 'MEDIUM' },    // Front Right
    { x: 1.1, y: 0.40, connectionY: 0.55, z: -1.5, isFront: false, compound: 'MEDIUM' },   // Rear Left
    { x: -1.1, y: 0.40, connectionY: 0.55, z: -1.5, isFront: false, compound: 'MEDIUM' }   // Rear Right
];

export const WHEEL_DIRECTIONS = {
    DIRECTION: { x: 0.0, y: -1.0, z: 0.0 },
    AXLE: { x: -1.0, y: 0.0, z: 0.0 }
};

// Default steering sensitivity for car and UI
export const DEFAULT_STEERING_SENSITIVITY = 0.4;
