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
        this.physicsWireframe = null; // Store reference to physics wireframe
        
        // Define wheel positions as a shared constant
        this.wheelPositions = [
            { x: 1.0, y: -0.33, z: 3.0, isFront: true, compound: 'MEDIUM' },     // Front Left
            { x: -1.0, y: -0.33, z: 3.0, isFront: true, compound: 'MEDIUM' },    // Front Right
            { x: 1.1, y: -0.33, z: -2.0, isFront: false, compound: 'MEDIUM' },  // Rear Left
            { x: -1.1, y: -0.33, z: -2.0, isFront: false, compound: 'MEDIUM' }  // Rear Right
        ];
        
        this.createCar();
        this.createPhysicsWireframe(); // Create initial physics wireframe
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
        
        // Calculate optimal car position so wheels are exactly on the ground
        const carYPosition = this.calculateOptimalCarYPosition();
        
        this.car.position.set(0, carYPosition, 0);
        this.car.rotation.y = 0; // Align car with z-axis (pointing towards positive z)
        
        // Ensure car renders after road lines
        this.car.renderOrder = 1;
    }

    /**
     * Calculates the optimal Y position for the car so wheels are exactly on the ground
     * @returns {number} The optimal Y position for the car
     */
    calculateOptimalCarYPosition() {
        const wheelRadius = CAR_DIMENSIONS.WHEEL.radius;
        
        // Extract wheel Y position from the first wheel (all wheels have same Y position)
        const wheelYPosition = this.wheelPositions[0].y; // This is now -0.33
        const groundLevel = 0; // Ground level
        
        // Formula: carY = groundLevel - wheelYPosition + wheelRadius + small offset for better physics contact
        // This ensures wheel bottom is slightly above ground level for better physics contact
        return groundLevel - wheelYPosition + wheelRadius + 0.05;
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
        chassis.name = 'chassis';
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
        nosePart1.name = 'nosePart1';
        this.car.add(nosePart1);

        // Integrated Nose Section - Part 2: Tapered middle
        const nosePart2Geometry = new THREE.BoxGeometry(0.7, 0.15, 0.8);
        const nosePart2 = new THREE.Mesh(nosePart2Geometry, chassisMaterial);
        nosePart2.position.set(0, 0.15, 3.6);
        nosePart2.name = 'nosePart2';
        this.car.add(nosePart2);

        // Integrated Nose Section - Part 3: Final taper
        const nosePart3Geometry = new THREE.BoxGeometry(0.4, 0.12, 0.3);
        const nosePart3 = new THREE.Mesh(nosePart3Geometry, chassisMaterial);
        nosePart3.position.set(0, 0.15, 4.1);
        nosePart3.name = 'nosePart3';
        this.car.add(nosePart3);


        // Nose Pillar - Central support structure
        const nosePillarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
        const nosePillar = new THREE.Mesh(nosePillarGeometry, blackMaterial);
        nosePillar.position.set(0, 0.05, 3.8);
        nosePillar.name = 'nosePillar';
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
        cockpit.name = 'cockpit';
        this.car.add(cockpit);

        // Cockpit Opening - Driver seat area
        const cockpitOpeningGeometry = new THREE.BoxGeometry(0.7, 0.15, 1.6);
        const cockpitOpening = new THREE.Mesh(cockpitOpeningGeometry, blackMaterial);
        cockpitOpening.position.set(0, 0.6, -0.5);
        cockpitOpening.name = 'cockpitOpening';
        this.car.add(cockpitOpening);

        // Halo Safety Device
        const haloGeometry = new THREE.TorusGeometry(0.4, 0.03, 8, 16);
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.set(0, 0.75, -0.3);
        halo.rotation.x = Math.PI / 2;
        halo.name = 'halo';
        this.car.add(halo);

        // Air Intake above cockpit
        const airIntakeGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.4);
        const airIntake = new THREE.Mesh(airIntakeGeometry, blackMaterial);
        airIntake.position.set(0, 0.7, -0.3);
        airIntake.name = 'airIntake';
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
        frontWingMain.position.set(0, 0.15, 4.3);
        frontWingMain.name = 'frontWingMain';
        this.car.add(frontWingMain);

        // Front Wing - Upper flap
        const frontWingFlapGeometry = new THREE.BoxGeometry(1.8, 0.02, 0.12);
        const frontWingFlap = new THREE.Mesh(frontWingFlapGeometry, darkGrayMaterial);
        frontWingFlap.position.set(0, 0.22, 4.35);
        frontWingFlap.name = 'frontWingFlap';
        this.car.add(frontWingFlap);

        // Front Wing End Plates
        const frontEndPlateGeometry = new THREE.BoxGeometry(0.03, 0.3, 0.15);
        const frontEndPlateL = new THREE.Mesh(frontEndPlateGeometry, redMaterial);
        frontEndPlateL.position.set(1.0, 0.3, 4.3);
        frontEndPlateL.name = 'frontEndPlateL';
        this.car.add(frontEndPlateL);
        
        const frontEndPlateR = new THREE.Mesh(frontEndPlateGeometry, redMaterial);
        frontEndPlateR.position.set(-1.0, 0.3, 4.3);
        frontEndPlateR.name = 'frontEndPlateR';
        this.car.add(frontEndPlateR);

        // Rear Wing - Main Element (Much larger and properly proportioned)
        const rearWingMainGeometry = new THREE.BoxGeometry(1.6, 0.4, 0.08);
        const rearWingMain = new THREE.Mesh(rearWingMainGeometry, blackMaterial);
        rearWingMain.position.set(0, 0.9, -2.8);
        rearWingMain.name = 'rearWingMain';
        this.car.add(rearWingMain);

        // Rear Wing - Upper Flap
        const rearWingFlapGeometry = new THREE.BoxGeometry(1.4, 0.25, 0.06);
        const rearWingFlap = new THREE.Mesh(rearWingFlapGeometry, darkGrayMaterial);
        rearWingFlap.position.set(0, 1.15, -2.9);
        rearWingFlap.name = 'rearWingFlap';
        this.car.add(rearWingFlap);

        // Rear Wing End Plates - Much larger
        const rearEndPlateGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.08);
        const rearEndPlateL = new THREE.Mesh(rearEndPlateGeometry, redMaterial);
        rearEndPlateL.position.set(0.85, 0.9, -2.8);
        rearEndPlateL.name = 'rearEndPlateL';
        this.car.add(rearEndPlateL);
        
        const rearEndPlateR = new THREE.Mesh(rearEndPlateGeometry, redMaterial);
        rearEndPlateR.position.set(-0.85, 0.9, -2.8);
        rearEndPlateR.name = 'rearEndPlateR';
        this.car.add(rearEndPlateR);

        // Rear Wing Support Pillars
        const supportPillarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const supportPillarL = new THREE.Mesh(supportPillarGeometry, haloMaterial);
        supportPillarL.position.set(0.3, 0.6, -2.6);
        supportPillarL.name = 'supportPillarL';
        this.car.add(supportPillarL);
        
        const supportPillarR = new THREE.Mesh(supportPillarGeometry, haloMaterial);
        supportPillarR.position.set(-0.3, 0.6, -2.6);
        supportPillarR.name = 'supportPillarR';
        this.car.add(supportPillarR);

        // DRS Actuator on rear wing
        const drsActuatorGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const drsActuator = new THREE.Mesh(drsActuatorGeometry, haloMaterial);
        drsActuator.position.set(0, 1.3, -2.85);
        drsActuator.name = 'drsActuator';
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
        sidePodL.name = 'sidePodL';
        this.car.add(sidePodL);
        
        const sidePodR = new THREE.Mesh(sidePodGeometry, chassisMaterial);
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
            wheelObject.userData.isWheel = true; // Mark as wheel for exclusion from bounding box
            this.wheels.push(wheel);
            this.car.add(wheelObject);
        });
    }

    /**
     * Creates additional details like mirrors, number plates, and aerodynamic elements
     */
    createDetails() {
        const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const orangeMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF5F1F, // Fluorescent orange
            metalness: 0.1,
            roughness: 0.1
        });

        // Side Mirrors
        const mirrorGeometry = new THREE.BoxGeometry(0.16, 0.08, 0.12);
        const mirrorL = new THREE.Mesh(mirrorGeometry, orangeMaterial);
        mirrorL.position.set(0.85, 0.65, 1.5);
        mirrorL.name = 'mirrorL';
        this.car.add(mirrorL);
        
        const mirrorR = new THREE.Mesh(mirrorGeometry, orangeMaterial);
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

    /**
     * Gets the physics wireframe mesh
     * @returns {THREE.Mesh} The physics wireframe mesh
     */
    getPhysicsWireframe() {
        return this.physicsWireframe;
    }

    /**
     * Gets the physics wireframe's world position and rotation
     * @returns {Object} Object containing position and rotation
     */
    getPhysicsWireframeTransform() {
        if (!this.physicsWireframe) return null;

        const worldPosition = new THREE.Vector3();
        this.physicsWireframe.getWorldPosition(worldPosition);
        
        return {
            position: worldPosition,
            rotation: this.physicsWireframe.getWorldQuaternion(new THREE.Quaternion()),
            size: {
                width: this.physicsWireframe.geometry.parameters.width,
                height: this.physicsWireframe.geometry.parameters.height,
                depth: this.physicsWireframe.geometry.parameters.depth
            }
        };
    }

    /**
     * Gets the wheel positions array
     * @returns {Array} Array of wheel position objects
     */
    getWheelPositions() {
        return this.wheelPositions;
    }

    /**
     * Gets the wheels array
     * @returns {Array} Array of Wheel objects
     */
    getWheels() {
        return this.wheels;
    }

    /**
     * Creates and stores the physics wireframe mesh (excluding wheels, rear wing, and nose pillar)
     */
    createPhysicsWireframe() {
        // Create a group to hold all car parts except wheels, rear wing, and nose pillar
        const carBodyGroup = new THREE.Group();
        
        // Clone the car and remove wheels, rear wing, and nose pillar
        const carClone = this.car.clone();
        carClone.children.forEach(child => {
            // Check if this child is a wheel by looking at its userData
            if (!child.userData || !child.userData.isWheel) {
                // Check if this is a rear wing component by name (rear wing is named 'rearWingMain')
                const excludedComponents = new Set([
                    'rearWingMain',
                    'rearWingFlap', 
                    'nosePillar',
                    'rearEndPlateL',
                    'rearEndPlateR',
                    'drsActuator',
                    'supportPillarL',
                    'supportPillarR',
                ]);
                
                if (!excludedComponents.has(child.name)) {
                    carBodyGroup.add(child.clone());
                }
            }
        });

        // Calculate bounding box
        const boundingBox = new THREE.Box3().setFromObject(carBodyGroup);
        const boxSize = boundingBox.getSize(new THREE.Vector3());
        const boxCenter = boundingBox.getCenter(new THREE.Vector3());

        // Create wireframe geometry
        const boxGeometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });

        this.physicsWireframe = new THREE.Mesh(boxGeometry, wireframeMaterial);
        this.physicsWireframe.position.copy(boxCenter);
        
        // Add wireframe as child of car for automatic positioning
        this.car.add(this.physicsWireframe);
        
        // Store original center offset for physics calculations
        this.physicsWireframe.userData.centerOffset = boxCenter.clone();
    }
} 