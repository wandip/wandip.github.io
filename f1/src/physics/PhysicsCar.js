import * as THREE from 'three';
import { PHYSICS_CONFIG, PHYSICS_WHEEL_POSITIONS, WHEEL_DIRECTIONS } from './PhysicsConstants';

/**
 * Handles all physics-related car logic and vehicle controller
 */
export class PhysicsCar {
    constructor(rapierPhysics, visualCar, movement, scene) {
        this.rapierPhysics = rapierPhysics;
        this.visualCar = visualCar;
        this.scene = scene; // Add scene reference to add wireframe
        this.chassisBody = null;
        this.vehicleController = null;
        this.physicsWheels = [];
        this.physicsWireframe = null;
        
        // Use the shared movement object from Game
        this.movement = movement || {
            forward: 0,
            right: 0,
            brake: 0,
            accelerateForce: { value: 0, min: PHYSICS_CONFIG.ENGINE_FORCE_MIN, max: PHYSICS_CONFIG.ENGINE_FORCE_MAX, step: PHYSICS_CONFIG.ENGINE_FORCE_STEP },
            brakeForce: { value: 0, min: 0, max: PHYSICS_CONFIG.BRAKE_FORCE_MAX, step: PHYSICS_CONFIG.BRAKE_FORCE_STEP }
        };
        
        // Add rotation tracking to handle angle wrapping
        this.lastRotation = 0;
        this.rotationOffset = 0;
        this.totalRotations = 0;
        
        this.setupPhysics();
    }

    /**
     * Sets up the physics car with chassis body and vehicle controller
     */
    setupPhysics() {
        // Get the physics wireframe from visual car
        this.physicsWireframe = this.visualCar.getPhysicsWireframe();
        if (!this.physicsWireframe) {
            console.error('Physics wireframe not available!');
            return;
        }

        const carObject = this.visualCar.getObject();
        
        // Calculate optimal car position: wheel radius + small offset above ground
        const wheelRadius = PHYSICS_CONFIG.WHEEL_RADIUS;
        const wheelYPosition = PHYSICS_WHEEL_POSITIONS[0].y; // This is now -0.33
        const optimalCarY = PHYSICS_CONFIG.GROUND_LEVEL - wheelYPosition + wheelRadius + PHYSICS_CONFIG.CAR_HEIGHT_OFFSET;
        
        // Position the car behind the checkered line (10 units behind in z-direction)
        carObject.position.set(0, optimalCarY, -7);
        
        // Update wireframe position to match car position
        const centerOffset = this.physicsWireframe.userData.centerOffset || new THREE.Vector3();
        this.physicsWireframe.position.copy(carObject.position).add(centerOffset);
        
        // Add wireframe to scene (not as child of car)
        this.scene.add(this.physicsWireframe);
        
        // Now create the physics body at the wireframe's current world position
        this.rapierPhysics.addMesh(this.physicsWireframe, PHYSICS_CONFIG.CAR_MASS, PHYSICS_CONFIG.CAR_RESTITUTION);
        this.chassisBody = this.physicsWireframe.userData.physics.body;
        

        
        // Create vehicle controller with the chassis body
        this.vehicleController = this.rapierPhysics.world.createVehicleController(this.chassisBody);


        
        // Add physics wheels that coincide with visual wheels
        this.addPhysicsWheels();
    }

    /**
     * Adds physics wheels that coincide with the visual wheels
     */
    addPhysicsWheels() {
        const carObject = this.visualCar.getObject();
        
        PHYSICS_WHEEL_POSITIONS.forEach((pos, index) => {
            this.addPhysicsWheel(index, pos, carObject);
        });
    }

    /**
     * Adds a single physics wheel
     */
    addPhysicsWheel(index, pos, carMesh) {
        const wheelRadius = PHYSICS_CONFIG.WHEEL_RADIUS;
        const wheelWidth = PHYSICS_CONFIG.WHEEL_WIDTH;
        const suspensionRestLength = PHYSICS_CONFIG.SUSPENSION_REST_LENGTH;
        
        // Wheel positions are relative to car center, but we need to account for car's Y position
        // The car is positioned at wheelRadius + 0.05, so wheels should be at their relative Y positions
        const wheelPosition = {
            x: pos.x,
            y: pos.y, // This is relative to car center, which is now at wheelRadius + 0.05
            z: pos.z
        };



        // Add the wheel to the vehicle controller
        try {
            this.vehicleController.addWheel(
                wheelPosition,
                WHEEL_DIRECTIONS.DIRECTION,
                WHEEL_DIRECTIONS.AXLE,
                suspensionRestLength,
                wheelRadius
            );
        } catch (e) {
            // addWheel method not available
        }

        // Set wheel friction for better traction
        try {
            this.vehicleController.setWheelFrictionSlip(index, PHYSICS_CONFIG.WHEEL_FRICTION_SLIP);
        } catch (e) {
            // setWheelFrictionSlip not available
        }

        // Create wire mesh for the wheel that coincides with visual wheel
        const wireGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
        wireGeometry.rotateZ(Math.PI * 0.5);
        const wireMaterial = new THREE.MeshBasicMaterial({ 
            visible: false,
            color: 0xff0000, 
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const wireWheel = new THREE.Mesh(wireGeometry, wireMaterial);
        wireWheel.position.copy(pos);
        wireWheel.userData.isPhysicsWheel = true;
        wireWheel.userData.wheelIndex = index;

        // Store reference to physics wheel
        this.physicsWheels[index] = {
            mesh: wireWheel,
            index: index,
            position: pos
        };

        carMesh.add(wireWheel);
    }

    /**
     * Updates car controls based on input
     */
    updateCarControls() {
        let accelerateForce = 0;

        if (this.movement.forward < 0) {
            accelerateForce = this.movement.accelerateForce.value - this.movement.accelerateForce.step;
            if (accelerateForce < this.movement.accelerateForce.min) accelerateForce = this.movement.accelerateForce.min;
        } else if (this.movement.forward > 0) {
            accelerateForce = this.movement.accelerateForce.value + this.movement.accelerateForce.step;
            if (accelerateForce > this.movement.accelerateForce.max) accelerateForce = this.movement.accelerateForce.max;
        } else {
            // Gradually reduce force when no input
            accelerateForce = this.movement.accelerateForce.value * PHYSICS_CONFIG.FORCE_DECAY;
            if (Math.abs(accelerateForce) < 1) accelerateForce = 0;
        }

        this.movement.accelerateForce.value = accelerateForce;

        let brakeForce = 0;

        if (this.movement.brake > 0) {
            brakeForce = this.movement.brakeForce.value + this.movement.brakeForce.step;
            if (brakeForce > this.movement.brakeForce.max) brakeForce = this.movement.brakeForce.max;
        } else {
            // Reset brake force when not braking
            brakeForce = 0;
        }

        this.movement.brakeForce.value = brakeForce * 5;

        const engineForce = accelerateForce;

        try {
            this.vehicleController.setWheelEngineForce(0, engineForce); 
            this.vehicleController.setWheelEngineForce(1, engineForce); 
            this.vehicleController.setWheelEngineForce(2, engineForce); 
            this.vehicleController.setWheelEngineForce(3, engineForce);
        } catch (e) {
            // setWheelEngineForce not available, using alternative approach
            // Fallback: Apply force directly to chassis body
            console.warn('setWheelEngineForce not available, using alternative approach');
            if (this.chassisBody && engineForce !== 0) {
                const forceVector = new this.rapierPhysics.rapier.Vector3(0, 0, engineForce * 0.1);
                this.chassisBody.applyImpulse(forceVector, true);
            }
        }

        // Fix steering logic - use proper direction mapping
        let currentSteering = 0;
        try {
            currentSteering = this.vehicleController.wheelSteering(0);
        } catch (e) {
            // wheelSteering not available
        }
        
        const steerDirection = this.movement.right; // This is already correct: 1 for left, -1 for right
        const maxSteerAngle = PHYSICS_CONFIG.MAX_STEER_ANGLE;

        const targetSteering = maxSteerAngle * steerDirection;
        const steering = THREE.MathUtils.lerp(currentSteering, targetSteering, PHYSICS_CONFIG.STEERING_RESPONSE);

        // Apply steering to front wheels only (wheels 0 and 1)
        try {
            this.vehicleController.setWheelSteering(0, steering); // Front Left
            this.vehicleController.setWheelSteering(1, steering); // Front Right
        } catch (e) {
            // setWheelSteering not available
        }

        // Update visual wheel steering to match physics
        this.visualCar.updateWheelSteering(steering);

        // Apply brakes to all wheels
        const wheelBrake = brakeForce;
        try {
            this.vehicleController.setWheelBrake(0, wheelBrake);
            this.vehicleController.setWheelBrake(1, wheelBrake);
            this.vehicleController.setWheelBrake(2, wheelBrake);
            this.vehicleController.setWheelBrake(3, wheelBrake);
        } catch (e) {
            // setWheelBrake not available
        }
    }

    /**
     * Updates physics wheel positions to match visual wheels
     */
    updatePhysicsWheels() {
        if (!this.physicsWheels || this.physicsWheels.length === 0) return;

        const carObject = this.visualCar.getObject();
        const visualWheels = this.visualCar.getWheels();

        this.physicsWheels.forEach((physicsWheel, index) => {
            if (physicsWheel && physicsWheel.mesh && visualWheels[index]) {
                const visualWheel = visualWheels[index];
                const visualWheelObject = visualWheel.getObject();
                
                // Use local position instead of world position to avoid double transformation
                // Since both physics wheels and visual wheels are children of the car
                physicsWheel.mesh.position.copy(visualWheelObject.position);
                
                // Update physics wheel rotation to match visual wheel steering
                if (visualWheel.isFront) {
                    physicsWheel.mesh.rotation.y = visualWheelObject.rotation.y;
                }
            }
        });
    }

    /**
     * Updates the visual car to match physics wireframe position
     * This should be called after the physics system updates the wireframe
     */
    updateVisualCar() {
        if (!this.physicsWireframe) return;
        
        // Update the visual car based on the physics wireframe position
        this.visualCar.updateCarFromPhysicsWireframe();
    }

    /**
     * Gets the car's rotation as Euler angles (Y rotation for camera)
     * @returns {number} The car's Y rotation in radians
     */
    getCarRotation() {
        if (!this.chassisBody) return 0;
        
        const physicsRotation = this.chassisBody.rotation();
        const quaternion = new THREE.Quaternion(physicsRotation.x, physicsRotation.y, physicsRotation.z, physicsRotation.w);
        
        // Use quaternion directly to calculate Y rotation to avoid Euler angle singularities
        // Extract Y rotation from quaternion using atan2
        // For a quaternion (x, y, z, w), the Y rotation is: 2 * atan2(y, w)
        let currentRotation = 2 * Math.atan2(quaternion.y, quaternion.w);
        
        // Calculate the shortest angular distance between last and current rotation
        let angleDifference = currentRotation - this.lastRotation;
        
        // Handle wrapping around ±π
        if (angleDifference > Math.PI) {
            angleDifference -= 2 * Math.PI;
        } else if (angleDifference < -Math.PI) {
            angleDifference += 2 * Math.PI;
        }
        
        // Update the total rotation
        this.totalRotations += angleDifference;
        
        // Store current rotation for next frame
        this.lastRotation = currentRotation;
        

        
        return this.totalRotations;
    }

    /**
     * Gets the chassis body
     */
    getChassisBody() {
        return this.chassisBody;
    }

    /**
     * Gets the vehicle controller
     */
    getVehicleController() {
        return this.vehicleController;
    }

    /**
     * Gets the movement object
     */
    getMovement() {
        return this.movement;
    }

    /**
     * Gets the physics wheels array
     */
    getPhysicsWheels() {
        return this.physicsWheels;
    }

    /**
     * Checks if physics is ready
     */
    isPhysicsReady() {
        return this.chassisBody && this.vehicleController;
    }

    /**
     * Gets physics debug information
     */
    getPhysicsDebugInfo() {
        if (!this.isPhysicsReady()) {
                    return {
            physicsReady: false,
            position: { x: 'N/A', y: 'N/A', z: 'N/A' },
            velocity: { x: 'N/A', y: 'N/A', z: 'N/A' },
            speed: 'N/A',
            engineForce: 'N/A',
            brakeForce: 'N/A',
            input: { forward: this.movement.forward, right: this.movement.right, brake: this.movement.brake },
            wheelForces: ['N/A', 'N/A', 'N/A', 'N/A'],
            suspension: ['N/A', 'N/A', 'N/A', 'N/A'],
            vehicleState: 'Physics Not Ready',
            groundContact: false,
            rotation: 'N/A'
        };
        }

        const physicsPosition = this.chassisBody.translation();
        const velocity = this.chassisBody.linvel();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        // Collect wheel forces
        const wheelForces = [
            this.movement.accelerateForce.value.toFixed(1),
            this.movement.accelerateForce.value.toFixed(1),
            this.movement.accelerateForce.value.toFixed(1),
            this.movement.accelerateForce.value.toFixed(1)
        ];
        
        // Collect wheel contact status
        let wheelContacts = ['❌', '❌', '❌', '❌'];
        let suspensionLengths = ['0.300', '0.300', '0.300', '0.300'];
        
        try {
            wheelContacts = [
                this.vehicleController.wheelSuspensionLength(0) < 0.3 ? '✅' : '❌',
                this.vehicleController.wheelSuspensionLength(1) < 0.3 ? '✅' : '❌',
                this.vehicleController.wheelSuspensionLength(2) < 0.3 ? '✅' : '❌',
                this.vehicleController.wheelSuspensionLength(3) < 0.3 ? '✅' : '❌'
            ];
            
            suspensionLengths = [
                this.vehicleController.wheelSuspensionLength(0).toFixed(3),
                this.vehicleController.wheelSuspensionLength(1).toFixed(3),
                this.vehicleController.wheelSuspensionLength(2).toFixed(3),
                this.vehicleController.wheelSuspensionLength(3).toFixed(3)
            ];
        } catch (e) {
            // wheelSuspensionLength methods not available
        }
        
        // Check ground contact
        const groundContact = wheelContacts.some(contact => contact === '✅');
        
        // Get vehicle state
        let vehicleState = 'Wheels: 4';
        try {
            vehicleState = `Wheels: ${this.vehicleController.numWheels()}`;
        } catch (e) {
            // numWheels method not available
        }
        
        return {
            physicsReady: true,
            position: { 
                x: physicsPosition.x.toFixed(2), 
                y: physicsPosition.y.toFixed(2), 
                z: physicsPosition.z.toFixed(2) 
            },
            velocity: { 
                x: velocity.x.toFixed(2), 
                y: velocity.y.toFixed(2), 
                z: velocity.z.toFixed(2) 
            },
            speed: speed.toFixed(2),
            engineForce: this.movement.accelerateForce.value.toFixed(1),
            brakeForce: this.movement.brakeForce.value.toFixed(1),
            input: { 
                forward: this.movement.forward, 
                right: this.movement.right, 
                brake: this.movement.brake 
            },
            wheelForces: wheelForces,
            suspension: suspensionLengths,
            vehicleState: vehicleState,
            groundContact: groundContact,
            rotation: (this.getCarRotation() * 180 / Math.PI).toFixed(2) // Convert radians to degrees
        };
    }
} 