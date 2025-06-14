import * as THREE from 'three';
import { CAR_DIMENSIONS, COLORS, MATERIALS } from '../utils/Constants';
import { Wheel } from './Wheel';

/**
 * Represents the F1 car with all its components
 */
export class Car {
    constructor() {
        this.car = new THREE.Group();
        this.wheels = [];
        this.createCar();
    }

    /**
     * Creates the car model with all its components
     */
    createCar() {
        this.createBody();
        this.createCockpit();
        this.createWings();
        this.createWheels();
        
        // Position car
        this.car.position.set(0, 0, 5);
        this.car.rotation.z = 0;
    }

    /**
     * Creates the main car body
     */
    createBody() {
        const bodyGeometry = new THREE.BoxGeometry(
            CAR_DIMENSIONS.BODY.width,
            CAR_DIMENSIONS.BODY.height,
            CAR_DIMENSIONS.BODY.length
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.CAR_BODY,
            roughness: MATERIALS.CAR.roughness,
            metalness: MATERIALS.CAR.metalness
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        this.car.add(body);
    }

    /**
     * Creates the cockpit
     */
    createCockpit() {
        const cockpitGeometry = new THREE.BoxGeometry(
            CAR_DIMENSIONS.COCKPIT.width,
            CAR_DIMENSIONS.COCKPIT.height,
            CAR_DIMENSIONS.COCKPIT.length
        );
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.COCKPIT,
            roughness: MATERIALS.COCKPIT.roughness,
            metalness: MATERIALS.COCKPIT.metalness
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.8, -0.5);
        this.car.add(cockpit);
    }

    /**
     * Creates front and rear wings
     */
    createWings() {
        // Front wing
        const frontWingGeometry = new THREE.BoxGeometry(
            CAR_DIMENSIONS.FRONT_WING.width,
            CAR_DIMENSIONS.FRONT_WING.height,
            CAR_DIMENSIONS.FRONT_WING.length
        );
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.CAR_BODY,
            roughness: MATERIALS.CAR.roughness,
            metalness: MATERIALS.CAR.metalness
        });
        const frontWing = new THREE.Mesh(frontWingGeometry, wingMaterial);
        frontWing.position.set(0, 0.3, 1.8);
        this.car.add(frontWing);

        // Rear wing
        const rearWingGeometry = new THREE.BoxGeometry(
            CAR_DIMENSIONS.REAR_WING.width,
            CAR_DIMENSIONS.REAR_WING.height,
            CAR_DIMENSIONS.REAR_WING.length
        );
        const rearWing = new THREE.Mesh(rearWingGeometry, wingMaterial);
        rearWing.position.set(0, 0.8, -1.8);
        this.car.add(rearWing);
    }

    /**
     * Creates all four wheels
     */
    createWheels() {
        const wheelPositions = [
            { x: -1, y: 0.4, z: 1.2, isFront: true, compound: 'MEDIUM' },     // Front Left
            { x: 1, y: 0.4, z: 1.2, isFront: true, compound: 'MEDIUM' },      // Front Right
            { x: -1, y: 0.4, z: -1.2, isFront: false, compound: 'MEDIUM' },  // Rear Left
            { x: 1, y: 0.4, z: -1.2, isFront: false, compound: 'MEDIUM' }    // Rear Right
        ];

        wheelPositions.forEach(pos => {
            const wheel = new Wheel(pos.isFront, pos.x, pos.y, pos.z, pos.compound);
            this.wheels.push(wheel);
            this.car.add(wheel.getObject());
        });
    }

    /**
     * Updates wheel steering
     * @param {number} targetRotation - Target rotation angle
     */
    updateWheelSteering(targetRotation) {
        this.wheels.forEach(wheel => wheel.updateSteering(targetRotation));
    }

    /**
     * Gets the car object
     * @returns {THREE.Group} The car object
     */
    getObject() {
        return this.car;
    }

    /**
     * Gets the car's position
     * @returns {THREE.Vector3} The car's position
     */
    getPosition() {
        return this.car.position;
    }

    /**
     * Gets the car's rotation
     * @returns {number} The car's rotation
     */
    getRotation() {
        return this.car.rotation.y;
    }
} 