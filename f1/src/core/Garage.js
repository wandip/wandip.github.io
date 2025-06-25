import * as THREE from 'three';
import { Car } from '../models/Car';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Garage viewer for inspecting the F1 car in 3D space
 */
export class Garage {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.car = new Car();
        this.isOpen = false;
        
        this.init();
    }

    /**
     * Initializes the garage scene
     */
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87ceeb); // Sky blue background for ceiling
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '999';

        // Setup camera
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 0, 0);

        // Setup orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Setup lighting
        this.setupLighting();

        // Add car to scene
        this.scene.add(this.car.getObject());

        // Create garage environment (floor, ceiling, walls)
        this.createGarageEnvironment();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    /**
     * Sets up lighting for the garage scene
     */
    setupLighting() {
        // Ambient light for overall garage illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        // Multiple overhead garage lights (fluorescent-style)
        const overheadLights = [
            { x: -4, z: -4, intensity: 0.8 },
            { x: 4, z: -4, intensity: 0.8 },
            { x: -4, z: 4, intensity: 0.8 },
            { x: 4, z: 4, intensity: 0.8 },
            { x: 0, z: 0, intensity: 1.0 }, // Center light
            { x: -2, z: 0, intensity: 0.7 },
            { x: 2, z: 0, intensity: 0.7 },
            { x: 0, z: -2, intensity: 0.7 },
            { x: 0, z: 2, intensity: 0.7 }
        ];

        overheadLights.forEach(light => {
            const overheadLight = new THREE.PointLight(0xffffff, light.intensity, 15);
            overheadLight.position.set(light.x, 8, light.z);
            overheadLight.castShadow = true;
            overheadLight.shadow.mapSize.width = 1024;
            overheadLight.shadow.mapSize.height = 1024;
            overheadLight.shadow.camera.near = 0.5;
            overheadLight.shadow.camera.far = 20;
            this.scene.add(overheadLight);
        });

        // Main key light for car details
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 50;
        keyLight.shadow.camera.left = -10;
        keyLight.shadow.camera.right = 10;
        keyLight.shadow.camera.top = 10;
        keyLight.shadow.camera.bottom = -10;
        this.scene.add(keyLight);

        // Fill lights from sides to reduce shadows
        const leftFillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        leftFillLight.position.set(-8, 6, 0);
        this.scene.add(leftFillLight);

        const rightFillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        rightFillLight.position.set(8, 6, 0);
        this.scene.add(rightFillLight);

        // Back lighting for depth
        const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
        backLight.position.set(0, 5, -8);
        this.scene.add(backLight);

        // Bottom fill light to reduce harsh shadows
        const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2);
        bottomLight.position.set(0, -3, 0);
        this.scene.add(bottomLight);
    }

    /**
     * Creates garage floor and ceiling
     */
    createGarageEnvironment() {
        // Floor - concrete texture
        const floorGeometry = new THREE.PlaneGeometry(30, 30);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b8b8b,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling - white panels
        const ceilingGeometry = new THREE.PlaneGeometry(30, 30);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            roughness: 0.3,
            metalness: 0.1
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);

        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(30, 20);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.5,
            metalness: 0.1
        });
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, 9.5, -15);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Side walls
        const leftWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-15, 9.5, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(15, 9.5, 0);
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    /**
     * Opens the garage viewer
     */
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Add close button
        this.addCloseButton();
        
        // Add instructions
        this.addInstructions();
        
        // Start animation loop
        this.animate();
    }

    /**
     * Closes the garage viewer
     */
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // Remove renderer from DOM
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        
        // Remove close button
        const closeBtn = document.getElementById('garage-close-btn');
        if (closeBtn) {
            closeBtn.remove();
        }
        
        // Remove instructions
        const instructions = document.getElementById('garage-instructions');
        if (instructions) {
            instructions.remove();
        }
    }

    /**
     * Adds a close button to the garage
     */
    addCloseButton() {
        const closeBtn = document.createElement('button');
        closeBtn.id = 'garage-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            transition: background 0.3s;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255, 0, 0, 0.8)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        
        closeBtn.addEventListener('click', () => {
            this.close();
        });
        
        document.body.appendChild(closeBtn);
    }

    /**
     * Adds instructions for the garage controls
     */
    addInstructions() {
        const instructions = document.createElement('div');
        instructions.id = 'garage-instructions';
        instructions.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 1000;
            ">
                <strong>Garage Controls:</strong><br>
                • Left click + drag: Rotate camera<br>
                • Right click + drag: Pan camera<br>
                • Scroll: Zoom in/out
            </div>
        `;
        
        document.body.appendChild(instructions);
    }

    /**
     * Handles window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Animation loop for the garage
     */
    animate() {
        if (!this.isOpen) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Gets the car object for external manipulation
     */
    getCar() {
        return this.car;
    }
} 