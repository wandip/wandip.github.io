import * as THREE from 'three';
import { PHYSICS_CONFIG, WHEEL_POSITIONS, WHEEL_DIRECTIONS } from './PhysicsConstants';

/**
 * Handles all physics-related car logic and vehicle controller
 */
export class PhysicsCar {
    constructor(rapierPhysics, visualCar, movement) {
        this.rapierPhysics = rapierPhysics;
        this.visualCar = visualCar;
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

        const wireframeTransform = this.visualCar.getPhysicsWireframeTransform();
        const carObject = this.visualCar.getObject();
        
        // Calculate optimal car position: wheel radius + small offset above ground
        const wheelRadius = PHYSICS_CONFIG.WHEEL_RADIUS;
        const wheelYPosition = WHEEL_POSITIONS[0].y; // This is now -0.33
        const optimalCarY = PHYSICS_CONFIG.GROUND_LEVEL - wheelYPosition + wheelRadius + PHYSICS_CONFIG.CAR_HEIGHT_OFFSET;
        
        // Update car visual position
        carObject.position.y = optimalCarY;
        
        console.log('Car positioning:', {
            wheelRadius,
            wheelYPosition,
            optimalCarY,
            carPosition: carObject.position
        });
        
        // Create a rigid body for the car chassis using wireframe dimensions
        this.chassisBody = this.rapierPhysics.world.createRigidBody(
            this.rapierPhysics.rapier.RigidBodyDesc.dynamic()
                .setTranslation(carObject.position.x, optimalCarY, carObject.position.z)
                .setRotation(carObject.quaternion)
        );

        // Create collision shape based on wireframe geometry
        const wireframeSize = wireframeTransform.size;
        const chassisCollider = this.rapierPhysics.world.createCollider(
            this.rapierPhysics.rapier.ColliderDesc.cuboid(
                wireframeSize.width / 2,
                wireframeSize.height / 2,
                wireframeSize.depth / 2
            ),
            this.chassisBody
        );

        // Store physics data in the wireframe for future reference
        this.physicsWireframe.userData.physics = {
            body: this.chassisBody,
            collider: chassisCollider
        };

        // Create vehicle controller with the chassis body
        this.vehicleController = this.rapierPhysics.world.createVehicleController(this.chassisBody);
        
        console.log('Physics setup complete:', {
            chassisBody: !!this.chassisBody,
            vehicleController: !!this.vehicleController,
            wireframeSize
        });
        
        // Add physics wheels that coincide with visual wheels
        this.addPhysicsWheels();
    }

    /**
     * Adds physics wheels that coincide with the visual wheels
     */
    addPhysicsWheels() {
        const carObject = this.visualCar.getObject();
        
        WHEEL_POSITIONS.forEach((pos, index) => {
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

        console.log(`Adding wheel ${index}:`, {
            position: wheelPosition,
            radius: wheelRadius,
            suspensionLength: suspensionRestLength
        });

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
            console.log('addWheel method not available');
        }

        // Set suspension stiffness for wheel
        try {
            this.vehicleController.setWheelSuspensionStiffness(index, PHYSICS_CONFIG.SUSPENSION_STIFFNESS);
        } catch (e) {
            console.log('setWheelSuspensionStiffness not available');
        }

        // Set wheel friction for better traction
        try {
            this.vehicleController.setWheelFrictionSlip(index, PHYSICS_CONFIG.WHEEL_FRICTION_SLIP);
        } catch (e) {
            console.log('setWheelFrictionSlip not available');
        }
        
        // Set suspension damping for more realistic behavior
        try {
            this.vehicleController.setWheelSuspensionDamping(index, PHYSICS_CONFIG.SUSPENSION_DAMPING);
        } catch (e) {
            console.log('setWheelSuspensionDamping not available');
        }
        
        // Set suspension compression damping
        try {
            this.vehicleController.setWheelSuspensionCompression(index, PHYSICS_CONFIG.SUSPENSION_COMPRESSION);
        } catch (e) {
            console.log('setWheelSuspensionCompression not available');
        }

        // Create wire mesh for the wheel that coincides with visual wheel
        const wireGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
        wireGeometry.rotateZ(Math.PI * 0.5);
        const wireMaterial = new THREE.MeshBasicMaterial({ 
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

        this.movement.brakeForce.value = brakeForce;

        const engineForce = accelerateForce;

        // Apply engine force to rear wheels only (more realistic)
        try {
            this.vehicleController.setWheelEngineForce(2, engineForce); // Rear Left
            this.vehicleController.setWheelEngineForce(3, engineForce); // Rear Right
        } catch (e) {
            console.log('setWheelEngineForce not available, using alternative approach');
            // Fallback: Apply force directly to chassis body
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
            console.log('wheelSteering not available');
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
            console.log('setWheelSteering not available');
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
            console.log('setWheelBrake not available');
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
     * Updates the visual car to match physics body
     */
    updateVisualCar() {
        if (!this.chassisBody) return;

        const carObject = this.visualCar.getObject();
        
        // Get physics body position and rotation
        const physicsPosition = this.chassisBody.translation();
        const physicsRotation = this.chassisBody.rotation();
        
        // Update visual car mesh to match physics body
        carObject.position.set(physicsPosition.x, physicsPosition.y, physicsPosition.z);
        carObject.quaternion.set(physicsRotation.x, physicsRotation.y, physicsRotation.z, physicsRotation.w);
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
                groundContact: false
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
            console.log('wheelSuspensionLength methods not available');
        }
        
        // Check ground contact
        const groundContact = wheelContacts.some(contact => contact === '✅');
        
        // Get vehicle state
        let vehicleState = 'Wheels: 4';
        try {
            vehicleState = `Wheels: ${this.vehicleController.numWheels()}`;
        } catch (e) {
            console.log('numWheels method not available');
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
            groundContact: groundContact
        };
    }
} 