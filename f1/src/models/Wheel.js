import * as THREE from 'three';
import { CAR_DIMENSIONS, COLORS, MATERIALS } from '../utils/Constants';

// Shared geometries and materials across all wheel instances to reduce GPU memory & draw overhead
const sharedTireGeometry = new THREE.CylinderGeometry(
    CAR_DIMENSIONS.WHEEL.radius,
    CAR_DIMENSIONS.WHEEL.radius,
    CAR_DIMENSIONS.WHEEL.width,
    24
);
sharedTireGeometry.rotateZ(Math.PI / 2);

const sharedRimGeometry = new THREE.CylinderGeometry(
    CAR_DIMENSIONS.WHEEL.radius * 0.7,
    CAR_DIMENSIONS.WHEEL.radius * 0.7,
    CAR_DIMENSIONS.WHEEL.width + 0.01,
    24
);
sharedRimGeometry.rotateZ(Math.PI / 2);

const sharedRingGeometry = new THREE.TorusGeometry(
    CAR_DIMENSIONS.WHEEL.radius + 0.01,
    0.025,
    12,
    48
);
sharedRingGeometry.rotateY(Math.PI / 2);

const sharedTireMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: MATERIALS.WHEELS.roughness,
    metalness: MATERIALS.WHEELS.metalness
});

const sharedRimMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.WHEEL_RIM,
    roughness: 0.2,
    metalness: 0.9
});

const compoundMaterials = {};
function getCompoundMaterial(compound) {
    const colorHex = COLORS.TIRE_COMPOUNDS[compound] ?? COLORS.TIRE_COMPOUNDS.MEDIUM;
    if (!compoundMaterials[compound]) {
        compoundMaterials[compound] = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.3,
            metalness: 0.7
        });
    }
    return compoundMaterials[compound];
}

/**
 * Represents a wheel in the F1 car
 */
export class Wheel {
    /**
     * Creates a new wheel
     * @param {boolean} isFront - Whether this is a front wheel
     * @param {number} x - X position relative to car
     * @param {number} y - Y position relative to car
     * @param {number} z - Z position relative to car
     * @param {string} compound - Tire compound type ('SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET')
     */
    constructor(isFront, x, y, z, compound = 'MEDIUM') {
        this.isFront = isFront;
        this.position = { x, y, z };
        this.rotation = 0;
        this.compound = compound;
        this.createWheel();
    }

    /**
     * Creates the wheel mesh and container
     */
    createWheel() {
        this.tire = new THREE.Mesh(sharedTireGeometry, sharedTireMaterial);
        this.rim = new THREE.Mesh(sharedRimGeometry, sharedRimMaterial);
        this.compoundRing = new THREE.Mesh(sharedRingGeometry, getCompoundMaterial(this.compound));

        // Inner wheel group handles rolling spin around X-axis
        this.wheel = new THREE.Group();
        this.wheel.add(this.tire);
        this.wheel.add(this.rim);
        this.wheel.add(this.compoundRing);

        // Outer container handles position (including suspension Y travel) and steering rotation (Y-axis)
        this.container = new THREE.Group();
        this.container.position.set(this.position.x, this.position.y, this.position.z);
        this.container.add(this.wheel);
    }

    /**
     * Updates wheel rotation for steering
     * @param {number} targetRotation - Target rotation angle in radians
     */
    updateSteering(targetRotation) {
        if (this.isFront && this.container) {
            this.container.rotation.y = targetRotation;
        }
    }

    /**
     * Updates wheel rolling spin around its axle
     * @param {number} spinAngle - Cumulative wheel rotation angle in radians
     */
    updateSpin(spinAngle) {
        if (this.wheel) {
            this.wheel.rotation.x = spinAngle;
        }
    }

    /**
     * Updates vertical wheel position from suspension compression
     * @param {number} localY - Local Y position relative to car chassis
     */
    updateSuspensionY(localY) {
        if (this.container) {
            this.container.position.y = localY;
        }
    }

    /**
     * Updates the tire compound color ring
     * @param {string} compound - 'SOFT' | 'MEDIUM' | 'HARD' | 'INTER' | 'WET'
     */
    setCompound(compound) {
        this.compound = compound;
        if (this.compoundRing) {
            this.compoundRing.material = getCompoundMaterial(compound);
        }
    }

    /**
     * Gets the wheel container Object3D
     * @returns {THREE.Object3D} The wheel object
     */
    getObject() {
        return this.container;
    }
}
