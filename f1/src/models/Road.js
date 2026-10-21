import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COLORS, MATERIALS } from '../utils/Constants';
import { ROAD_TYPES, ROAD_SEGMENT_CONFIG, TRACK_CONFIG } from '../utils/RoadConfig';
import { CurvedRoadSegment } from './CurvedRoadSegment';

// Shared road materials to eliminate duplicate shader allocations
export const SHARED_ROAD_MATERIALS = {
    road: new THREE.MeshStandardMaterial({
        color: COLORS.ROAD,
        roughness: MATERIALS.ROAD.roughness,
        metalness: MATERIALS.ROAD.metalness
    }),
    centerLine: new THREE.MeshStandardMaterial({
        color: COLORS.CENTER_LINE,
        roughness: 0.5,
        depthTest: true,
        depthWrite: true
    }),
    kerbRed: new THREE.MeshStandardMaterial({
        color: 0xff0000,
        depthTest: true,
        depthWrite: true
    }),
    kerbWhite: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        depthTest: true,
        depthWrite: true
    }),
    checkerWhite: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.2
    }),
    checkerBlack: new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.5,
        metalness: 0.2
    }),
    markerStart: new THREE.MeshStandardMaterial({
        color: COLORS.MARKERS.START,
        roughness: 0.3,
        metalness: 0.7
    }),
    markerEnd: new THREE.MeshStandardMaterial({
        color: COLORS.MARKERS.END,
        roughness: 0.3,
        metalness: 0.7
    })
};

const sharedMarkerGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);

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
     * Creates a checkered start line at the beginning of the track (merged into 2 draw calls)
     */
    createStartLine() {
        const startLineGroup = new THREE.Group();
        const startPos = TRACK_CONFIG[0].start;
        const endPos = TRACK_CONFIG[0].end;

        const direction = new THREE.Vector3(endPos.x - startPos.x, 0, endPos.z - startPos.z).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

        const numSquares = 10;
        const squareSize = ROAD_SEGMENT_CONFIG.WIDTH / numSquares;
        const whiteSquares = [];
        const blackSquares = [];

        for (let i = 0; i < numSquares; i++) {
            for (let j = 0; j < 2; j++) {
                const isEven = (i + j) % 2 === 0;
                const offset = new THREE.Vector3()
                    .addScaledVector(perpendicular, (i - numSquares / 2) * squareSize)
                    .addScaledVector(direction, j * squareSize);

                const squareGeo = new THREE.PlaneGeometry(squareSize, squareSize);
                squareGeo.rotateX(-Math.PI / 2);
                squareGeo.translate(
                    startPos.x + offset.x - 1,
                    0.02,
                    startPos.z + offset.z
                );

                if (isEven) {
                    whiteSquares.push(squareGeo);
                } else {
                    blackSquares.push(squareGeo);
                }
            }
        }

        const mergedWhite = mergeGeometries(whiteSquares, false);
        const mergedBlack = mergeGeometries(blackSquares, false);
        whiteSquares.forEach(g => g.dispose());
        blackSquares.forEach(g => g.dispose());

        startLineGroup.add(new THREE.Mesh(mergedWhite, SHARED_ROAD_MATERIALS.checkerWhite));
        startLineGroup.add(new THREE.Mesh(mergedBlack, SHARED_ROAD_MATERIALS.checkerBlack));

        this.roadSegments.push(startLineGroup);
    }

    /**
     * Creates a straight road segment
     * @param {Object} section - The road section configuration
     */
    createStraightSegment(section) {
        const start = new THREE.Vector3(section.start.x, 0, section.start.z);
        const end = new THREE.Vector3(section.end.x, 0, section.end.z);

        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();

        const angle = Math.atan2(direction.x, direction.z);
        const segment = this.createRoadSegment(length);

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
        const road = new THREE.Mesh(roadGeometry, SHARED_ROAD_MATERIALS.road);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        road.position.x = 0;
        group.add(road);

        // Start & End markers
        const startMarker = this.createMarker(true);
        startMarker.position.set(0, 0.1, -length / 2);
        startMarker.visible = this.showMarkers;
        startMarker.userData.isMarker = true;
        group.add(startMarker);

        const endMarker = this.createMarker(false);
        endMarker.position.set(0, 0.1, length / 2);
        endMarker.visible = this.showMarkers;
        endMarker.userData.isMarker = true;
        group.add(endMarker);

        // Center line
        const centerLineCurve = new THREE.LineCurve3(
            new THREE.Vector3(0, 0.03, -length / 2),
            new THREE.Vector3(0, 0.03, length / 2)
        );
        const centerLineGeometry = new THREE.TubeGeometry(centerLineCurve, 1, 0.1, 6, false);
        const centerLine = new THREE.Mesh(centerLineGeometry, SHARED_ROAD_MATERIALS.centerLine);
        centerLine.renderOrder = -1;
        group.add(centerLine);

        // Side lines (red and white stripes merged into 2 meshes per segment)
        const redStripes = [];
        const whiteStripes = [];
        const stripesCount = Math.ceil(length / 5);
        const stripeLength = length / stripesCount;

        [-ROAD_SEGMENT_CONFIG.WIDTH / 2, ROAD_SEGMENT_CONFIG.WIDTH / 2].forEach(x => {
            for (let i = 0; i < stripesCount; i++) {
                const z0 = -length / 2 + i * stripeLength;
                const z1 = z0 + stripeLength;
                const stripeCurve = new THREE.LineCurve3(
                    new THREE.Vector3(x, 0.04, z0),
                    new THREE.Vector3(x, 0.04, z1)
                );
                const stripeGeometry = new THREE.TubeGeometry(stripeCurve, 1, 0.1, 6, false);
                if (i % 2 === 0) {
                    redStripes.push(stripeGeometry);
                } else {
                    whiteStripes.push(stripeGeometry);
                }
            }
        });

        if (redStripes.length > 0) {
            const mergedRed = mergeGeometries(redStripes, false);
            redStripes.forEach(g => g.dispose());
            const redMesh = new THREE.Mesh(mergedRed, SHARED_ROAD_MATERIALS.kerbRed);
            redMesh.renderOrder = -1;
            group.add(redMesh);
        }

        if (whiteStripes.length > 0) {
            const mergedWhite = mergeGeometries(whiteStripes, false);
            whiteStripes.forEach(g => g.dispose());
            const whiteMesh = new THREE.Mesh(mergedWhite, SHARED_ROAD_MATERIALS.kerbWhite);
            whiteMesh.renderOrder = -1;
            group.add(whiteMesh);
        }

        return group;
    }

    /**
     * Creates a marker mesh
     * @param {boolean} isStart - True for start marker, false for end marker
     * @returns {THREE.Mesh} The marker mesh
     */
    createMarker(isStart) {
        const material = isStart ? SHARED_ROAD_MATERIALS.markerStart : SHARED_ROAD_MATERIALS.markerEnd;
        const marker = new THREE.Mesh(sharedMarkerGeometry, material);
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
