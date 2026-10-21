import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COLORS, MATERIALS } from '../utils/Constants';
import { ROAD_SEGMENT_CONFIG } from '../utils/RoadConfig';

// Shared materials for curved road segments
const curvedRoadMaterials = {
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

        this.calculateCurveParameters();
        this.createCurvedRoad();
    }

    /**
     * Calculates the curve parameters (center, radius, angles)
     */
    calculateCurveParameters() {
        const chordVector = new THREE.Vector3().subVectors(this.end, this.start);
        const chordLength = chordVector.length();
        const midPoint = new THREE.Vector3().addVectors(this.start, this.end).multiplyScalar(0.5);
        const perpendicular = new THREE.Vector3(-chordVector.z, 0, chordVector.x).normalize();

        this.radius = chordLength / Math.sqrt(2);
        const distanceFromMidpoint = Math.sqrt(this.radius * this.radius - (chordLength * chordLength / 4));

        this.center = new THREE.Vector3().addVectors(
            midPoint,
            perpendicular.clone().multiplyScalar(
                this.direction === 'clockwise' ? distanceFromMidpoint : -distanceFromMidpoint
            )
        );

        this.startAngle = Math.atan2(this.start.z - this.center.z, this.start.x - this.center.x);
        this.endAngle = Math.atan2(this.end.z - this.center.z, this.end.x - this.center.x);

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
        const arcShape = new THREE.Shape();
        const innerRadius = this.radius - this.width / 2;
        const outerRadius = this.radius + this.width / 2;
        const segments = 32;

        const localXY = (angle, radius) => [
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        ];

        arcShape.moveTo(...localXY(this.startAngle, innerRadius));
        arcShape.absarc(0, 0, outerRadius, this.startAngle, this.endAngle, this.direction === 'anticlockwise');
        arcShape.lineTo(...localXY(this.endAngle, innerRadius));
        arcShape.absarc(0, 0, innerRadius, this.endAngle, this.startAngle, this.direction === 'clockwise');
        arcShape.closePath();

        const geometry = new THREE.ShapeGeometry(arcShape, segments);
        const roadMesh = new THREE.Mesh(geometry, curvedRoadMaterials.road);
        roadMesh.rotation.x = -Math.PI / 2;

        const roadGroup = new THREE.Group();
        roadGroup.add(roadMesh);
        roadGroup.position.set(this.center.x, 0.01, this.center.z);

        if (this.greyAreaRotation === 'anticlockwise') {
            roadGroup.rotation.y = Math.PI / 2;
        } else if (this.greyAreaRotation === 'clockwise') {
            roadGroup.rotation.y = -Math.PI / 2;
        } else {
            roadGroup.rotation.y = this.startAngle;
        }

        this.add(roadGroup);

        const startMarker = this.createMarker(true);
        startMarker.position.copy(this.start);
        startMarker.position.y = 0.1;
        startMarker.visible = this.showMarkers;
        startMarker.userData.isMarker = true;
        this.add(startMarker);

        const endMarker = this.createMarker(false);
        endMarker.position.copy(this.end);
        endMarker.position.y = 0.1;
        endMarker.visible = this.showMarkers;
        endMarker.userData.isMarker = true;
        this.add(endMarker);

        this.addCenterLine();
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

        const centerLineGeometry = new THREE.TubeGeometry(centerLineCurve, 32, 0.1, 6, false);
        const centerLineMesh = new THREE.Mesh(centerLineGeometry, curvedRoadMaterials.centerLine);
        centerLineMesh.renderOrder = -1;
        this.add(centerLineMesh);
    }

    /**
     * Creates and adds the side stripes to the road (merged into 2 meshes per curve)
     */
    addSideStripes() {
        const innerRadius = this.radius - this.width / 2;
        const outerRadius = this.radius + this.width / 2;
        const arcLength = Math.abs(this.endAngle - this.startAngle) * this.radius;
        const stripesCount = Math.ceil(arcLength / 5);

        const redStripes = [];
        const whiteStripes = [];

        [innerRadius, outerRadius].forEach((radius) => {
            for (let i = 0; i < stripesCount; i++) {
                const t0 = i / stripesCount;
                const t1 = (i + 1) / stripesCount;
                const angle0 = this.startAngle + t0 * (this.endAngle - this.startAngle);
                const angle1 = this.startAngle + t1 * (this.endAngle - this.startAngle);

                const stripeCurve = new THREE.Curve();
                stripeCurve.getPoint = (t) => {
                    const angle = angle0 + t * (angle1 - angle0);
                    const x = this.center.x + Math.cos(angle) * radius;
                    const z = this.center.z + Math.sin(angle) * radius;
                    return new THREE.Vector3(x, 0.04, z);
                };

                const stripeGeometry = new THREE.TubeGeometry(stripeCurve, 6, 0.1, 6, false);
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
            const redMesh = new THREE.Mesh(mergedRed, curvedRoadMaterials.kerbRed);
            redMesh.renderOrder = -1;
            this.add(redMesh);
        }

        if (whiteStripes.length > 0) {
            const mergedWhite = mergeGeometries(whiteStripes, false);
            whiteStripes.forEach(g => g.dispose());
            const whiteMesh = new THREE.Mesh(mergedWhite, curvedRoadMaterials.kerbWhite);
            whiteMesh.renderOrder = -1;
            this.add(whiteMesh);
        }
    }

    /**
     * Creates a marker mesh
     * @param {boolean} isStart - True for start marker, false for end marker
     * @returns {THREE.Mesh} The marker mesh
     */
    createMarker(isStart) {
        const material = isStart ? curvedRoadMaterials.markerStart : curvedRoadMaterials.markerEnd;
        const marker = new THREE.Mesh(sharedMarkerGeometry, material);
        marker.rotation.x = Math.PI / 2;
        return marker;
    }

    setShowMarkers(show) {
        this.showMarkers = show;
        this.children.forEach(child => {
            if (child.userData.isMarker) {
                child.visible = show;
            }
        });
    }

    getShowMarkers() {
        return this.showMarkers;
    }
}
