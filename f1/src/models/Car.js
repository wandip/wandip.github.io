import * as THREE from 'three';
import { CAR_DIMENSIONS } from '../utils/Constants';
import { PHYSICS_WHEEL_POSITIONS } from '../physics/PhysicsConstants';
import { Wheel } from './Wheel';

// Shared materials across car components to minimize shader/material state switches
const sharedMaterials = {
    chassisRed: new THREE.MeshStandardMaterial({
        color: 0xcc0000, // Ferrari red
        metalness: 0.8,
        roughness: 0.2
    }),
    wingRed: new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        metalness: 0.6,
        roughness: 0.4
    }),
    glossBlack: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.9,
        roughness: 0.1
    }),
    carbonBlack: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.2
    }),
    matteBlack: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.1,
        roughness: 0.9
    }),
    haloTitanium: new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.9,
        roughness: 0.1
    }),
    darkGray: new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
    }),
    mirrorOrange: new THREE.MeshStandardMaterial({
        color: 0xFF5F1F, // Fluorescent orange
        metalness: 0.1,
        roughness: 0.1
    })
};

/**
 * Represents the F1 car with all its detailed components
 */
export class Car {
    constructor() {
        this.car = new THREE.Group();
        this.wheels = [];
        this.wheelPositions = PHYSICS_WHEEL_POSITIONS;

        this.createCar();
    }

    /**
     * Creates the car model with all its detailed components
     */
    createCar() {
        this.createMonocoque();
        this.createNose();
        this.createCockpit();
        this.createWings();
        this.createSidePods();
        this.createWheels();
        this.createDetails();

        const carYPosition = this.calculateOptimalCarYPosition();
        this.car.position.set(0, carYPosition, 0);
        this.car.rotation.y = 0;

        // Ensure car renders after road lines
        this.car.renderOrder = 1;
    }

    /**
     * Calculates the optimal Y position for the car so wheels are on the ground
     * @returns {number} The optimal Y position for the car
     */
    calculateOptimalCarYPosition() {
        const wheelRadius = CAR_DIMENSIONS.WHEEL.radius;
        const wheelYPosition = this.wheelPositions[0].y;
        const groundLevel = 0;
        return groundLevel - wheelYPosition + wheelRadius;
    }

    /**
     * Creates the main monocoque/chassis
     */
    createMonocoque() {
        const chassisGeometry = new THREE.BoxGeometry(1.4, 0.25, 4.5);
        const chassis = new THREE.Mesh(chassisGeometry, sharedMaterials.chassisRed);
        chassis.position.set(0, 0.15, 0);
        chassis.name = 'chassis';
        this.car.add(chassis);
    }

    /**
     * Creates the detailed nose section
     */
    createNose() {
        // Integrated Nose Section - Part 1: Front chassis extension
        const nosePart1Geometry = new THREE.BoxGeometry(1.0, 0.2, 1.1);
        const nosePart1 = new THREE.Mesh(nosePart1Geometry, sharedMaterials.chassisRed);
        nosePart1.position.set(0, 0.15, 2.8);
        nosePart1.name = 'nosePart1';
        this.car.add(nosePart1);

        // Integrated Nose Section - Part 2: Tapered middle
        const nosePart2Geometry = new THREE.BoxGeometry(0.7, 0.15, 0.8);
        const nosePart2 = new THREE.Mesh(nosePart2Geometry, sharedMaterials.chassisRed);
        nosePart2.position.set(0, 0.15, 3.6);
        nosePart2.name = 'nosePart2';
        this.car.add(nosePart2);

        // Integrated Nose Section - Part 3: Final taper
        const nosePart3Geometry = new THREE.BoxGeometry(0.4, 0.12, 0.3);
        const nosePart3 = new THREE.Mesh(nosePart3Geometry, sharedMaterials.chassisRed);
        nosePart3.position.set(0, 0.15, 4.1);
        nosePart3.name = 'nosePart3';
        this.car.add(nosePart3);

        // Nose Pillar - Central support structure
        const nosePillarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
        const nosePillar = new THREE.Mesh(nosePillarGeometry, sharedMaterials.glossBlack);
        nosePillar.position.set(0, 0.05, 3.8);
        nosePillar.name = 'nosePillar';
        this.car.add(nosePillar);
    }

    /**
     * Creates the cockpit with halo safety device
     */
    createCockpit() {
        // Cockpit - Driver compartment
        const cockpitGeometry = new THREE.BoxGeometry(0.9, 0.4, 2.0);
        const cockpit = new THREE.Mesh(cockpitGeometry, sharedMaterials.chassisRed);
        cockpit.position.set(0, 0.45, -0.5);
        cockpit.name = 'cockpit';
        this.car.add(cockpit);

        // Cockpit Opening - Driver seat area
        const cockpitOpeningGeometry = new THREE.BoxGeometry(0.7, 0.15, 1.6);
        const cockpitOpening = new THREE.Mesh(cockpitOpeningGeometry, sharedMaterials.matteBlack);
        cockpitOpening.position.set(0, 0.6, -0.5);
        cockpitOpening.name = 'cockpitOpening';
        this.car.add(cockpitOpening);

        // Halo Safety Device
        const haloGeometry = new THREE.TorusGeometry(0.4, 0.03, 8, 16);
        const halo = new THREE.Mesh(haloGeometry, sharedMaterials.haloTitanium);
        halo.position.set(0, 0.75, -0.3);
        halo.rotation.x = Math.PI / 2;
        halo.name = 'halo';
        this.car.add(halo);

        // Air Intake above cockpit
        const airIntakeGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.4);
        const airIntake = new THREE.Mesh(airIntakeGeometry, sharedMaterials.matteBlack);
        airIntake.position.set(0, 0.7, -0.3);
        airIntake.name = 'airIntake';
        this.car.add(airIntake);
    }

    /**
     * Creates detailed front and rear wings
     */
    createWings() {
        // Front Wing Assembly - Lower main plane
        const frontWingMainGeometry = new THREE.BoxGeometry(2.0, 0.03, 0.15);
        const frontWingMain = new THREE.Mesh(frontWingMainGeometry, sharedMaterials.carbonBlack);
        frontWingMain.position.set(0, 0.15, 4.3);
        frontWingMain.name = 'frontWingMain';
        this.car.add(frontWingMain);

        // Front Wing - Upper flap
        const frontWingFlapGeometry = new THREE.BoxGeometry(1.8, 0.02, 0.12);
        const frontWingFlap = new THREE.Mesh(frontWingFlapGeometry, sharedMaterials.darkGray);
        frontWingFlap.position.set(0, 0.22, 4.35);
        frontWingFlap.name = 'frontWingFlap';
        this.car.add(frontWingFlap);

        // Front Wing End Plates
        const frontEndPlateGeometry = new THREE.BoxGeometry(0.03, 0.3, 0.15);
        const frontEndPlateL = new THREE.Mesh(frontEndPlateGeometry, sharedMaterials.wingRed);
        frontEndPlateL.position.set(1.0, 0.3, 4.3);
        frontEndPlateL.name = 'frontEndPlateL';
        this.car.add(frontEndPlateL);

        const frontEndPlateR = new THREE.Mesh(frontEndPlateGeometry, sharedMaterials.wingRed);
        frontEndPlateR.position.set(-1.0, 0.3, 4.3);
        frontEndPlateR.name = 'frontEndPlateR';
        this.car.add(frontEndPlateR);

        // Rear Wing - Main Element
        const rearWingMainGeometry = new THREE.BoxGeometry(1.6, 0.4, 0.08);
        const rearWingMain = new THREE.Mesh(rearWingMainGeometry, sharedMaterials.carbonBlack);
        rearWingMain.position.set(0, 0.6, -2.8);
        rearWingMain.name = 'rearWingMain';
        this.car.add(rearWingMain);

        // Rear Wing - Upper Flap
        const rearWingFlapGeometry = new THREE.BoxGeometry(1.4, 0.25, 0.06);
        const rearWingFlap = new THREE.Mesh(rearWingFlapGeometry, sharedMaterials.darkGray);
        rearWingFlap.position.set(0, 0.85, -2.9);
        rearWingFlap.name = 'rearWingFlap';
        this.car.add(rearWingFlap);

        // Rear Wing End Plates
        const rearEndPlateGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.08);
        const rearEndPlateL = new THREE.Mesh(rearEndPlateGeometry, sharedMaterials.wingRed);
        rearEndPlateL.position.set(0.85, 0.6, -2.8);
        rearEndPlateL.name = 'rearEndPlateL';
        this.car.add(rearEndPlateL);

        const rearEndPlateR = new THREE.Mesh(rearEndPlateGeometry, sharedMaterials.wingRed);
        rearEndPlateR.position.set(-0.85, 0.6, -2.8);
        rearEndPlateR.name = 'rearEndPlateR';
        this.car.add(rearEndPlateR);

        // Rear Wing Support Pillars
        const supportPillarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const supportPillarL = new THREE.Mesh(supportPillarGeometry, sharedMaterials.haloTitanium);
        supportPillarL.position.set(0.3, 0.3, -2.6);
        supportPillarL.name = 'supportPillarL';
        this.car.add(supportPillarL);

        const supportPillarR = new THREE.Mesh(supportPillarGeometry, sharedMaterials.haloTitanium);
        supportPillarR.position.set(-0.3, 0.3, -2.6);
        supportPillarR.name = 'supportPillarR';
        this.car.add(supportPillarR);

        // DRS Actuator on rear wing
        const drsActuatorGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const drsActuator = new THREE.Mesh(drsActuatorGeometry, sharedMaterials.haloTitanium);
        drsActuator.position.set(0, 1.0, -2.85);
        drsActuator.name = 'drsActuator';
        this.car.add(drsActuator);
    }

    /**
     * Creates side pods with aerodynamic shape
     */
    createSidePods() {
        const sidePodGeometry = new THREE.BoxGeometry(0.5, 0.5, 2.8);
        const sidePodL = new THREE.Mesh(sidePodGeometry, sharedMaterials.chassisRed);
        sidePodL.position.set(0.9, 0.25, 0.5);
        sidePodL.name = 'sidePodL';
        this.car.add(sidePodL);

        const sidePodR = new THREE.Mesh(sidePodGeometry, sharedMaterials.chassisRed);
        sidePodR.position.set(-0.9, 0.25, 0.5);
        sidePodR.name = 'sidePodR';
        this.car.add(sidePodR);
    }

    /**
     * Creates all four wheels with proper F1 proportions
     */
    createWheels() {
        this.wheelPositions.forEach(pos => {
            const wheel = new Wheel(pos.isFront, pos.x, pos.y, pos.z, pos.compound);
            const wheelObject = wheel.getObject();
            wheelObject.userData.isWheel = true;
            this.wheels.push(wheel);
            this.car.add(wheelObject);
        });
    }

    /**
     * Creates additional details like mirrors
     */
    createDetails() {
        const mirrorGeometry = new THREE.BoxGeometry(0.16, 0.08, 0.12);
        const mirrorL = new THREE.Mesh(mirrorGeometry, sharedMaterials.mirrorOrange);
        mirrorL.position.set(0.85, 0.65, 1.5);
        mirrorL.name = 'mirrorL';
        this.car.add(mirrorL);

        const mirrorR = new THREE.Mesh(mirrorGeometry, sharedMaterials.mirrorOrange);
        mirrorR.position.set(-0.85, 0.65, 1.5);
        mirrorR.name = 'mirrorR';
        this.car.add(mirrorR);
    }

    /**
     * Updates wheel steering
     * @param {number} targetRotation - Target rotation angle
     */
    updateWheelSteering(targetRotation) {
        this.wheels.forEach(wheel => wheel.updateSteering(targetRotation));
    }

    /**
     * Directly synchronizes visual car pose with the Rapier chassis rigid body
     * @param {Object} translation - { x, y, z } world translation
     * @param {Object} rotation - { x, y, z, w } world quaternion
     */
    syncWithPhysics(translation, rotation) {
        this.car.position.set(translation.x, translation.y, translation.z);
        this.car.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }

    /**
     * Updates a specific wheel's steering, spin, and suspension height
     * @param {number} index - Wheel index (0..3)
     * @param {number} steeringAngle - Steering rotation in radians
     * @param {number} spinAngle - Rolling rotation in radians
     * @param {number} localY - Local Y height from suspension compression
     */
    updateWheelFromPhysics(index, steeringAngle, spinAngle, localY) {
        const wheel = this.wheels[index];
        if (!wheel) return;
        wheel.updateSteering(steeringAngle);
        wheel.updateSpin(spinAngle);
        if (Number.isFinite(localY)) {
            wheel.updateSuspensionY(localY);
        }
    }

    /**
     * Gets the car object
     * @returns {THREE.Group} The car object
     */
    getObject() {
        return this.car;
    }

    /**
     * Gets the wheels array
     * @returns {Array} Array of Wheel objects
     */
    getWheels() {
        return this.wheels;
    }
}
