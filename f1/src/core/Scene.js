import * as THREE from 'three';
import { COLORS } from '../utils/Constants';
import { Trees } from '../decorations/Trees';
import { Mountains } from '../decorations/Mountains';
import { Clouds } from '../decorations/Clouds';
import { Moon } from '../decorations/Moon';

/**
 * Manages the Three.js scene, including lighting and environment setup
 */
export class Scene {
    constructor() {
        this.scene = new THREE.Scene();
        this.setupScene();
        this.createLights();
        this.addDecorativeElements();
    }

    /**
     * Initial scene setup including ground and sky
     */
    setupScene() {
        // Add ground with much larger dimensions
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: COLORS.GROUND,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.z = 0;  // Center the ground
        ground.position.x = 0;
        this.scene.add(ground);

        // Create sky gradient
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 midColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                vec3 color;
                if (h > 0.5) {
                    float t = (h - 0.5) * 2.0;
                    color = mix(midColor, topColor, t);
                } else {
                    float t = h * 2.0;
                    color = mix(bottomColor, midColor, t);
                }
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const uniforms = {
            topColor: { value: new THREE.Color(0x143c73) }, // Rich blue for top
            midColor: { value: new THREE.Color(0x4a77a8) }, // Nice blue for mid
            bottomColor: { value: new THREE.Color(0xffd97b) }, // Warm yellow for bottom
            offset: { value: 33 },
            exponent: { value: 0.7 }
        };

        const skyGeo = new THREE.SphereGeometry(400, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);

        // Add crescent moon
        const moon = new Moon();
        moon.mesh.position.set(100, 100, -100);
        this.scene.add(moon.mesh);

        // Add fog with a more realistic color
        const fogColor = new THREE.Color(0x87ceeb); // Light blue fog
        this.scene.fog = new THREE.FogExp2(fogColor, 0.002);
    }

    /**
     * Creates and adds lights to the scene
     */
    createLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // Directional light (sunlight)
        const sunlight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunlight.position.set(10, 20, 10);
        this.scene.add(sunlight);
    }

    /**
     * Adds all decorative elements to the scene
     */
    addDecorativeElements() {
        new Trees(this.scene);
        new Mountains(this.scene);
        new Clouds(this.scene);
    }

    /**
     * Returns the Three.js scene object
     */
    getScene() {
        return this.scene;
    }

    /**
     * Adds an object to the scene
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * Removes an object from the scene
     */
    remove(object) {
        this.scene.remove(object);
    }
} 