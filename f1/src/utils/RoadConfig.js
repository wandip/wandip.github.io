/**
 * Road segment types and configuration
 */

export const ROAD_TYPES = {
    STRAIGHT: 'STRAIGHT',
    CURVED: 'CURVED'
};

export const ROAD_SEGMENT_CONFIG = {
    WIDTH: 15,         // Width of the road
    SHOW_MARKERS: false, // Whether to show start/end markers
    SHOW_COORDINATES: false // Whether to show the coordinate system
};

/**
 * Track configuration
 * Each object in the array represents a road segment with its start and end coordinates
 * For straight segments:
 * - start: {x, z} coordinates of the start point
 * - end: {x, z} coordinates of the end point
 * 
 * For curved segments:
 * - start: {x, z} coordinates of the start point
 * - end: {x, z} coordinates of the end point
 * - direction: 'clockwise' or 'anticlockwise' (optional, defaults to 'clockwise')
 * - greyAreaRotation: 'clockwise' or 'anticlockwise' (optional, defaults to 'clockwise')
 */
export const TRACK_CONFIG = [
    {
        type: ROAD_TYPES.STRAIGHT,
        start: { x: 0, z: 0 },
        end: { x: 0, z: 100 }
    },
    {
        type: ROAD_TYPES.CURVED,
        start: { x: 0, z: 100 },
        end: { x: 20, z: 120 },
        direction: 'anticlockwise',
        greyAreaRotation: 'anticlockwise'
    },
    {
        type: ROAD_TYPES.STRAIGHT,
        start: { x: 20, z: 120 },
        end: { x: 40, z: 120 }
    },
    {
        type: ROAD_TYPES.CURVED,
        start: { x: 40, z: 120 },
        end: { x: 60, z: 100 },
        direction: 'anticlockwise',
        greyAreaRotation: 'clockwise'
    },
    {
        type: ROAD_TYPES.STRAIGHT,
        start: { x: 60, z: 100 },
        end: { x: 60, z: 0 }
    },
    {
        type: ROAD_TYPES.CURVED,
        start: { x: 60, z: 0 },
        end: { x: 40, z: -20 },
        direction: 'anticlockwise',
        greyAreaRotation: 'anticlockwise'
    },
    {
        type: ROAD_TYPES.STRAIGHT,
        start: { x: 40, z: -20 },
        end: { x: 20, z: -20 }
    },
    {
        type: ROAD_TYPES.CURVED,
        start: { x: 20, z: -20 },
        end: { x: 0, z: 0 },
        direction: 'anticlockwise',
        greyAreaRotation: 'clockwise'
    },
]; 