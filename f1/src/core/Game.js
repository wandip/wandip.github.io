import * as THREE from 'three';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { Car } from '../models/Car';
import { Road } from '../models/Road';
import { CarPhysics } from '../physics/CarPhysics';
import { RapierPhysics } from '../physics/RapierPhysics';
import { RapierInputHandler } from '../physics/RapierInputHandler';
import { Controls } from '../utils/Controls';
import { SpeedDashboard } from '../ui/SpeedDashboard';
import { TrackDashboard } from '../ui/TrackDashboard';
import { CoordinateSystem } from '../ui/CoordinateSystem';
import { StartLights } from '../ui/StartLights';
import { LapTimer } from '../ui/LapTimer';
import { Garage } from './Garage';
import { GAME_CONFIG, CAR_DIMENSIONS } from '../utils/Constants';

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
        this.rapierPhysics = null; // Will be initialized after Rapier loads
        this.rapierInputHandler = new RapierInputHandler();
        this.controls = new Controls();
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false,
            depth: true,
            stencil: false
        });
        this.speedDashboard = new SpeedDashboard();
        this.trackDashboard = new TrackDashboard();
        this.coordinateSystem = new CoordinateSystem();
        this.lapTimer = new LapTimer();
        this.startLights = null;
        this.raceStarted = false;
        this.garage = new Garage();
        this.debugPanel = null;

        this.init();
        this.animate();
    }

    /**
     * Initializes the game
     */
    async init() {
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

        // Initialize Rapier physics
        await this.initRapierPhysics();

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
        } else {
            console.error('Car object is null!');
        }
        
        // Add coordinate system grid to scene
        const coordSystemObject = this.coordinateSystem.getObject();
        if (coordSystemObject) {
            this.scene.add(coordSystemObject);
        }
        
        // Add UI elements to document (not to scene)
        document.body.appendChild(this.speedDashboard.getObject());
        document.body.appendChild(this.trackDashboard.getObject());

        // Create debug panel if debug mode is enabled
        if (GAME_CONFIG.DEBUG_PHYSICS) {
            this.createDebugPanel();
        }

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

    /**
     * Initialize Rapier physics system
     */
    async initRapierPhysics() {
        try {
            this.rapierPhysics = new RapierPhysics();
            this.rapierPhysics.initialize(GAME_CONFIG.DEBUG_PHYSICS);
            
            // Create road physics (large flat surface)
            const roadConfig = { width: 2000, length: 2000, height: 1 };
            this.rapierPhysics.createRoad(roadConfig);
            
            // Create car physics body
            const initialPosition = { x: 0, y: 0.5, z: 0 };
            const initialRotation = { x: 0, y: 0, z: 0 };
            this.rapierPhysics.createCarBody(CAR_DIMENSIONS, initialPosition, initialRotation);
            
            // Add wireframes to scene if in debug mode
            if (GAME_CONFIG.DEBUG_PHYSICS) {
                const wireframeGroup = this.rapierPhysics.getWireframeGroup();
                if (wireframeGroup) {
                    this.scene.add(wireframeGroup);
                    console.log('Physics wireframes added to scene');
                }
            }
            
            console.log('Rapier physics initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Rapier physics:', error);
        }
    }

    /**
     * Create debug panel for physics information
     */
    createDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'physics-debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;
        
        this.debugPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #00ff00;">Physics Debug Info</h3>
            <div>Position: <span style="color: #00ff00;">x:</span><span id="pos-x">0.000</span> 
                 <span style="color: #00ff00;">y:</span><span id="pos-y">0.000</span> 
                 <span style="color: #00ff00;">z:</span><span id="pos-z">0.000</span></div>
            <div>Rotation: <span style="color: #00ff00;">x:</span><span id="rot-x">0.000</span> 
                 <span style="color: #00ff00;">y:</span><span id="rot-y">0.000</span> 
                 <span style="color: #00ff00;">z:</span><span id="rot-z">0.000</span> 
                 <span style="color: #00ff00;">w:</span><span id="rot-w">1.000</span></div>
            <div>Velocity: <span style="color: #00ff00;">x:</span><span id="vel-x">0.000</span> 
                 <span style="color: #00ff00;">y:</span><span id="vel-y">0.000</span> 
                 <span style="color: #00ff00;">z:</span><span id="vel-z">0.000</span></div>
            <div>Speed: <span id="speed">0.000</span> m/s</div>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #333;">
            <div><strong>Velocity Analysis:</strong></div>
            <div>Horizontal: <span id="h-speed">0.000</span> m/s</div>
            <div>Vertical: <span id="v-speed">0.000</span> m/s</div>
            <div>Total: <span id="t-speed">0.000</span> m/s</div>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #333;">
            <div><strong>Input State:</strong></div>
            <div>Forward Force: <span id="forward-force">0</span> N</div>
            <div>Turn Torque: <span id="turn-torque">0</span> Nm</div>
        `;
        
        document.body.appendChild(this.debugPanel);
    }

    /**
     * Update debug panel with physics information
     */
    updateDebugPanel() {
        if (!this.debugPanel || !this.rapierPhysics) return;

        const debugInfo = this.rapierPhysics.getDebugInfo();
        const detailedVelocity = this.rapierPhysics.getDetailedVelocityInfo();
        
        document.getElementById('pos-x').textContent = debugInfo.position.x.toFixed(3);
        document.getElementById('pos-y').textContent = debugInfo.position.y.toFixed(3);
        document.getElementById('pos-z').textContent = debugInfo.position.z.toFixed(3);
        
        document.getElementById('rot-x').textContent = debugInfo.rotation.x.toFixed(3);
        document.getElementById('rot-y').textContent = debugInfo.rotation.y.toFixed(3);
        document.getElementById('rot-z').textContent = debugInfo.rotation.z.toFixed(3);
        document.getElementById('rot-w').textContent = debugInfo.rotation.w.toFixed(3);
        
        document.getElementById('vel-x').textContent = debugInfo.velocity.x.toFixed(3);
        document.getElementById('vel-y').textContent = debugInfo.velocity.y.toFixed(3);
        document.getElementById('vel-z').textContent = debugInfo.velocity.z.toFixed(3);
        
        document.getElementById('speed').textContent = debugInfo.speed.toFixed(3);
        
        // Update detailed velocity analysis
        document.getElementById('h-speed').textContent = detailedVelocity.horizontalSpeed.toFixed(3);
        document.getElementById('v-speed').textContent = detailedVelocity.verticalSpeed.toFixed(3);
        document.getElementById('t-speed').textContent = detailedVelocity.totalSpeed.toFixed(3);
        
        // Update input state
        if (this.rapierInputHandler) {
            const inputState = this.rapierInputHandler.getInputState();
            document.getElementById('forward-force').textContent = Math.round(inputState.forwardForce);
            document.getElementById('turn-torque').textContent = Math.round(inputState.turnTorque);
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
        this.update();
        this.render();
    }

    /**
     * Updates game state
     */
    update() {
        // Update Rapier physics simulation
        if (this.rapierPhysics) {
            this.rapierPhysics.update(1/60); // 60 FPS physics stepping
            
            // Update debug panel
            if (GAME_CONFIG.DEBUG_PHYSICS) {
                this.updateDebugPanel();
            }
        }

        // Only allow car controls after race has started
        if (!this.raceStarted) {
            // Optionally, you can still update camera, dashboards, etc.
            this.camera.update(this.car.getObject().position, this.car.getObject().rotation.y);
            this.trackDashboard.update(this.car.getObject().position, this.road.getSegments(), this.car.getObject().rotation.y);
            this.coordinateSystem.update(this.car.getObject().position, this.car.getObject().rotation.y);
            return;
        }

        // Handle camera toggle
        if (this.controls.isCameraTogglePressed()) {
            this.camera.toggleView();
        }

        // Update Rapier input handling
        if (this.rapierPhysics && this.rapierInputHandler) {
            this.rapierInputHandler.update(this.controls, this.rapierPhysics);
        }

        // Update car physics (keeping both systems for now)
        const physicsState = this.physics.update(this.controls);
        
        // Update speed dashboard with Rapier physics data if available
        if (this.rapierPhysics) {
            const debugInfo = this.rapierPhysics.getDebugInfo();
            this.speedDashboard.update(debugInfo.speed);
        } else {
            this.speedDashboard.update(physicsState.speed);
        }
        
        // Sync visual car with Rapier physics body
        if (this.rapierPhysics) {
            const carObject = this.car.getObject();
            const physicsPosition = this.rapierPhysics.getCarPosition();
            const physicsRotation = this.rapierPhysics.getCarRotation();
            
            // Update car position
            carObject.position.set(physicsPosition.x, physicsPosition.y, physicsPosition.z);
            
            // Update car rotation (convert quaternion to euler)
            const quaternion = new THREE.Quaternion(
                physicsRotation.x, 
                physicsRotation.y, 
                physicsRotation.z, 
                physicsRotation.w
            );
            carObject.quaternion.copy(quaternion);
        } else {
            // Fallback to old physics system
            const carObject = this.car.getObject();
            carObject.position.add(physicsState.carVelocity);
            carObject.rotation.y = physicsState.carRotation;
        }

        // Update car tilt based on turning (only if using old physics)
        if (!this.rapierPhysics) {
            const carObject = this.car.getObject();
            const tiltFactor = 0.2;
            const speedFactor = Math.abs(physicsState.speed) / 0.8; // Using max speed from constants
            const targetTilt = -physicsState.turnSpeed * 3 * speedFactor;
            carObject.rotation.z += (targetTilt - carObject.rotation.z) * tiltFactor;
        }

        // Update wheel steering (use Rapier input handler data if available)
        let targetWheelRotation = 0;
        if (this.rapierInputHandler) {
            const inputState = this.rapierInputHandler.getInputState();
            // Convert torque to wheel rotation
            targetWheelRotation = (inputState.turnTorque / inputState.maxTurnTorque) * Math.PI / 4;
        } else {
            targetWheelRotation = this.physics.getTargetWheelRotation(this.controls);
        }
        this.car.updateWheelSteering(targetWheelRotation);

        // Update camera
        const carObject = this.car.getObject();
        this.camera.update(carObject.position, carObject.rotation.y);

        // Update track dashboard with car position, road segments, and rotation
        this.trackDashboard.update(carObject.position, this.road.getSegments(), carObject.rotation.y);

        // Update coordinate system
        this.coordinateSystem.update(carObject.position, carObject.rotation.y);
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