import * as THREE from 'three';
import { CAR_DIMENSIONS, COLORS, MATERIALS } from '../utils/Constants';
import { Wheel } from './Wheel';

/**
 * Represents the F1 car with all its detailed components
 */
export class Car {
    constructor() {
        this.car = new THREE.Group();
        this.wheels = [];
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
        this.createEngineCover();
        this.createWheels();
        this.createSuspension();
        this.createBrakeDiscs();
        this.createDetails();
        
        // Position car
        this.car.position.set(0, 0, 5);
        this.car.rotation.y = -Math.PI / 2; // Align car with z-axis
    }

    /**
     * Creates the main monocoque/chassis
     */
    createMonocoque() {
        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000, // Ferrari red
            metalness: 0.8,
            roughness: 0.2
        });

        // Main monocoque - extended length
        const chassisGeometry = new THREE.BoxGeometry(1.4, 0.25, 4.5);
        const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassis.position.set(0, 0.15, 0);
        this.car.add(chassis);
    }

    /**
     * Creates the detailed nose section
     */
    createNose() {
        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.8,
            roughness: 0.2
        });

        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });

        // Integrated Nose Section - Part 1: Front chassis extension
        const nosePart1Geometry = new THREE.BoxGeometry(1.0, 0.2, 1.1);
        const nosePart1 = new THREE.Mesh(nosePart1Geometry, chassisMaterial);
        nosePart1.position.set(0, 0.15, 2.8);
        this.car.add(nosePart1);

        // Integrated Nose Section - Part 2: Tapered middle
        const nosePart2Geometry = new THREE.BoxGeometry(0.7, 0.15, 0.8);
        const nosePart2 = new THREE.Mesh(nosePart2Geometry, chassisMaterial);
        nosePart2.position.set(0, 0.15, 3.6);
        this.car.add(nosePart2);

        // Integrated Nose Section - Part 3: Final taper
        const nosePart3Geometry = new THREE.BoxGeometry(0.4, 0.12, 0.6);
        const nosePart3 = new THREE.Mesh(nosePart3Geometry, chassisMaterial);
        nosePart3.position.set(0, 0.15, 4.2);
        this.car.add(nosePart3);

        // Nose Tip - Rounded end
        const noseTipGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const noseTip = new THREE.Mesh(noseTipGeometry, blackMaterial);
        noseTip.position.set(0, 0.15, 4.6);
        this.car.add(noseTip);

        // Nose Pillar - Central support structure
        const nosePillarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
        const nosePillar = new THREE.Mesh(nosePillarGeometry, blackMaterial);
        nosePillar.position.set(0, 0.05, 3.8);
        this.car.add(nosePillar);
    }

    /**
     * Creates the cockpit with halo safety device
     */
    createCockpit() {
        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.8,
            roughness: 0.2
        });

        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.1,
            roughness: 0.9
        });

        const haloMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.1
        });

        // Cockpit - More realistic driver compartment
        const cockpitGeometry = new THREE.BoxGeometry(0.9, 0.4, 2.0);
        const cockpit = new THREE.Mesh(cockpitGeometry, chassisMaterial);
        cockpit.position.set(0, 0.45, -0.5);
        this.car.add(cockpit);

        // Cockpit Opening - Driver seat area
        const cockpitOpeningGeometry = new THREE.BoxGeometry(0.7, 0.15, 1.6);
        const cockpitOpening = new THREE.Mesh(cockpitOpeningGeometry, blackMaterial);
        cockpitOpening.position.set(0, 0.6, -0.5);
        this.car.add(cockpitOpening);

        // Halo Safety Device
        const haloGeometry = new THREE.TorusGeometry(0.4, 0.03, 8, 16);
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.set(0, 0.75, -0.3);
        halo.rotation.x = Math.PI / 2;
        this.car.add(halo);

        // Air Intake above cockpit
        const airIntakeGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.4);
        const airIntake = new THREE.Mesh(airIntakeGeometry, blackMaterial);
        airIntake.position.set(0, 0.7, -0.3);
        this.car.add(airIntake);
    }

    /**
     * Creates detailed front and rear wings
     */
    createWings() {
        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.2
        });

        const darkGrayMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.3
        });

        const redMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.6,
            roughness: 0.4
        });

        const haloMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.1
        });

        // Front Wing Assembly - Lower main plane
        const frontWingMainGeometry = new THREE.BoxGeometry(2.0, 0.03, 0.15);
        const frontWingMain = new THREE.Mesh(frontWingMainGeometry, blackMaterial);
        frontWingMain.position.set(0, -0.05, 4.3);
        this.car.add(frontWingMain);

        // Front Wing - Upper flap
        const frontWingFlapGeometry = new THREE.BoxGeometry(1.8, 0.02, 0.12);
        const frontWingFlap = new THREE.Mesh(frontWingFlapGeometry, darkGrayMaterial);
        frontWingFlap.position.set(0, 0.02, 4.35);
        this.car.add(frontWingFlap);

        // Front Wing End Plates
        const frontEndPlateGeometry = new THREE.BoxGeometry(0.03, 0.3, 0.15);
        const frontEndPlateL = new THREE.Mesh(frontEndPlateGeometry, redMaterial);
        frontEndPlateL.position.set(1.1, 0.1, 4.3);
        this.car.add(frontEndPlateL);
        
        const frontEndPlateR = new THREE.Mesh(frontEndPlateGeometry, redMaterial);
        frontEndPlateR.position.set(-1.1, 0.1, 4.3);
        this.car.add(frontEndPlateR);

        // Rear Wing - Main Element (Much larger and properly proportioned)
        const rearWingMainGeometry = new THREE.BoxGeometry(1.6, 0.4, 0.08);
        const rearWingMain = new THREE.Mesh(rearWingMainGeometry, blackMaterial);
        rearWingMain.position.set(0, 0.9, -2.8);
        this.car.add(rearWingMain);

        // Rear Wing - Upper Flap
        const rearWingFlapGeometry = new THREE.BoxGeometry(1.4, 0.25, 0.06);
        const rearWingFlap = new THREE.Mesh(rearWingFlapGeometry, darkGrayMaterial);
        rearWingFlap.position.set(0, 1.15, -2.9);
        this.car.add(rearWingFlap);

        // Rear Wing End Plates - Much larger
        const rearEndPlateGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.08);
        const rearEndPlateL = new THREE.Mesh(rearEndPlateGeometry, redMaterial);
        rearEndPlateL.position.set(0.85, 0.9, -2.8);
        this.car.add(rearEndPlateL);
        
        const rearEndPlateR = new THREE.Mesh(rearEndPlateGeometry, redMaterial);
        rearEndPlateR.position.set(-0.85, 0.9, -2.8);
        this.car.add(rearEndPlateR);

        // Rear Wing Support Pillars
        const supportPillarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const supportPillarL = new THREE.Mesh(supportPillarGeometry, haloMaterial);
        supportPillarL.position.set(0.3, 0.6, -2.6);
        this.car.add(supportPillarL);
        
        const supportPillarR = new THREE.Mesh(supportPillarGeometry, haloMaterial);
        supportPillarR.position.set(-0.3, 0.6, -2.6);
        this.car.add(supportPillarR);

        // DRS Actuator on rear wing
        const drsActuatorGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const drsActuator = new THREE.Mesh(drsActuatorGeometry, haloMaterial);
        drsActuator.position.set(0, 1.3, -2.85);
        this.car.add(drsActuator);
    }

    /**
     * Creates side pods with aerodynamic shape
     */
    createSidePods() {
        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.8,
            roughness: 0.2
        });

        // Side Pods - More aerodynamic shape, extended
        const sidePodGeometry = new THREE.BoxGeometry(0.5, 0.5, 2.8);
        const sidePodL = new THREE.Mesh(sidePodGeometry, chassisMaterial);
        sidePodL.position.set(0.9, 0.25, 0.5);
        this.car.add(sidePodL);
        
        const sidePodR = new THREE.Mesh(sidePodGeometry, chassisMaterial);
        sidePodR.position.set(-0.9, 0.25, 0.5);
        this.car.add(sidePodR);
    }

    /**
     * Creates the engine cover
     */
    createEngineCover() {
        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.8,
            roughness: 0.2
        });

        const darkGrayMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });

        // Engine Cover - Tapered rear section, extended
        const engineCoverGeometry = new THREE.BoxGeometry(1.2, 0.6, 1.8);
        const engineCover = new THREE.Mesh(engineCoverGeometry, chassisMaterial);
        engineCover.position.set(0, 0.3, -1.8);
        this.car.add(engineCover);

        // Exhaust Pipe
        const exhaustGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
        const exhaust = new THREE.Mesh(exhaustGeometry, darkGrayMaterial);
        exhaust.position.set(0, 0.2, -2.6);
        exhaust.rotation.x = Math.PI / 2;
        this.car.add(exhaust);
    }

    /**
     * Creates all four wheels with proper F1 proportions
     */
    createWheels() {
        const wheelPositions = [
            { x: 1.0, y: 0.3, z: 3.5, isFront: true, compound: 'MEDIUM' },     // Front Left
            { x: -1.0, y: 0.3, z: 3.5, isFront: true, compound: 'MEDIUM' },    // Front Right
            { x: 1.1, y: 0.3, z: -2.0, isFront: false, compound: 'MEDIUM' },  // Rear Left
            { x: -1.1, y: 0.3, z: -2.0, isFront: false, compound: 'MEDIUM' }  // Rear Right
        ];

        wheelPositions.forEach(pos => {
            const wheel = new Wheel(pos.isFront, pos.x, pos.y, pos.z, pos.compound);
            this.wheels.push(wheel);
            this.car.add(wheel.getObject());
        });
    }

    /**
     * Creates suspension arms
     */
    createSuspension() {
        const suspensionMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.2
        });

        // Front Suspension Arms
        const frontSuspensionGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
        const frontSuspensionL = new THREE.Mesh(frontSuspensionGeometry, suspensionMaterial);
        frontSuspensionL.position.set(0.8, 0.05, 2.8);
        frontSuspensionL.rotation.y = 0.2;
        this.car.add(frontSuspensionL);
        
        const frontSuspensionR = new THREE.Mesh(frontSuspensionGeometry, suspensionMaterial);
        frontSuspensionR.position.set(-0.8, 0.05, 2.8);
        frontSuspensionR.rotation.y = -0.2;
        this.car.add(frontSuspensionR);

        // Rear Suspension Arms
        const rearSuspensionGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
        const rearSuspensionL = new THREE.Mesh(rearSuspensionGeometry, suspensionMaterial);
        rearSuspensionL.position.set(0.9, 0.05, -1.7);
        rearSuspensionL.rotation.y = 0.2;
        this.car.add(rearSuspensionL);
        
        const rearSuspensionR = new THREE.Mesh(rearSuspensionGeometry, suspensionMaterial);
        rearSuspensionR.position.set(-0.9, 0.05, -1.7);
        rearSuspensionR.rotation.y = -0.2;
        this.car.add(rearSuspensionR);
    }

    /**
     * Creates brake discs
     */
    createBrakeDiscs() {
        const brakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.3
        });

        // Front Brake Discs
        const frontBrakeGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.015, 16);
        const frontBrakeL = new THREE.Mesh(frontBrakeGeometry, brakeMaterial);
        frontBrakeL.position.set(1.05, -0.1, 2.8);
        frontBrakeL.rotation.x = Math.PI / 2;
        this.car.add(frontBrakeL);
        
        const frontBrakeR = new THREE.Mesh(frontBrakeGeometry, brakeMaterial);
        frontBrakeR.position.set(-1.05, -0.1, 2.8);
        frontBrakeR.rotation.x = Math.PI / 2;
        this.car.add(frontBrakeR);
        
        // Rear Brake Discs
        const rearBrakeGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.015, 16);
        const rearBrakeL = new THREE.Mesh(rearBrakeGeometry, brakeMaterial);
        rearBrakeL.position.set(1.15, -0.1, -2.0);
        rearBrakeL.rotation.x = Math.PI / 2;
        this.car.add(rearBrakeL);
        
        const rearBrakeR = new THREE.Mesh(rearBrakeGeometry, brakeMaterial);
        rearBrakeR.position.set(-1.15, -0.1, -2.0);
        rearBrakeR.rotation.x = Math.PI / 2;
        this.car.add(rearBrakeR);
    }

    /**
     * Creates additional details like mirrors, number plates, and aerodynamic elements
     */
    createDetails() {
        const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });

        // Racing Number Plates
        const numberPlateGeometry = new THREE.PlaneGeometry(0.3, 0.25);
        const numberPlateL = new THREE.Mesh(numberPlateGeometry, whiteMaterial);
        numberPlateL.position.set(0.71, 0.52, 0);
        this.car.add(numberPlateL);
        
        const numberPlateR = new THREE.Mesh(numberPlateGeometry, whiteMaterial);
        numberPlateR.position.set(-0.71, 0.52, 0);
        numberPlateR.rotation.y = Math.PI;
        this.car.add(numberPlateR);

        // Side Mirrors
        const mirrorGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.08);
        const mirrorL = new THREE.Mesh(mirrorGeometry, blackMaterial);
        mirrorL.position.set(0.75, 0.6, 0.4);
        this.car.add(mirrorL);
        
        const mirrorR = new THREE.Mesh(mirrorGeometry, blackMaterial);
        mirrorR.position.set(-0.75, 0.6, 0.4);
        this.car.add(mirrorR);

        // Barge Boards
        const bargeBoardGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.4);
        const bargeBoardL = new THREE.Mesh(bargeBoardGeometry, blackMaterial);
        bargeBoardL.position.set(0.8, 0.1, 1.5);
        bargeBoardL.rotation.x = 0.3;
        this.car.add(bargeBoardL);
        
        const bargeBoardR = new THREE.Mesh(bargeBoardGeometry, blackMaterial);
        bargeBoardR.position.set(-0.8, 0.1, 1.5);
        bargeBoardR.rotation.x = -0.3;
        this.car.add(bargeBoardR);

        // Floor Edge
        const floorEdgeGeometry = new THREE.BoxGeometry(0.05, 0.02, 3.0);
        const floorEdgeL = new THREE.Mesh(floorEdgeGeometry, blackMaterial);
        floorEdgeL.position.set(1.0, -0.05, 1.0);
        this.car.add(floorEdgeL);
        
        const floorEdgeR = new THREE.Mesh(floorEdgeGeometry, blackMaterial);
        floorEdgeR.position.set(-1.0, -0.05, 1.0);
        this.car.add(floorEdgeR);
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