import * as THREE from 'three';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { Car } from '../models/Car';
import { Road } from '../models/Road';
import { Controls } from '../utils/Controls';
import { SpeedDashboard } from '../ui/SpeedDashboard';
import { TrackDashboard } from '../ui/TrackDashboard';
import { StartLights } from '../ui/StartLights';
import { LapTimer } from '../ui/LapTimer';
import { Garage } from './Garage';
import { GAME_CONFIG, CAR_DIMENSIONS } from '../utils/Constants';
import { RapierPhysics } from './RapierPhysics.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

/**
 * Main game class that orchestrates all components
 */
export class Game {
    constructor() {
        // Initialize components
        this.scene = new Scene();
        this.camera = new Camera(this.scene.getScene());
        this.car = new Car();
        this.road = new Road();
        this.controls = new Controls();
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false,
            depth: true,
            stencil: false
        });
        this.speedDashboard = new SpeedDashboard();
        this.trackDashboard = new TrackDashboard();
        this.lapTimer = new LapTimer();
        this.startLights = null;
        this.raceStarted = false;
        this.garage = new Garage();
        this.stats = new Stats();
        this.rapierPhysics = null;
        this.physicsWheels = []; // Array to store physics wheel references
        this.clock = new THREE.Clock(); // Add clock for proper timing

        // Movement input - Initialize before animate() to avoid undefined error
        this.movement = {
            forward: 0,
            right: 0,
            brake: 0,
            accelerateForce: { value: 0, min: -500, max: 1000, step: 30 }, // Increased forces
            brakeForce: { value: 0, min: 0, max: 50, step: 3 }
        };

        this.init();
        this.initPhysics();
        this.animate();

        window.addEventListener( 'keydown', ( event ) => {
            if ( event.key === 'w' || event.key === 'ArrowUp' ) this.movement.forward = 1;
            if ( event.key === 's' || event.key === 'ArrowDown' ) this.movement.forward = - 1;
            if ( event.key === 'a' || event.key === 'ArrowLeft' ) this.movement.right = 1;
            if ( event.key === 'd' || event.key === 'ArrowRight' ) this.movement.right = - 1;
            if ( event.key === ' ' ) this.movement.brake = 1;
        } );

        window.addEventListener( 'keyup', ( event ) => {
            if ( event.key === 'w' || event.key === 's' || event.key === 'ArrowUp' || event.key === 'ArrowDown' ) this.movement.forward = 0;
            if ( event.key === 'a' || event.key === 'd' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' ) this.movement.right = 0;
            if ( event.key === ' ' ) this.movement.brake = 0;
        } );
    }

    /**
     * Initializes the game
     */
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        
        // Ensure proper depth testing
        this.renderer.sortObjects = true;
        this.renderer.depthTest = true;
        
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Add road segments to scene
        const roadSegments = this.road.getSegments();
        roadSegments.forEach((segment, index) => {
            if (segment) {
                this.scene.add(segment);
            } else {
                console.error(`Road segment ${index} is null!`);
            }
        });

        // Add car to scene
        const carObject = this.car.getObject();
        if (carObject) {
            this.scene.add(carObject);
            // Set up physics data for the car mesh
            carObject.userData.physics = {
                mass: 800, // Increased car mass for more realistic physics
                restitution: 0.1 // Bounce factor
            };
        } else {
            console.error('Car object is null!');
        }
        
        // Add UI elements to document (not to scene)
        document.body.appendChild(this.stats.dom);
        document.body.appendChild(this.speedDashboard.getObject());
        document.body.appendChild(this.trackDashboard.getObject());

        // Setup garage button with a small delay to ensure renderer is ready
        setTimeout(() => {
            this.setupGarageButton();
        }, 100);

        // Check if we should skip start lights (dev mode)
        if (GAME_CONFIG.SKIP_START_LIGHTS) {
            // Skip traffic lights and start race immediately
            this.onRaceStart();
        } else {
            // Add StartLights to the scene
            this.startLights = new StartLights(this.scene.getScene(), this.camera.getCamera(), this.onRaceStart.bind(this));
            // Animate the start lights at game start
            this.startLights.animate();
        }
    }

    async initPhysics() {
        // Initialize physics engine
        this.rapierPhysics = await RapierPhysics();
        this.rapierPhysics.world.gravity = new this.rapierPhysics.rapier.Vector3(0, -9.81, 0);

        // Add scene objects to physics
        this.rapierPhysics.addScene(this.scene.getScene());
        
        // Manually ensure ground is added to physics
        this.scene.getScene().traverse((child) => {
            if (child.isMesh && child.userData.physics && child.userData.physics.mass === 0) {
                // This is a static object (like ground), ensure it's added to physics
                this.rapierPhysics.addMesh(child, 0, child.userData.physics.restitution || 0.1);
                if (child.userData.physics.body) {
                    // Ground added successfully
                } else {
                    // Failed to add ground to physics
                }
            }
        });

        // Create a proper ground collider at Y=0 (ground level)
        const groundBody = this.rapierPhysics.world.createRigidBody(
            this.rapierPhysics.rapier.RigidBodyDesc.fixed()
                .setTranslation(0, 0, 0) // Position at ground level (Y=0)
        );
        
        // Create a large ground collider
        const groundCollider = this.rapierPhysics.world.createCollider(
            this.rapierPhysics.rapier.ColliderDesc.cuboid(500, 0.1, 500), // Very large ground
            groundBody
        );
        
        // Now that physics is initialized, set up the car physics using the wireframe
        this.physicsWireframe = this.car.getPhysicsWireframe();
        if (this.physicsWireframe) {
            // Create physics body from the wireframe mesh
            const wireframeTransform = this.car.getPhysicsWireframeTransform();
            const carObject = this.car.getObject();
            
            // Position the car so wheels are just above ground level
            // Calculate optimal car position: wheel radius + small offset above ground
            const wheelRadius = CAR_DIMENSIONS.WHEEL.radius;
            const wheelYPosition = this.car.getWheelPositions()[0].y; // This is now -0.33
            const optimalCarY = 0 - wheelYPosition + wheelRadius + 0.05; // Same calculation as Car class
            
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
        } else {
            // Car physics wireframe not available yet
            console.error('Physics wireframe not available!');
        }
    }

    /**
     * Adds physics wheels that coincide with the visual wheels
     */
    addPhysicsWheels() {
        const carObject = this.car.getObject();
        const wheelPositions = this.car.getWheelPositions();
        
        wheelPositions.forEach((pos, index) => {
            this.addPhysicsWheel(index, pos, carObject);
        });
    }

    addPhysicsWheel(index, pos, carMesh) {
        // Use correct wheel dimensions from constants
        const wheelRadius = CAR_DIMENSIONS.WHEEL.radius;
        const wheelWidth = CAR_DIMENSIONS.WHEEL.width;
        const suspensionRestLength = 0.3;
        
        // Wheel positions are relative to car center, but we need to account for car's Y position
        // The car is positioned at wheelRadius + 0.05, so wheels should be at their relative Y positions
        const wheelPosition = {
            x: pos.x,
            y: pos.y, // This is relative to car center, which is now at wheelRadius + 0.05
            z: pos.z
        };
        const wheelDirection = { x: 0.0, y: -1.0, z: 0.0 };
        const wheelAxle = { x: -1.0, y: 0.0, z: 0.0 };

        console.log(`Adding wheel ${index}:`, {
            position: wheelPosition,
            radius: wheelRadius,
            suspensionLength: suspensionRestLength
        });

        // Add the wheel to the vehicle controller
        try {
            this.vehicleController.addWheel(
                wheelPosition,
                wheelDirection,
                wheelAxle,
                suspensionRestLength,
                wheelRadius
            );
        } catch (e) {
            console.log('addWheel method not available');
        }

        // Set suspension stiffness for wheel (reduced from 24.0 to more reasonable value)
        try {
            this.vehicleController.setWheelSuspensionStiffness(index, 25.0);
        } catch (e) {
            console.log('setWheelSuspensionStiffness not available');
        }

        // Set wheel friction (increased for better traction)
        try {
            this.vehicleController.setWheelFrictionSlip(index, 2.0);
        } catch (e) {
            console.log('setWheelFrictionSlip not available');
        }
        
        // Set suspension damping for more realistic behavior
        try {
            this.vehicleController.setWheelSuspensionDamping(index, 2.0);
        } catch (e) {
            console.log('setWheelSuspensionDamping not available');
        }
        
        // Set suspension compression damping
        try {
            this.vehicleController.setWheelSuspensionCompression(index, 2.0);
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
     * Sets up the garage button event listener
     */
    setupGarageButton() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupGarageButton();
            });
            return;
        }

        let garageBtn = document.getElementById('garage-btn');
        
        if (!garageBtn) {
            garageBtn = document.createElement('button');
            garageBtn.id = 'garage-btn';
            garageBtn.innerHTML = '🏎️ Garage';
            garageBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 25px;
                padding: 12px 20px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                z-index: 9999;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                pointer-events: auto;
            `;
            document.body.appendChild(garageBtn);
        } else {
            // Ensure existing button has correct z-index and position
            garageBtn.style.zIndex = '9999';
            garageBtn.style.pointerEvents = 'auto';
            garageBtn.style.bottom = '20px';
            garageBtn.style.left = '20px';
            garageBtn.style.top = 'auto';
        }
        
        if (garageBtn) {
            garageBtn.addEventListener('click', () => {
                this.garage.open();
            });
        } else {
            console.error('Failed to create garage button!');
        }
    }

    /**
     * Main game loop
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.stats.begin(); // Start measuring frame time

        const deltaTime = this.clock.getDelta();

        // Step the physics simulation with the same delta time
        if (this.rapierPhysics) {
            // Use the same delta time for physics step
            this.rapierPhysics.world.timestep = deltaTime;
            this.rapierPhysics.step();
        }

        if (this.vehicleController) {
            this.updateCarControls();
            try {
                this.vehicleController.updateVehicle(deltaTime);
            } catch (e) {
                console.log('updateVehicle method not available');
            }
            this.updatePhysicsWheels();
        }
        
        this.update();
        this.render();
        this.stats.end(); // End measuring frame time
    }

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
            accelerateForce = this.movement.accelerateForce.value * 0.9;
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
        // Note: These methods might not exist in Rapier vehicle controller
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
        const maxSteerAngle = Math.PI / 6; // Reduced from PI/4 to PI/6 for more realistic steering

        const targetSteering = maxSteerAngle * steerDirection;
        const steering = THREE.MathUtils.lerp(currentSteering, targetSteering, 0.1); // Slower steering response

        // Apply steering to front wheels only (wheels 0 and 1)
        try {
            this.vehicleController.setWheelSteering(0, steering); // Front Left
            this.vehicleController.setWheelSteering(1, steering); // Front Right
        } catch (e) {
            console.log('setWheelSteering not available');
        }

        // Update visual wheel steering to match physics
        this.car.updateWheelSteering(steering);

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
     * Updates game state
     */
    update() {
        // Check if physics is initialized before proceeding with car controls
        if (!this.chassisBody || !this.vehicleController) {
            // Physics not ready yet, just update camera and dashboards
            const carObject = this.car.getObject();
            this.camera.update(carObject.position, carObject.rotation.y);
            this.trackDashboard.update(carObject.position, this.road.getSegments(), carObject.rotation.y);
            
            // Update debug panel with not ready status
            this.speedDashboard.updateDebug({
                physicsReady: false,
                position: { x: carObject.position.x.toFixed(2), y: carObject.position.y.toFixed(2), z: carObject.position.z.toFixed(2) },
                velocity: { x: 'N/A', y: 'N/A', z: 'N/A' },
                speed: 'N/A',
                engineForce: 'N/A',
                brakeForce: 'N/A',
                input: { forward: this.movement.forward, right: this.movement.right, brake: this.movement.brake },
                wheelForces: ['N/A', 'N/A', 'N/A', 'N/A'],
                suspension: ['N/A', 'N/A', 'N/A', 'N/A'],
                deltaTime: this.clock.getDelta().toFixed(4),
                vehicleState: 'Physics Not Ready',
                groundContact: false
            });
            return;
        }

        // Handle camera toggle
        if (this.controls.isCameraTogglePressed()) {
            this.camera.toggleView();
        }

        // Sync visual car mesh with physics body
        const carObject = this.car.getObject();
        if (this.chassisBody) {
            // Get physics body position and rotation
            const physicsPosition = this.chassisBody.translation();
            const physicsRotation = this.chassisBody.rotation();
            const velocity = this.chassisBody.linvel();
            
            // Debug logging for physics state
            if (this.movement.forward !== 0 || this.movement.right !== 0) {
                let wheelContacts = [false, false, false, false];
                try {
                    wheelContacts = [
                        this.vehicleController.wheelSuspensionLength(0) < 0.3,
                        this.vehicleController.wheelSuspensionLength(1) < 0.3,
                        this.vehicleController.wheelSuspensionLength(2) < 0.3,
                        this.vehicleController.wheelSuspensionLength(3) < 0.3
                    ];
                } catch (e) {
                    console.log('wheelSuspensionLength not available');
                }
                
                console.log('Physics state:', {
                    position: { x: physicsPosition.x.toFixed(2), y: physicsPosition.y.toFixed(2), z: physicsPosition.z.toFixed(2) },
                    velocity: { x: velocity.x.toFixed(2), y: velocity.y.toFixed(2), z: velocity.z.toFixed(2) },
                    input: { forward: this.movement.forward, right: this.movement.right },
                    engineForce: this.movement.accelerateForce.value.toFixed(1),
                    wheelContacts: wheelContacts
                });
            }
            
            // Update visual car mesh to match physics body
            carObject.position.set(physicsPosition.x, physicsPosition.y, physicsPosition.z);
            carObject.quaternion.set(physicsRotation.x, physicsRotation.y, physicsRotation.z, physicsRotation.w);
            
            // Calculate speed
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            
            // Collect wheel forces - Rapier doesn't have wheelEngineForce method, so we'll use our stored values
            const wheelForces = [
                this.movement.accelerateForce.value.toFixed(1),
                this.movement.accelerateForce.value.toFixed(1),
                this.movement.accelerateForce.value.toFixed(1),
                this.movement.accelerateForce.value.toFixed(1)
            ];
            
            // Collect wheel contact status - use wheel suspension state instead
            let wheelContacts = ['❌', '❌', '❌', '❌'];
            let suspensionLengths = ['0.300', '0.300', '0.300', '0.300'];
            
            try {
                wheelContacts = [
                    this.vehicleController.wheelSuspensionLength(0) < 0.3 ? '✅' : '❌',
                    this.vehicleController.wheelSuspensionLength(1) < 0.3 ? '✅' : '❌',
                    this.vehicleController.wheelSuspensionLength(2) < 0.3 ? '✅' : '❌',
                    this.vehicleController.wheelSuspensionLength(3) < 0.3 ? '✅' : '❌'
                ];
                
                // Collect suspension lengths for debugging
                suspensionLengths = [
                    this.vehicleController.wheelSuspensionLength(0).toFixed(3),
                    this.vehicleController.wheelSuspensionLength(1).toFixed(3),
                    this.vehicleController.wheelSuspensionLength(2).toFixed(3),
                    this.vehicleController.wheelSuspensionLength(3).toFixed(3)
                ];
            } catch (e) {
                console.log('wheelSuspensionLength methods not available');
            }
            
            // Check ground contact (if any wheel has compressed suspension)
            const groundContact = wheelContacts.some(contact => contact === '✅');
            
            // Get vehicle state
            let vehicleState = 'Wheels: 4';
            try {
                vehicleState = `Wheels: ${this.vehicleController.numWheels()}`;
            } catch (e) {
                console.log('numWheels method not available');
            }
            
            // Update debug panel with comprehensive information
            this.speedDashboard.updateDebug({
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
                deltaTime: this.clock.getDelta().toFixed(4),
                vehicleState: vehicleState,
                groundContact: groundContact
            });
        }
        
        // Update speed dashboard with current car speed
        const velocity = this.chassisBody.linvel();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        this.speedDashboard.update(speed);

        // Update camera
        this.camera.update(carObject.position, carObject.rotation.y);

        // Update track dashboard with car position, road segments, and rotation
        this.trackDashboard.update(carObject.position, this.road.getSegments(), carObject.rotation.y);
    }

    /**
     * Updates physics wheel positions to match visual wheels
     */
    updatePhysicsWheels() {
        if (!this.physicsWheels || this.physicsWheels.length === 0) return;

        const carObject = this.car.getObject();
        const visualWheels = this.car.getWheels();

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
     * Renders the scene
     */
    render() {
        this.renderer.render(this.scene.getScene(), this.camera.getCamera());
    }

    onRaceStart() {
        this.raceStarted = true;
        this.lapTimer.start();
        // Optionally, remove the lights after start
        setTimeout(() => {
            if (this.startLights) this.startLights.remove();
        }, 1000);
    }
} 