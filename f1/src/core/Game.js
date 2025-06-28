import * as THREE from 'three';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { Car } from '../models/Car';
import { Road } from '../models/Road';
import { CarPhysics } from '../physics/CarPhysics';
import { Controls } from '../utils/Controls';
import { SpeedDashboard } from '../ui/SpeedDashboard';
import { TrackDashboard } from '../ui/TrackDashboard';
import { StartLights } from '../ui/StartLights';
import { LapTimer } from '../ui/LapTimer';
import { Garage } from './Garage';
import { GAME_CONFIG } from '../utils/Constants';
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
        this.physics = new CarPhysics();
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

        this.init();
        this.initPhysics();
        this.animate();
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
            // Remove the physics access here - it will be set up in initPhysics
            // chassis = carObject.userData.physics.body;
            // vehicleController = this.rapierPhysics.world.createVehicleController( chassis );
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
    
        this.rapierPhysics.addScene(this.scene.getScene());
        
        // Now that physics is initialized, set up the car physics using the wireframe
        const physicsWireframe = this.car.getPhysicsWireframe();
        if (physicsWireframe) {
            // Create physics body from the wireframe mesh
            const wireframeTransform = this.car.getPhysicsWireframeTransform();
            
            // Create a rigid body for the car chassis using wireframe dimensions
            const chassisBody = this.rapierPhysics.world.createRigidBody(
                this.rapierPhysics.rapier.RigidBodyDesc.kinematicPositionBased()
                    .setTranslation(wireframeTransform.position.x, wireframeTransform.position.y, wireframeTransform.position.z)
                    .setRotation(wireframeTransform.rotation)
            );

            // Create collision shape based on wireframe geometry
            const wireframeSize = wireframeTransform.size;
            const chassisCollider = this.rapierPhysics.world.createCollider(
                this.rapierPhysics.rapier.ColliderDesc.cuboid(
                    wireframeSize.width / 2,
                    wireframeSize.height / 2,
                    wireframeSize.depth / 2
                ),
                chassisBody
            );

            // Store physics data in the wireframe for future reference
            physicsWireframe.userData.physics = {
                body: chassisBody,
                collider: chassisCollider
            };

            // Create vehicle controller with the chassis body
            this.vehicleController = this.rapierPhysics.world.createVehicleController(chassisBody);
            
            console.log('Car physics initialized with wireframe-based collision');
        } else {
            console.warn('Car physics wireframe not available yet');
        }
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
        this.update();
        this.render();
        this.stats.end(); // End measuring frame time
    }

    /**
     * Updates game state
     */
    update() {
        // Only allow car controls after race has started
        if (!this.raceStarted) {
            // Optionally, you can still update camera, dashboards, etc.
            this.camera.update(this.car.getObject().position, this.car.getObject().rotation.y);
            this.trackDashboard.update(this.car.getObject().position, this.road.getSegments(), this.car.getObject().rotation.y);
            return;
        }

        // Handle camera toggle
        if (this.controls.isCameraTogglePressed()) {
            this.camera.toggleView();
        }

        // Update car physics
        const physicsState = this.physics.update(this.controls);
        
        // Update speed dashboard
        this.speedDashboard.update(physicsState.speed);
        
        // Update car position and rotation
        const carObject = this.car.getObject();
        carObject.position.add(physicsState.carVelocity);
        carObject.rotation.y = physicsState.carRotation;

        // Update car tilt based on turning
        const tiltFactor = 0.1;
        const speedFactor = Math.abs(physicsState.speed) / 0.8; // Using max speed from constants
        const targetTilt = -physicsState.turnSpeed * 3 * speedFactor;
        carObject.rotation.z += (targetTilt - carObject.rotation.z) * tiltFactor;

        // Update wheel steering
        const targetWheelRotation = this.physics.getTargetWheelRotation(this.controls);
        this.car.updateWheelSteering(targetWheelRotation);

        // Update camera
        this.camera.update(carObject.position, carObject.rotation.y);

        // Update track dashboard with car position, road segments, and rotation
        this.trackDashboard.update(carObject.position, this.road.getSegments(), carObject.rotation.y);
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