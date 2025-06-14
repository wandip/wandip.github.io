import * as THREE from 'three';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { Car } from '../models/Car';
import { Road } from '../models/Road';
import { CarPhysics } from '../physics/CarPhysics';
import { Controls } from '../utils/Controls';
import { SpeedDashboard } from '../ui/SpeedDashboard';
import { TrackDashboard } from '../ui/TrackDashboard';
import { CoordinateSystem } from '../ui/CoordinateSystem';
import { StartLights } from '../ui/StartLights';
import { LapTimer } from '../ui/LapTimer';

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
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.speedDashboard = new SpeedDashboard();
        this.trackDashboard = new TrackDashboard();
        this.coordinateSystem = new CoordinateSystem();
        this.lapTimer = new LapTimer();
        this.startLights = null;
        this.raceStarted = false;

        this.init();
        this.animate();
    }

    /**
     * Initializes the game
     */
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Add road segments to scene
        this.road.getSegments().forEach(segment => {
            this.scene.add(segment);
        });

        // Add car to scene
        this.scene.add(this.car.getObject());
        
        // Add coordinate system grid to scene
        this.scene.add(this.coordinateSystem.getObject());
        
        // Add UI elements to document (not to scene)
        document.body.appendChild(this.speedDashboard.getObject());
        document.body.appendChild(this.trackDashboard.getObject());

        // Add StartLights to the scene
        this.startLights = new StartLights(this.scene.getScene(), this.camera.getCamera(), this.onRaceStart.bind(this));
        // Animate the start lights at game start
        this.startLights.animate();
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

        // Update car physics
        const physicsState = this.physics.update(this.controls);
        
        // Update speed dashboard
        this.speedDashboard.update(physicsState.speed);
        
        // Update car position and rotation
        const carObject = this.car.getObject();
        carObject.position.add(physicsState.carVelocity);
        carObject.rotation.y = physicsState.carRotation;

        // Update car tilt based on turning
        const tiltFactor = 0.2;
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