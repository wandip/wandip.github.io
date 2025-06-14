import * as THREE from 'three';
import { CAR_DIMENSIONS, COLORS, MATERIALS } from '../utils/Constants';

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
        // Create tire
        const tireGeometry = new THREE.CylinderGeometry(
            CAR_DIMENSIONS.WHEEL.radius,
            CAR_DIMENSIONS.WHEEL.radius,
            CAR_DIMENSIONS.WHEEL.width,
            32
        );
        
        const tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000, // Black tire
            roughness: MATERIALS.WHEELS.roughness,
            metalness: MATERIALS.WHEELS.metalness
        });

        this.tire = new THREE.Mesh(tireGeometry, tireMaterial);
        this.tire.rotation.z = Math.PI / 2;

        // Create rim
        const rimGeometry = new THREE.CylinderGeometry(
            CAR_DIMENSIONS.WHEEL.radius * 0.7,
            CAR_DIMENSIONS.WHEEL.radius * 0.7,
            CAR_DIMENSIONS.WHEEL.width + 0.01,
            32
        );
        
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.WHEEL_RIM,
            roughness: 0.2,
            metalness: 0.9
        });

        this.rim = new THREE.Mesh(rimGeometry, rimMaterial);
        this.rim.rotation.z = Math.PI / 2;

        // Remove the small disc indicator
        // Add compound color ring (torus) at the outer edge of the tire
        const ringGeometry = new THREE.TorusGeometry(
            CAR_DIMENSIONS.WHEEL.radius + 0.01, // Slightly outside the tire
            0.025, // Thin ring
            16, // Radial segments
            100 // Tubular segments
        );
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.TIRE_COMPOUNDS[this.compound],
            roughness: 0.3,
            metalness: 0.7
        });
        this.compoundRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.compoundRing.rotation.y = Math.PI / 2;

        // Create wheel group
        this.wheel = new THREE.Group();
        this.wheel.add(this.tire);
        this.wheel.add(this.rim);
        this.wheel.add(this.compoundRing);

        if (this.isFront) {
            // Create a container for front wheels to handle steering
            this.container = new THREE.Group();
            this.container.position.set(this.position.x, this.position.y, this.position.z);
            this.wheel.position.set(0, 0, 0);
            this.container.add(this.wheel);
        } else {
            this.wheel.position.set(this.position.x, this.position.y, this.position.z);
        }
    }

    /**
     * Updates wheel rotation for steering
     * @param {number} targetRotation - Target rotation angle
     */
    updateSteering(targetRotation) {
        if (this.isFront && this.container) {
            this.container.rotation.y += (targetRotation - this.container.rotation.y) * 0.2;
        }
    }

    /**
     * Gets the wheel mesh or container
     * @returns {THREE.Object3D} The wheel object
     */
    getObject() {
        return this.isFront ? this.container : this.wheel;
    }
} 