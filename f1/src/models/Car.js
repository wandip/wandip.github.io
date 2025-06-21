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
     * Creates front and rear wings with F1-style design
     */
    createWings() {
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.CAR_BODY,
            roughness: MATERIALS.CAR.roughness,
            metalness: MATERIALS.CAR.metalness
        });

        // Front wing - Main plane
        const frontWingMain = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.05, 0.3),
            wingMaterial
        );
        frontWingMain.position.set(0, 0.25, 1.8);
        this.car.add(frontWingMain);

        // Front wing - Secondary plane (smaller)
        const frontWingSecondary = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.03, 0.2),
            wingMaterial
        );
        frontWingSecondary.position.set(0, 0.35, 1.9);
        this.car.add(frontWingSecondary);

        // Front wing endplates
        const frontEndplateGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.3);
        const frontEndplateLeft = new THREE.Mesh(frontEndplateGeometry, wingMaterial);
        frontEndplateLeft.position.set(-1.025, 0.25, 1.8);
        this.car.add(frontEndplateLeft);

        const frontEndplateRight = new THREE.Mesh(frontEndplateGeometry, wingMaterial);
        frontEndplateRight.position.set(1.025, 0.25, 1.8);
        this.car.add(frontEndplateRight);

        // Front wing supports
        const frontSupportGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
        const frontSupportLeft = new THREE.Mesh(frontSupportGeometry, wingMaterial);
        frontSupportLeft.position.set(-0.5, 0.15, 1.8);
        this.car.add(frontSupportLeft);

        const frontSupportRight = new THREE.Mesh(frontSupportGeometry, wingMaterial);
        frontSupportRight.position.set(0.5, 0.15, 1.8);
        this.car.add(frontSupportRight);

        // Rear wing - Main plane
        const rearWingMain = new THREE.Mesh(
            new THREE.BoxGeometry(1.84, 0.05, 0.3),
            wingMaterial
        );
        rearWingMain.position.set(0, 1.0, -1.8);
        this.car.add(rearWingMain);

        // Rear wing - Upper plane
        const rearWingUpper = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.03, 0.2),
            wingMaterial
        );
        rearWingUpper.position.set(0, 1.2, -1.8);
        this.car.add(rearWingUpper);

        // Rear wing endplates
        const rearEndplateGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.3);
        const rearEndplateLeft = new THREE.Mesh(rearEndplateGeometry, wingMaterial);
        rearEndplateLeft.position.set(-0.945, 1.0, -1.8);
        this.car.add(rearEndplateLeft);

        const rearEndplateRight = new THREE.Mesh(rearEndplateGeometry, wingMaterial);
        rearEndplateRight.position.set(0.945, 1.0, -1.8);
        this.car.add(rearEndplateRight);

        // Rear wing supports
        const rearSupportGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
        const rearSupportLeft = new THREE.Mesh(rearSupportGeometry, wingMaterial);
        rearSupportLeft.position.set(-0.4, 0.6, -1.8);
        this.car.add(rearSupportLeft);

        const rearSupportRight = new THREE.Mesh(rearSupportGeometry, wingMaterial);
        rearSupportRight.position.set(0.4, 0.6, -1.8);
        this.car.add(rearSupportRight);

        // Rear wing central support
        const rearCentralSupport = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.8, 0.05),
            wingMaterial
        );
        rearCentralSupport.position.set(0, 0.6, -1.8);
        this.car.add(rearCentralSupport);

        // Side pods (F1-style body extensions)
        const sidePodGeometry = new THREE.BoxGeometry(0.3, 0.4, 1.0);
        const sidePodLeft = new THREE.Mesh(sidePodGeometry, wingMaterial);
        sidePodLeft.position.set(-0.9, 0.3, 0);
        this.car.add(sidePodLeft);

        const sidePodRight = new THREE.Mesh(sidePodGeometry, wingMaterial);
        sidePodRight.position.set(0.9, 0.3, 0);
        this.car.add(sidePodRight);

        // Front nose cone
        const noseConeGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const noseCone = new THREE.Mesh(noseConeGeometry, wingMaterial);
        noseCone.rotation.z = Math.PI / 2;
        noseCone.position.set(0, 0.4, 2.4);
        this.car.add(noseCone);
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