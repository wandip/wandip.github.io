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
import { GAME_CONFIG } from '../utils/Constants';
import { RapierPhysics } from './RapierPhysics.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { PhysicsCar } from '../physics/PhysicsCar';
import { PHYSICS_CONFIG } from '../physics/PhysicsConstants';
import { ControlsUI } from '../ui/ControlsUI';

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
        this.garage = new Garage();
        this.stats = GAME_CONFIG.DEBUG_MODE ? new Stats() : null;
        this.rapierPhysics = null;
        this.clock = new THREE.Clock(); // Add clock for proper timing
        this.physicsCar = null; // Add this property

        // Race state management
        this.raceStarted = false;
        this.controlsUI = new ControlsUI();

        // Movement input - Initialize before animate() to avoid undefined error
        this.movement = {
            forward: 0,
            right: 0,
            brake: 0,
            accelerateForce: { 
                value: 0, 
                min: PHYSICS_CONFIG.ENGINE_FORCE_MIN, 
                max: PHYSICS_CONFIG.ENGINE_FORCE_MAX, 
                step: PHYSICS_CONFIG.ENGINE_FORCE_STEP 
            },
            brakeForce: { 
                value: 0, 
                min: 0, 
                max: PHYSICS_CONFIG.BRAKE_FORCE_MAX, 
                step: PHYSICS_CONFIG.BRAKE_FORCE_STEP 
            }
        };

        this.mainUIElements = [
            this.speedDashboard.getObject(),
            this.trackDashboard.getObject(),
            this.lapTimer.getObject(),
            this.controlsUI.controlsUI
        ].filter(Boolean);

        this.init();
        this.initPhysics();
        this.animate();

        // Set up input handling using the Controls class
        this.setupInputHandling();
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
                mass: 500, // Increased car mass for more realistic physics
                restitution: 0.1 // Bounce factor
            };
        } else {
            console.error('Car object is null!');
        }
        
        // Add UI elements to document (not to scene)
        if (this.stats) {
            document.body.appendChild(this.stats.dom);
        }
        this.showMainUI();

        // Setup garage button with a small delay to ensure renderer is ready
        setTimeout(() => {
            this.setupGarageButton();
        }, 100);

        // Check if we should skip start lights (dev mode)
        if (GAME_CONFIG.SKIP_START_LIGHTS) {
            // Skip traffic lights and start race immediately
            this.raceStarted = true;
            this.onRaceStart();
        } else {
            // Add StartLights to the scene
            this.startLights = new StartLights(this.scene.getScene(), this.camera.getCamera(), this.onRaceStart.bind(this));
            // Animate the start lights at game start
            this.startLights.animate();
            // Show controls UI until race starts
            this.controlsUI.show();
        }
    }

    async initPhysics() {
        // Initialize physics engine
        this.rapierPhysics = await RapierPhysics();
        this.rapierPhysics.world.gravity = new this.rapierPhysics.rapier.Vector3(0, -9.81, 0);

        // Add scene objects to physics, but exclude the plane geometry ground
        this.scene.getScene().traverse((child) => {
            if (child.isMesh && child.userData.physics && child.userData.physics.mass === 0) {
                // Skip plane geometry ground to avoid conflicts
                if (child.geometry && child.geometry.type === 'PlaneGeometry') {
                    return;
                }
                this.rapierPhysics.addMesh(child, 0, child.userData.physics.restitution || 0.1);
            }
        });

        // Create a proper ground collider at Y=0 (ground level)
        // Use a larger, thinner ground collider to avoid conflicts
        const groundBody = this.rapierPhysics.world.createRigidBody(
            this.rapierPhysics.rapier.RigidBodyDesc.fixed()
                .setTranslation(0, -0.05, 0) // Position slightly below Y=0 to avoid conflicts
        );
        this.rapierPhysics.world.createCollider(
            this.rapierPhysics.rapier.ColliderDesc.cuboid(1000, 0.05, 1000), // Much larger and thinner
            groundBody
        );

        // Now that physics is initialized, set up the car physics using the new PhysicsCar class
        this.physicsCar = new PhysicsCar(this.rapierPhysics, this.car, this.movement, this.scene.getScene());
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
                background: #181c20;
                color: #b2eaff;
                border: 2px solid #5fa8d3;
                border-radius: 8px;
                padding: 14px 28px;
                font-size: 18px;
                font-family: 'Orbitron', Arial, sans-serif;
                font-style: italic;
                font-weight: 900;
                letter-spacing: 2px;
                cursor: pointer;
                z-index: 9999;
                transition: box-shadow 0.2s, border-color 0.2s, background 0.2s;
                box-shadow: 0 2px 8px 0 #5fa8d3;
                text-transform: uppercase;
                pointer-events: auto;
                outline: none;
            `;
            garageBtn.onmouseenter = () => {
                garageBtn.style.boxShadow = '0 4px 16px 0 #5fa8d3';
                garageBtn.style.borderColor = '#b2eaff';
                garageBtn.style.background = '#23272e';
                garageBtn.style.color = '#b2eaff';
            };
            garageBtn.onmouseleave = () => {
                garageBtn.style.boxShadow = '0 2px 8px 0 #5fa8d3';
                garageBtn.style.borderColor = '#5fa8d3';
                garageBtn.style.background = '#181c20';
                garageBtn.style.color = '#b2eaff';
            };
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
                this.hideMainUI();
                this.garage.open();
                // When garage closes, show main UI again
                const origClose = this.garage.close.bind(this.garage);
                this.garage.close = () => {
                    origClose();
                    this.showMainUI();
                };
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
        if (this.stats) this.stats.begin();
        const deltaTime = this.clock.getDelta();
        if (this.rapierPhysics) {
            this.rapierPhysics.world.timestep = deltaTime;
            this.rapierPhysics.step();
        }
        // Sync steering sensitivity from garage to physicsCar
        if (this.physicsCar && this.garage && typeof this.garage.getSteeringSensitivity === 'function') {
            this.physicsCar.setSteeringSensitivity(this.garage.getSteeringSensitivity());
        }
        if (this.physicsCar && this.physicsCar.isPhysicsReady()) {
            this.physicsCar.updateCarControls();
            try {
                this.physicsCar.getVehicleController().updateVehicle(deltaTime);
            } catch (e) {
                // updateVehicle method not available
            }
            this.physicsCar.updatePhysicsWheels();
            // Update visual car to match physics wireframe position
            this.physicsCar.updateVisualCar();
        }
        this.update();
        this.render();
        if (this.stats) this.stats.end();
    }

    update() {
        // Use physicsCar for all physics-related state
        if (!this.physicsCar || !this.physicsCar.isPhysicsReady()) {
            const carObject = this.car.getObject();
            // this.camera.update(carObject.position, carObject.rotation.y);
            this.trackDashboard.update(carObject.position, this.road.getSegments(), carObject.rotation.y);
            this.speedDashboard.updateDebug({
                physicsReady: false,
                position: { x: carObject.position.x.toFixed(2), y: carObject.position.y.toFixed(2), z: carObject.position.z.toFixed(2) },
                velocity: { x: 'N/A', y: 'N/A', z: 'N/A' },
                speed: 'N/A',
                engineForce: 'N/A',
                brakeForce: 'N/A',
                input: { forward: 0, right: 0, brake: 0 },
                wheelForces: ['N/A', 'N/A', 'N/A', 'N/A'],
                suspension: ['N/A', 'N/A', 'N/A', 'N/A'],
                deltaTime: this.clock.getDelta().toFixed(4),
                vehicleState: 'Physics Not Ready',
                groundContact: false
            });
            return;
        }
        // Allow camera toggle at any time (not just after race start)
        if (this.controls.isCameraTogglePressed()) {
            this.camera.toggleView();
        }
        // Sync visual car mesh with physics wireframe position
        const carObject = this.car.getObject();
        const debugInfo = this.physicsCar.getPhysicsDebugInfo();
        this.speedDashboard.updateDebug(debugInfo);
        // Update speed dashboard with current car speed
        if (this.physicsCar.getChassisBody()) {
            const velocity = this.physicsCar.getChassisBody().linvel();
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            this.speedDashboard.update(speed);
        }
        // Use physics car's rotation for camera to ensure proper following
        const carRotation = this.physicsCar.getCarRotation();
        this.camera.update(carObject.position, carRotation);
        this.trackDashboard.update(carObject.position, this.road.getSegments(), carRotation);
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
        // Hide controls UI when race starts
        this.controlsUI.hide();
        // Optionally, remove the lights after start
        setTimeout(() => {
            if (this.startLights) this.startLights.remove();
        }, 1000);
    }

    /**
     * Restarts the game by refreshing the page
     */
    restart() {
        window.location.reload();
    }

    /**
     * Sets up input handling using the Controls class
     */
    setupInputHandling() {
        // Update movement based on Controls class input
        const updateMovement = () => {
            // Only allow movement if race has started
            if (!this.raceStarted) {
                this.movement.forward = 0;
                this.movement.right = 0;
                this.movement.brake = 0;
                return;
            }

            // Forward/backward
            if (this.controls.isKeyPressed('ArrowUp') || this.controls.isKeyPressed('w')) {
                this.movement.forward = 1;
            } else if (this.controls.isKeyPressed('ArrowDown') || this.controls.isKeyPressed('s')) {
                this.movement.forward = -1;
            } else {
                this.movement.forward = 0;
            }

            // Left/right steering
            if (this.controls.isKeyPressed('ArrowLeft') || this.controls.isKeyPressed('a')) {
                this.movement.right = 1;
            } else if (this.controls.isKeyPressed('ArrowRight') || this.controls.isKeyPressed('d')) {
                this.movement.right = -1;
            } else {
                this.movement.right = 0;
            }

            // Brake
            if (this.controls.isKeyPressed(' ')) {
                this.movement.brake = 1;
            } else {
                this.movement.brake = 0;
            }
        };

        // Update movement every frame
        const originalUpdate = this.update.bind(this);
        this.update = () => {
            updateMovement();
            
            // Check for restart key press
            if (this.controls.isRestartPressed()) {
                this.restart();
            }
            
            originalUpdate();
        };
    }

    showMainUI() {
        this.mainUIElements.forEach(el => {
            if (el && !document.body.contains(el)) {
                document.body.appendChild(el);
            }
        });
        // Only show controls UI if race hasn't started yet
        if (!this.raceStarted) {
            this.controlsUI.show();
        }
        // Show StartLights start message if race hasn't started and startLights exists
        if (!this.raceStarted && this.startLights && this.startLights.startMessage && !document.body.contains(this.startLights.startMessage)) {
            document.body.appendChild(this.startLights.startMessage);
        }
    }

    hideMainUI() {
        this.mainUIElements.forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        this.controlsUI.hide();
        // Hide StartLights start message if present
        if (this.startLights && this.startLights.startMessage && document.body.contains(this.startLights.startMessage)) {
            document.body.removeChild(this.startLights.startMessage);
        }
    }
} 