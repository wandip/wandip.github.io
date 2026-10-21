import * as THREE from 'three';
import { Car } from '../models/Car';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DEFAULT_STEERING_SENSITIVITY } from '../physics/PhysicsConstants';

/**
 * Garage viewer for inspecting the F1 car in 3D space
 */
export class Garage {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.car = null;
        this.isInitialized = false;
        this.isOpen = false;
        this.steeringSensitivity = undefined;
        this.onCloseCallback = null;
        this.boundOnWindowResize = this.onWindowResize.bind(this);
        this.boundAnimate = this.animate.bind(this);
    }

    /**
     * Lazily initializes the garage scene on first open to save GPU resources at startup
     */
    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.car = new Car();

        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x87ceeb);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '999';

        // Setup camera
        this.camera.position.set(5, 3, 4);
        this.camera.lookAt(0, 0, 0);

        // Setup orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 15;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Setup lighting
        this.setupLighting();

        // Add car to scene
        this.scene.add(this.car.getObject());

        // Create garage environment (floor, ceiling, walls)
        this.createGarageEnvironment();

        // Handle window resize
        window.addEventListener('resize', this.boundOnWindowResize);
    }

    /**
     * Sets up efficient studio lighting for the garage scene
     */
    setupLighting() {
        // Hemisphere light for smooth overhead-to-floor studio illumination
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8b8b8b, 1.1);
        hemiLight.position.set(0, 10, 0);
        this.scene.add(hemiLight);

        // Main key light with a single shadow map (replacing 9 shadow-casting point lights / 54 passes)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 35;
        keyLight.shadow.camera.left = -6;
        keyLight.shadow.camera.right = 6;
        keyLight.shadow.camera.top = 6;
        keyLight.shadow.camera.bottom = -6;
        this.scene.add(keyLight);

        // Fill lights from sides and back for metallic highlights (no shadow maps)
        const leftFillLight = new THREE.DirectionalLight(0xffffff, 0.45);
        leftFillLight.position.set(-8, 6, 0);
        this.scene.add(leftFillLight);

        const rightFillLight = new THREE.DirectionalLight(0xffffff, 0.45);
        rightFillLight.position.set(8, 6, 0);
        this.scene.add(rightFillLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.35);
        backLight.position.set(0, 5, -8);
        this.scene.add(backLight);
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
        floor.position.y = -0.02;
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
        this.scene.add(ceiling);

        // Walls
        const wallGeometry = new THREE.PlaneGeometry(30, 20);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.5,
            metalness: 0.1
        });
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 9.5, -15);
        this.scene.add(backWall);

        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-15, 9.5, 0);
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(15, 9.5, 0);
        this.scene.add(rightWall);
    }

    /**
     * Registers a callback invoked when the garage closes
     * @param {Function} callback
     */
    setOnClose(callback) {
        this.onCloseCallback = callback;
    }

    /**
     * Opens the garage viewer
     */
    open() {
        if (this.isOpen) return;

        this.init();
        this.isOpen = true;
        document.body.appendChild(this.renderer.domElement);

        this.addSteeringSensitivitySlider();

        const hamburgerMenu = document.getElementById('hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.style.display = 'none';
        }

        const garageBtn = document.getElementById('garage-btn');
        if (garageBtn) {
            garageBtn.style.display = 'none';
        }

        this.addCloseButton();
        this.addInstructions();
        this.animate();
    }

    /**
     * Closes the garage viewer
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;

        const hamburgerMenu = document.getElementById('hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.style.display = 'block';
        }

        const garageBtn = document.getElementById('garage-btn');
        if (garageBtn) {
            garageBtn.style.display = 'block';
        }

        if (this.renderer && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }

        const closeBtn = document.getElementById('garage-close-btn');
        if (closeBtn) closeBtn.remove();

        const instructions = document.getElementById('garage-instructions');
        if (instructions) instructions.remove();

        const slider = document.getElementById('steering-sensitivity-container');
        if (slider) slider.remove();

        if (typeof this.onCloseCallback === 'function') {
            this.onCloseCallback();
        }
    }

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

    addInstructions() {
        const isMobile = window.innerWidth <= 768 ||
            (window.innerWidth <= 1024 && window.innerHeight <= 768) ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) return;

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

    addSteeringSensitivitySlider() {
        const existing = document.getElementById('steering-sensitivity-container');
        if (existing) existing.remove();

        const isMobile = window.innerWidth <= 768 ||
            (window.innerWidth <= 1024 && window.innerHeight <= 768) ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768 && !isMobile;

        const container = document.createElement('div');
        container.id = 'steering-sensitivity-container';

        let containerStyles = '';
        if (isMobile) {
            containerStyles = `
                position: fixed;
                top: 70px;
                right: 15px;
                background: rgba(0,0,0,0.85);
                color: #fff;
                padding: 12px 16px;
                border-radius: 8px;
                z-index: 1001;
                font-family: 'Orbitron', Arial, sans-serif;
                font-size: 12px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.18);
                min-width: 200px;
                max-width: 250px;
            `;
        } else if (isTablet) {
            containerStyles = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(0,0,0,0.85);
                color: #fff;
                padding: 15px 20px;
                border-radius: 10px;
                z-index: 1001;
                font-family: 'Orbitron', Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.18);
                min-width: 240px;
                max-width: 280px;
            `;
        } else {
            containerStyles = `
                position: fixed;
                top: 90px;
                right: 30px;
                background: rgba(0,0,0,0.85);
                color: #fff;
                padding: 18px 22px;
                border-radius: 12px;
                z-index: 1001;
                font-family: 'Orbitron', Arial, sans-serif;
                font-size: 15px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.18);
                min-width: 260px;
            `;
        }

        container.style.cssText = containerStyles;

        const label = document.createElement('label');
        label.htmlFor = 'steering-sensitivity-slider';
        label.innerText = 'Steering Sensitivity:';
        label.style.display = 'block';
        label.style.marginBottom = isMobile ? '6px' : '8px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'steering-sensitivity-slider';
        slider.min = '0.1';
        slider.max = '2.0';
        slider.step = '0.01';
        slider.value = this.steeringSensitivity !== undefined ? this.steeringSensitivity : DEFAULT_STEERING_SENSITIVITY;
        slider.style.width = isMobile ? '140px' : isTablet ? '160px' : '180px';
        slider.style.marginRight = '10px';

        const valueDisplay = document.createElement('span');
        valueDisplay.id = 'steering-sensitivity-value';
        valueDisplay.innerText = slider.value;
        valueDisplay.style.marginLeft = '8px';
        valueDisplay.style.fontWeight = 'bold';

        const warning = document.createElement('div');
        warning.id = 'steering-sensitivity-warning';
        warning.style.color = '#ffb347';
        warning.style.fontSize = isMobile ? '11px' : isTablet ? '12px' : '13px';
        warning.style.marginTop = isMobile ? '6px' : '8px';
        warning.style.display = 'none';
        warning.style.minHeight = isMobile ? '16px' : '18px';
        warning.style.maxWidth = isMobile ? '180px' : isTablet ? '220px' : '230px';
        warning.innerText = '😏 That\'s a really low value! \nBeware: it will be hard to turn the car.';

        slider.addEventListener('input', () => {
            valueDisplay.innerText = slider.value;
            this.steeringSensitivity = parseFloat(slider.value);
            warning.style.display = this.steeringSensitivity < 0.25 ? 'block' : 'none';
        });

        if (parseFloat(slider.value) < 0.25) {
            warning.style.display = 'block';
        }

        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        container.appendChild(warning);
        document.body.appendChild(container);
    }

    getSteeringSensitivity() {
        return this.steeringSensitivity !== undefined ? this.steeringSensitivity : DEFAULT_STEERING_SENSITIVITY;
    }

    onWindowResize() {
        if (!this.isInitialized) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.updateSteeringSensitivitySliderPosition();
    }

    animate() {
        if (!this.isOpen) return;
        requestAnimationFrame(this.boundAnimate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateSteeringSensitivitySliderPosition() {
        const container = document.getElementById('steering-sensitivity-container');
        if (!container) return;

        const isMobile = window.innerWidth <= 768 ||
            (window.innerWidth <= 1024 && window.innerHeight <= 768) ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768 && !isMobile;

        if (isMobile) {
            container.style.top = '70px';
            container.style.right = '15px';
            container.style.padding = '12px 16px';
            container.style.borderRadius = '8px';
            container.style.fontSize = '12px';
            container.style.minWidth = '200px';
            container.style.maxWidth = '250px';
        } else if (isTablet) {
            container.style.top = '80px';
            container.style.right = '20px';
            container.style.padding = '15px 20px';
            container.style.borderRadius = '10px';
            container.style.fontSize = '14px';
            container.style.minWidth = '240px';
            container.style.maxWidth = '280px';
        } else {
            container.style.top = '90px';
            container.style.right = '30px';
            container.style.padding = '18px 22px';
            container.style.borderRadius = '12px';
            container.style.fontSize = '15px';
            container.style.minWidth = '260px';
            container.style.maxWidth = '';
        }

        const slider = document.getElementById('steering-sensitivity-slider');
        if (slider) {
            slider.style.width = isMobile ? '140px' : isTablet ? '160px' : '180px';
        }

        const warning = document.getElementById('steering-sensitivity-warning');
        if (warning) {
            warning.style.fontSize = isMobile ? '11px' : isTablet ? '12px' : '13px';
            warning.style.marginTop = isMobile ? '6px' : '8px';
            warning.style.minHeight = isMobile ? '16px' : '18px';
            warning.style.maxWidth = isMobile ? '180px' : isTablet ? '220px' : '230px';
        }

        const label = container.querySelector('label');
        if (label) {
            label.style.marginBottom = isMobile ? '6px' : '8px';
        }
    }

    getCar() {
        return this.car;
    }
}
