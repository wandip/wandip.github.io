import * as THREE from 'three';
import { COLORS, MATERIALS } from '../utils/Constants';
import { ROAD_SEGMENT_CONFIG } from '../utils/RoadConfig';

/**
 * Represents a curved road segment
 */
export class CurvedRoadSegment extends THREE.Group {
    /**
     * @param {Object} start - Start point {x, z}
     * @param {Object} end - End point {x, z}
     * @param {string} direction - 'clockwise' or 'anticlockwise'
     * @param {number} width - The width of the road
     * @param {string} greyAreaRotation - 'clockwise' or 'anticlockwise' for grey area rotation
     */
    constructor(start, end, direction, width, greyAreaRotation = '') {
        super();
        
        this.start = new THREE.Vector3(start.x, 0, start.z);
        this.end = new THREE.Vector3(end.x, 0, end.z);
        this.direction = direction;
        this.width = width;
        this.greyAreaRotation = greyAreaRotation;
        this.showMarkers = ROAD_SEGMENT_CONFIG.SHOW_MARKERS;
        
        // Calculate curve parameters
        this.calculateCurveParameters();
        
        // Create the curved road
        this.createCurvedRoad();
    }

    /**
     * Calculates the curve parameters (center, radius, angles)
     */
    calculateCurveParameters() {
        // Calculate the chord vector (from start to end)
        const chordVector = new THREE.Vector3().subVectors(this.end, this.start);
        const chordLength = chordVector.length();
        
        // Calculate the midpoint of the chord
        const midPoint = new THREE.Vector3().addVectors(this.start, this.end).multiplyScalar(0.5);
        
        // Calculate the perpendicular vector to the chord
        const perpendicular = new THREE.Vector3(-chordVector.z, 0, chordVector.x).normalize();
        
        // Calculate the radius using the chord length and desired arc angle (90 degrees)
        // For a 90-degree arc, the radius should be chordLength / sqrt(2)
        this.radius = chordLength / Math.sqrt(2);
        
        // Calculate the distance from midpoint to center
        const distanceFromMidpoint = Math.sqrt(this.radius * this.radius - (chordLength * chordLength / 4));
        
        // Calculate the center point based on direction
        this.center = new THREE.Vector3().addVectors(
            midPoint,
            perpendicular.clone().multiplyScalar(
                this.direction === 'clockwise' ? distanceFromMidpoint : -distanceFromMidpoint
            )
        );
        
        // Calculate start and end angles
        this.startAngle = Math.atan2(this.start.z - this.center.z, this.start.x - this.center.x);
        this.endAngle = Math.atan2(this.end.z - this.center.z, this.end.x - this.center.x);
        
        // Normalize angles to ensure proper arc
        if (this.direction === 'clockwise') {
            if (this.endAngle <= this.startAngle) {
                this.endAngle += 2 * Math.PI;
            }
        } else {
            if (this.endAngle >= this.startAngle) {
                this.endAngle -= 2 * Math.PI;
            }
        }
    }

    /**
     * Creates the curved road geometry and adds it to the group
     */
    createCurvedRoad() {
        // Construct the arcShape centered at the origin (no offsetX/offsetY)
        const arcShape = new THREE.Shape();
        const innerRadius = this.radius - this.width / 2;
        const outerRadius = this.radius + this.width / 2;
        const segments = 64;

        // Helper to get local (x, y) for a given angle and radius
        const localXY = (angle, radius) => [
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        ];

        // Start at inner radius, start angle
        arcShape.moveTo(...localXY(this.startAngle, innerRadius));
        arcShape.absarc(0, 0, outerRadius, this.startAngle, this.endAngle, this.direction === 'anticlockwise');
        arcShape.lineTo(...localXY(this.endAngle, innerRadius));
        arcShape.absarc(0, 0, innerRadius, this.endAngle, this.startAngle, this.direction === 'clockwise');
        arcShape.closePath();

        // Create the road mesh at the origin
        const geometry = new THREE.ShapeGeometry(arcShape, segments);
        const material = new THREE.MeshStandardMaterial({
            color: COLORS.ROAD,
            roughness: MATERIALS.ROAD.roughness,
            metalness: MATERIALS.ROAD.metalness,
            // side: THREE.DoubleSide // Debug: render both sides
        });
        const roadMesh = new THREE.Mesh(geometry, material);
        roadMesh.rotation.x = -Math.PI / 2;
        // Create a group to handle Y rotation
        const roadGroup = new THREE.Group();
        roadGroup.add(roadMesh);
        roadGroup.position.set(this.center.x, 0.01, this.center.z);
        
        // Handle both clockwise and anticlockwise rotations explicitly
        if (this.greyAreaRotation === 'anticlockwise') {
            roadGroup.rotation.y = Math.PI / 2;
        } else if (this.greyAreaRotation === 'clockwise') {
            roadGroup.rotation.y = -Math.PI / 2;
        } else {
            roadGroup.rotation.y = this.startAngle;
        }
        
        this.add(roadGroup);

        // Add start marker at the actual start position
        const startMarker = this.createMarker(COLORS.MARKERS.START);
        startMarker.position.copy(this.start);
        startMarker.position.y = 0.1;
        startMarker.visible = this.showMarkers;
        startMarker.userData.isMarker = true;
        this.add(startMarker);

        // Add end marker at the actual end position
        const endMarker = this.createMarker(COLORS.MARKERS.END);
        endMarker.position.copy(this.end);
        endMarker.position.y = 0.1;
        endMarker.visible = this.showMarkers;
        endMarker.userData.isMarker = true;
        this.add(endMarker);

        // Add center line
        this.addCenterLine();

        // Add side stripes
        this.addSideStripes();
    }

    /**
     * Creates and adds the center line to the road
     */
    addCenterLine() {
        const centerLineCurve = new THREE.Curve();
        centerLineCurve.getPoint = (t) => {
            const angle = this.startAngle + t * (this.endAngle - this.startAngle);
            const x = this.center.x + Math.cos(angle) * this.radius;
            const z = this.center.z + Math.sin(angle) * this.radius;
            return new THREE.Vector3(x, 0.03, z);
        };

        const centerLineGeometry = new THREE.TubeGeometry(centerLineCurve, 64, 0.12, 8, false);
        const centerLineMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.CENTER_LINE,
            roughness: 0.5,
            depthTest: true,
            depthWrite: true
        });
        const centerLineMesh = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
        centerLineMesh.renderOrder = -1; // Render before other objects
        this.add(centerLineMesh);
    }

    /**
     * Creates and adds the side stripes to the road
     */
    addSideStripes() {
        const innerRadius = this.radius - this.width / 2;
        const outerRadius = this.radius + this.width / 2;
        const arcLength = Math.abs(this.endAngle - this.startAngle) * this.radius;
        const stripesCount = Math.ceil(arcLength / 5); // One stripe every 5 units

        [innerRadius, outerRadius].forEach((radius) => {
            for (let i = 0; i < stripesCount; i++) {
                const t0 = i / stripesCount;
                const t1 = (i + 1) / stripesCount;
                const angle0 = this.startAngle + t0 * (this.endAngle - this.startAngle);
                const angle1 = this.startAngle + t1 * (this.endAngle - this.startAngle);
                const color = i % 2 === 0 ? 0xff0000 : 0xffffff;

                const stripeCurve = new THREE.Curve();
                stripeCurve.getPoint = (t) => {
                    const angle = angle0 + t * (angle1 - angle0);
                    const x = this.center.x + Math.cos(angle) * radius;
                    const z = this.center.z + Math.sin(angle) * radius;
                    return new THREE.Vector3(x, 0.04, z);
                };

                const stripeGeometry = new THREE.TubeGeometry(stripeCurve, 8, 0.25, 8, false);
                const stripeMaterial = new THREE.MeshStandardMaterial({ 
                    color,
                    depthTest: true,
                    depthWrite: true
                });
                const stripeMesh = new THREE.Mesh(stripeGeometry, stripeMaterial);
                stripeMesh.renderOrder = -1; // Render before other objects
                this.add(stripeMesh);
            }
        });
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
     * Sets whether markers should be visible
     * @param {boolean} show - Whether to show markers
     */
    setShowMarkers(show) {
        this.showMarkers = show;
        this.children.forEach(child => {
            if (child.userData.isMarker) {
                child.visible = show;
            }
        });
    }

    /**
     * Gets whether markers are currently visible
     * @returns {boolean} Whether markers are visible
     */
    getShowMarkers() {
        return this.showMarkers;
    }
} 