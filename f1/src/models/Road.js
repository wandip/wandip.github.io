import * as THREE from 'three';
import { COLORS, MATERIALS } from '../utils/Constants';
import { ROAD_TYPES, ROAD_SEGMENT_CONFIG, TRACK_CONFIG } from '../utils/RoadConfig';
import { CurvedRoadSegment } from './CurvedRoadSegment';

/**
 * Manages the road segments and their creation
 */
export class Road {
    constructor() {
        this.roadSegments = [];
        this.showMarkers = ROAD_SEGMENT_CONFIG.SHOW_MARKERS;
        this.createRoad();
    }

    /**
     * Sets whether markers should be visible
     * @param {boolean} show - Whether to show markers
     */
    setShowMarkers(show) {
        this.showMarkers = show;
        // Update visibility of existing markers
        this.roadSegments.forEach(segment => {
            segment.children.forEach(child => {
                if (child.userData.isMarker) {
                    child.visible = show;
                }
            });
        });
    }

    /**
     * Gets whether markers are currently visible
     * @returns {boolean} Whether markers are visible
     */
    getShowMarkers() {
        return this.showMarkers;
    }

    /**
     * Creates all road segments based on track configuration
     */
    createRoad() {
        // Add start line at the beginning of the track
        this.createStartLine();
        
        TRACK_CONFIG.forEach(section => {
            switch (section.type) {
                case ROAD_TYPES.STRAIGHT:
                    this.createStraightSegment(section);
                    break;
                case ROAD_TYPES.CURVED:
                    this.createCurvedSegment(section);
                    break;
            }
        });
    }

    /**
     * Creates a checkered start line at the beginning of the track
     */
    createStartLine() {
        const startLineGroup = new THREE.Group();
        const startPos = TRACK_CONFIG[0].start;
        const endPos = TRACK_CONFIG[0].end;
        
        // Calculate direction vector
        const direction = new THREE.Vector3(endPos.x - startPos.x, 0, endPos.z - startPos.z).normalize();
        
        // Calculate perpendicular vector for width
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Create checkered pattern
        const numSquares = 10; // Number of squares in the checkered pattern
        const squareSize = ROAD_SEGMENT_CONFIG.WIDTH / numSquares;
        
        for (let i = 0; i < numSquares; i++) {
            for (let j = 0; j < 2; j++) {
                const isEven = (i + j) % 2 === 0;
                const color = isEven ? 0xffffff : 0x000000;
                
                // Calculate position of the square
                const offset = new THREE.Vector3()
                    .addScaledVector(perpendicular, (i - numSquares/2) * squareSize)
                    .addScaledVector(direction, j * squareSize);
                
                const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
                const squareMaterial = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.5,
                    metalness: 0.2
                });
                
                const square = new THREE.Mesh(squareGeometry, squareMaterial);
                square.rotation.x = -Math.PI / 2;
                square.position.copy(startPos);
                square.position.add(offset);
                square.position.x -= 1;
                square.position.y = 0.02; // Slightly above the road
                
                startLineGroup.add(square);
            }
        }
        
        this.roadSegments.push(startLineGroup);
    }

    /**
     * Creates a straight road segment
     * @param {Object} section - The road section configuration
     */
    createStraightSegment(section) {
        const start = new THREE.Vector3(section.start.x, 0, section.start.z);
        const end = new THREE.Vector3(section.end.x, 0, section.end.z);
        
        // Calculate length and direction
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();
        
        // Calculate rotation angle
        const angle = Math.atan2(direction.x, direction.z);
        
        // Create road segment
        const segment = this.createRoadSegment(length);
        
        // Calculate midpoint for positioning
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        segment.position.copy(midpoint);
        segment.rotation.y = angle;
        
        this.roadSegments.push(segment);
    }

    /**
     * Creates a curved road segment
     * @param {Object} section - The road section configuration
     */
    createCurvedSegment(section) {
        const curvedSegment = new CurvedRoadSegment(
            section.start,
            section.end,
            section.direction || 'clockwise',
            ROAD_SEGMENT_CONFIG.WIDTH,
            section.greyAreaRotation || 'clockwise'
        );
        
        this.roadSegments.push(curvedSegment);
    }

    /**
     * Creates a single road segment with markings
     * @param {number} length - The length of the road segment
     * @returns {THREE.Group} The road segment group
     */
    createRoadSegment(length) {
        const group = new THREE.Group();

        // Road surface
        const roadGeometry = new THREE.PlaneGeometry(ROAD_SEGMENT_CONFIG.WIDTH, length);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.ROAD,
            roughness: MATERIALS.ROAD.roughness,
            metalness: MATERIALS.ROAD.metalness
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        road.position.x = 0;
        group.add(road);

        // Add start marker
        const startMarker = this.createMarker(COLORS.MARKERS.START);
        startMarker.position.set(0, 0.1, -length / 2);
        startMarker.visible = this.showMarkers;
        startMarker.userData.isMarker = true;
        group.add(startMarker);

        // Add end marker
        const endMarker = this.createMarker(COLORS.MARKERS.END);
        endMarker.position.set(0, 0.1, length / 2);
        endMarker.visible = this.showMarkers;
        endMarker.userData.isMarker = true;
        group.add(endMarker);

        // Center line
        const centerLineCurve = new THREE.Curve();
        centerLineCurve.getPoint = (t) => {
            return new THREE.Vector3(0, 0.03, -length/2 + t * length);
        };
        const centerLineGeometry = new THREE.TubeGeometry(centerLineCurve, 1, 0.12, 8, false);
        const centerLineMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.CENTER_LINE,
            roughness: 0.5,
            depthTest: true,
            depthWrite: true
        });
        const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
        centerLine.renderOrder = -1; // Render before other objects
        group.add(centerLine);

        // Side lines (red and white stripes)
        [-ROAD_SEGMENT_CONFIG.WIDTH/2, ROAD_SEGMENT_CONFIG.WIDTH/2].forEach(x => {
            const stripesCount = Math.ceil(length / 5); // One stripe every 5 units
            const stripeLength = length / stripesCount;
            
            for (let i = 0; i < stripesCount; i++) {
                const color = i % 2 === 0 ? 0xff0000 : 0xffffff;
                const stripeCurve = new THREE.Curve();
                stripeCurve.getPoint = (t) => {
                    return new THREE.Vector3(
                        x,
                        0.04,
                        -length/2 + i * stripeLength + t * stripeLength
                    );
                };
                const stripeGeometry = new THREE.TubeGeometry(stripeCurve, 1, 0.25, 8, false);
                const stripeMaterial = new THREE.MeshStandardMaterial({ 
                    color,
                    depthTest: true,
                    depthWrite: true
                });
                const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
                stripe.renderOrder = -1; // Render before other objects
                group.add(stripe);
            }
        });

        return group;
    }

    /**
     * Creates a marker mesh
     * @param {number} color - The color of the marker
     * @returns {THREE.Mesh} The marker mesh
     */
    createMarker(color) {
        const markerGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.7
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.rotation.x = Math.PI / 2;
        return marker;
    }

    /**
     * Gets all road segments
     * @returns {THREE.Group[]} Array of road segments
     */
    getSegments() {
        return this.roadSegments;
    }
} 