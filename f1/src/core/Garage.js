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
        this.renderer.setClearColor(0x1a1a1a); // Dark background
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

        // Add grid for reference
        this.addGrid();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    /**
     * Sets up lighting for the garage scene
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
        rimLight.position.set(0, 5, -10);
        this.scene.add(rimLight);
    }

    /**
     * Adds a grid to the scene for reference
     */
    addGrid() {
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        gridHelper.position.y = -0.5;
        this.scene.add(gridHelper);
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