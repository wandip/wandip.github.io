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
import { SteeringWheelJoystick } from '../ui/SteeringWheelJoystick';

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
        
        // Set device pixel ratio for high-DPI displays
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        this.steeringWheelJoystick = new SteeringWheelJoystick();

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

        // Set up joystick callbacks
        this.setupJoystickCallbacks();

        this.init();
        this.initPhysics();
        this.animate();

        // Set up input handling using the Controls class
        this.setupInputHandling();
        
        // Set up resize handler for responsive design
        this.setupResizeHandler();
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
        
        // Ensure canvas is properly sized for high-DPI displays
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        
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

        // Initialize UI positioning for current screen size
        setTimeout(() => {
            this.updateUIPositioning();
            // Force a resize to ensure proper canvas sizing on mobile
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                    this.camera.getCamera().aspect = window.innerWidth / window.innerHeight;
                    this.camera.getCamera().updateProjectionMatrix();
                }, 100);
            }
        }, 200);
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
     * Sets up the garage button event listener in the menu
     */
    setupGarageButton() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupGarageButton();
            });
            return;
        }

        let garageBtn = document.getElementById('garage-btn-menu');
        
        if (garageBtn) {
            // Add hover effects to the menu garage button
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
            
            garageBtn.addEventListener('click', () => {
                // Close the menu when garage is opened
                const hamburgerIcon = document.getElementById('hamburger-icon');
                const menuContent = document.getElementById('menu-content');
                if (hamburgerIcon) hamburgerIcon.classList.remove('active');
                if (menuContent) menuContent.classList.remove('show');
                
                this.hideMainUI();
                this.garage.open();
                // When garage closes, show main UI again but don't show controls if race has started
                const origClose = this.garage.close.bind(this.garage);
                this.garage.close = () => {
                    origClose();
                    // Show main UI elements but don't show controls UI if race has started
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
                    // Update UI positioning to ensure proper layout
                    this.updateUIPositioning();
                };
            });
        } else {
            console.error('Garage button in menu not found!');
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
        // Sync steering sensitivity from garage to physicsCar and joystick
        if (this.garage && typeof this.garage.getSteeringSensitivity === 'function') {
            const sensitivity = this.garage.getSteeringSensitivity();
            if (this.physicsCar) {
                this.physicsCar.setSteeringSensitivity(sensitivity);
            }
            if (this.steeringWheelJoystick) {
                this.steeringWheelJoystick.setSteeringSensitivity(sensitivity);
            }
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
     * Sets up joystick callbacks for mobile controls
     */
    setupJoystickCallbacks() {
        this.steeringWheelJoystick.setCallbacks(
            (steeringValue) => {
                // Allow steering input but only apply if race has started
                if (this.raceStarted) {
                    this.movement.right = -steeringValue; // Invert for correct direction
                }
                // Visual feedback is always provided by the joystick
            },
            (accelerateValue) => {
                // Allow acceleration input but only apply if race has started
                if (this.raceStarted) {
                    this.movement.forward = accelerateValue;
                }
                // Visual feedback is always provided by the joystick
            },
            (brakeValue) => {
                // Allow brake input but only apply if race has started
                if (this.raceStarted) {
                    this.movement.brake = brakeValue;
                }
                // Visual feedback is always provided by the joystick
            }
        );
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

            // Check if we're on mobile and should use joystick
            const isMobile = window.innerWidth <= 768 || 
                            (window.innerWidth <= 1024 && window.innerHeight <= 768) || // Landscape phones
                            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // On mobile, joystick handles movement, so only check for camera toggle and restart
            if (isMobile) {
                // Only handle camera toggle and restart on mobile
                return;
            }

            // Desktop controls
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
        
        // Show joystick on mobile (always visible, not just when race starts)
        const isMobile = window.innerWidth <= 768 || 
                        (window.innerWidth <= 1024 && window.innerHeight <= 768) || // Landscape phones
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            this.steeringWheelJoystick.show();
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
        // Hide joystick
        this.steeringWheelJoystick.hide();
    }

    /**
     * Cleanup method to remove event listeners
     */
    cleanup() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        if (this.steeringWheelJoystick) {
            this.steeringWheelJoystick.destroy();
        }
    }

    /**
     * Sets up window resize handler for responsive design
     */
    setupResizeHandler() {
        const handleResize = () => {
            // Get the actual viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Update device pixel ratio for high-DPI displays
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Update renderer size
            this.renderer.setSize(viewportWidth, viewportHeight);
            
            // Update camera aspect ratio and projection matrix
            this.camera.getCamera().aspect = viewportWidth / viewportHeight;
            this.camera.getCamera().updateProjectionMatrix();
            
            // Force canvas to fill the container
            if (this.renderer.domElement) {
                this.renderer.domElement.style.width = '100%';
                this.renderer.domElement.style.height = '100%';
            }
            
            // Update UI positioning for responsive design
            this.updateUIPositioning();
        };

        // Add resize event listener
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Add a small delay for orientation change
            setTimeout(handleResize, 100);
        });
        
        // Store the handler for potential cleanup
        this.resizeHandler = handleResize;
    }

    /**
     * Updates UI positioning for responsive design
     */
    updateUIPositioning() {
        // Detect mobile devices more comprehensively
        const isMobile = window.innerWidth <= 768 || 
                        (window.innerWidth <= 1024 && window.innerHeight <= 768) || // Landscape phones
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768 && !isMobile;
        
        // Update speed dashboard positioning
        if (this.speedDashboard && this.speedDashboard.container) {
            if (isMobile) {
                this.speedDashboard.container.style.bottom = '10px';
                this.speedDashboard.container.style.left = '50%';
                this.speedDashboard.container.style.transform = 'translateX(-50%)';
                this.speedDashboard.container.style.padding = '6px 15px';
                this.speedDashboard.container.style.fontSize = '12px';
                // Make speed value smaller on mobile
                this.speedDashboard.updateFontSizes('24px', '12px');
            } else if (isTablet) {
                this.speedDashboard.container.style.bottom = '15px';
                this.speedDashboard.container.style.left = '50%';
                this.speedDashboard.container.style.transform = 'translateX(-50%)';
                this.speedDashboard.container.style.padding = '8px 20px';
                this.speedDashboard.container.style.fontSize = '14px';
                // Make speed value smaller on tablet
                this.speedDashboard.updateFontSizes('32px', '16px');
            } else {
                this.speedDashboard.container.style.bottom = '20px';
                this.speedDashboard.container.style.left = '50%';
                this.speedDashboard.container.style.transform = 'translateX(-50%)';
                this.speedDashboard.container.style.padding = '10px 30px';
                this.speedDashboard.container.style.fontSize = '18px';
                // Original size for desktop
                this.speedDashboard.updateFontSizes('48px', '24px');
            }
        }

        // Update track dashboard positioning
        if (this.trackDashboard && this.trackDashboard.container) {
            if (isMobile) {
                this.trackDashboard.container.style.top = '10px';
                this.trackDashboard.container.style.left = '10px';
                this.trackDashboard.container.style.bottom = 'auto';
                this.trackDashboard.container.style.right = 'auto';
                this.trackDashboard.resizeCanvas(120, 120);
            } else if (isTablet) {
                this.trackDashboard.container.style.bottom = '15px';
                this.trackDashboard.container.style.right = '15px';
                this.trackDashboard.resizeCanvas(150, 150);
            } else {
                this.trackDashboard.container.style.bottom = '20px';
                this.trackDashboard.container.style.right = '20px';
                this.trackDashboard.resizeCanvas(200, 200);
            }
        }

        // Update controls UI positioning - hide on mobile (portrait and landscape)
        if (this.controlsUI && this.controlsUI.controlsUI) {
            if (isMobile) {
                // Hide controls UI on all mobile screens (portrait and landscape)
                this.controlsUI.controlsUI.style.display = 'none';
                this.controlsUI.controlsUI.style.visibility = 'hidden';
                this.controlsUI.controlsUI.style.opacity = '0';
            } else if (isTablet) {
                this.controlsUI.controlsUI.style.display = 'block';
                this.controlsUI.controlsUI.style.visibility = 'visible';
                this.controlsUI.controlsUI.style.opacity = '1';
                this.controlsUI.controlsUI.style.top = '40%';
                this.controlsUI.controlsUI.style.left = '15px';
                this.controlsUI.controlsUI.style.right = 'auto';
                this.controlsUI.controlsUI.style.transform = 'translateY(-50%)';
                this.controlsUI.controlsUI.style.width = '250px';
                this.controlsUI.controlsUI.style.minWidth = '250px';
                this.controlsUI.controlsUI.style.maxWidth = '300px';
                this.controlsUI.controlsUI.style.fontSize = '14px';
            } else {
                this.controlsUI.controlsUI.style.display = 'block';
                this.controlsUI.controlsUI.style.visibility = 'visible';
                this.controlsUI.controlsUI.style.opacity = '1';
                this.controlsUI.controlsUI.style.top = '40%';
                this.controlsUI.controlsUI.style.left = '20px';
                this.controlsUI.controlsUI.style.right = 'auto';
                this.controlsUI.controlsUI.style.transform = 'translateY(-50%)';
                this.controlsUI.controlsUI.style.width = '270px';
                this.controlsUI.controlsUI.style.minWidth = '250px';
                this.controlsUI.controlsUI.style.maxWidth = '400px';
                this.controlsUI.controlsUI.style.fontSize = '14px';
            }
        }

        // Update joystick positioning for mobile
        if (this.steeringWheelJoystick && this.steeringWheelJoystick.container) {
            if (isMobile) {
                // Show joystick on mobile (always visible)
                this.steeringWheelJoystick.show();
            } else {
                // Hide joystick on desktop/tablet
                this.steeringWheelJoystick.hide();
            }
        }

        // Garage button is now in the menu, no need for responsive positioning

        // Update lap timer positioning and sizing
        if (this.lapTimer && this.lapTimer.container) {
            if (isMobile) {
                this.lapTimer.container.style.top = '10px';
                this.lapTimer.container.style.left = '50%';
                this.lapTimer.container.style.transform = 'translateX(-50%)';
                this.lapTimer.container.style.padding = '6px 15px';
                this.lapTimer.container.style.fontSize = '20px';
                this.lapTimer.container.style.letterSpacing = '1px';
            } else if (isTablet) {
                this.lapTimer.container.style.top = '15px';
                this.lapTimer.container.style.left = '50%';
                this.lapTimer.container.style.transform = 'translateX(-50%)';
                this.lapTimer.container.style.padding = '8px 20px';
                this.lapTimer.container.style.fontSize = '28px';
                this.lapTimer.container.style.letterSpacing = '1.5px';
            } else {
                this.lapTimer.container.style.top = '20px';
                this.lapTimer.container.style.left = '10%';
                this.lapTimer.container.style.transform = 'translateX(-50%)';
                this.lapTimer.container.style.padding = '10px 30px';
                this.lapTimer.container.style.fontSize = '40px';
                this.lapTimer.container.style.letterSpacing = '2px';
            }
        }

        // Update debug panel positioning (if exists)
        if (this.speedDashboard && this.speedDashboard.debugContainer) {
            if (isMobile) {
                this.speedDashboard.debugContainer.style.top = '10px';
                this.speedDashboard.debugContainer.style.right = '10px';
                this.speedDashboard.debugContainer.style.minWidth = '250px';
                this.speedDashboard.debugContainer.style.maxWidth = '300px';
                this.speedDashboard.debugContainer.style.fontSize = '10px';
            } else if (isTablet) {
                this.speedDashboard.debugContainer.style.top = '15px';
                this.speedDashboard.debugContainer.style.right = '15px';
                this.speedDashboard.debugContainer.style.minWidth = '300px';
                this.speedDashboard.debugContainer.style.maxWidth = '400px';
                this.speedDashboard.debugContainer.style.fontSize = '11px';
            } else {
                this.speedDashboard.debugContainer.style.top = '20px';
                this.speedDashboard.debugContainer.style.right = '20px';
                this.speedDashboard.debugContainer.style.minWidth = '350px';
                this.speedDashboard.debugContainer.style.maxWidth = '450px';
                this.speedDashboard.debugContainer.style.fontSize = '12px';
            }
        }
    }
} 