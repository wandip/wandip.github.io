/**
 * Game constants and configuration values
 */

export const GAME_CONFIG = {
    // Skip traffic lights animation in dev mode
    SKIP_START_LIGHTS: true
};

export const CAR_CONFIG = {
    // Maximum speed the car can reach (in units per frame)
    MAX_SPEED: 0.8,
    
    // How quickly the car accelerates when pressing forward (in units per frame)
    ACCELERATION: 0.02,
    
    // How quickly the car slows down when not accelerating (in units per frame)
    DECELERATION: 0.01,
    
    // Maximum rotation speed during turns (in radians per frame)
    // Lower values result in wider turning radius
    TURN_SPEED: Math.PI / 90,
    
    // How quickly the car responds to steering input (in radians per frame)
    // Lower values make turning more gradual and smooth
    TURN_ACCELERATION: Math.PI / 360,
    
    // How quickly the car returns to straight when not steering (in radians per frame)
    // Higher values make the car straighten out more quickly
    TURN_DECELERATION: Math.PI / 900,
    
    // How much the car tilts during turns (multiplier)
    TILT_FACTOR: 0.2,
    
    // Minimum steering responsiveness at low speeds (0-1)
    // Higher values make low-speed turning more responsive
    MIN_STEERING_FACTOR: 0.2
};

export const CAMERA_CONFIG = {
    HEIGHT: 40,
    BEHIND_CAR_DISTANCE: 10,
    BEHIND_CAR_HEIGHT: 5,
    LERP_FACTOR: 0.1,
    // First-person view configuration
    FIRST_PERSON_HEIGHT: 0.8,  // Height above ground (close to bonnet level)
    FIRST_PERSON_FORWARD_OFFSET: 0,  // Distance forward from car center
    FIRST_PERSON_UP_OFFSET: 0.3  // Small upward offset for better visibility
};

export const ROAD_CONFIG = {
    LENGTH: 100,
    TOTAL_SEGMENTS: 20,
    SEGMENT_WIDTH: 20
};

export const CAR_DIMENSIONS = {
    BODY: { width: 1.5, height: 0.5, length: 5 },
    COCKPIT: { width: 0.67, height: 0.3, length: 1.5 },
    FRONT_WING: { width: 2.0, height: 0.1, length: 0.5 },
    REAR_WING: { width: 1.84, height: 0.5, length: 0.1 },
    WHEEL: { radius: 0.33, width: 0.3 }
};

export const COLORS = {
    CAR_BODY: 0xffffff,
    WINGS: 0xffa500, // Orange
    COCKPIT: 0x000000,
    WHEELS: 0x000000,
    ROAD: 0x333333,
    CENTER_LINE: 0xffffff,
    GROUND: 0x2d6a4f,
    SKY: 0x87ceeb,
    TIRE_COMPOUNDS: {
        SOFT: 0xff0000,
        MEDIUM: 0xffd700,
        HARD: 0xffffff,
        INTER: 0x00ff00,
        WET: 0x0000ff
    },
    WHEEL_RIM: 0x888888,
    MARKERS: {
        START: 0x00ff00,  // Green for start
        END: 0xff0000     // Red for end
    }
};

export const MATERIALS = {
    CAR: {
        roughness: 0.3,
        metalness: 0.8
    },
    COCKPIT: {
        roughness: 0.1,
        metalness: 0.9
    },
    WHEELS: {
        roughness: 0.7,
        metalness: 0.3
    },
    ROAD: {
        roughness: 0.7,
        metalness: 0.1
    },
    GROUND: {
        roughness: 0.8,
        metalness: 0.2
    }
}; 