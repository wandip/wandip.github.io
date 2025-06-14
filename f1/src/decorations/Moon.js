import * as THREE from 'three';

const textureURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg";
const displacementURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg";

export class Moon {
    constructor() {
        this.mesh = new THREE.Group();
        this.createRealisticCrescentMoon();
    }

    createRealisticCrescentMoon() {
        const geometry = new THREE.SphereGeometry(15, 60, 60);
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(textureURL);
        const displacementMap = textureLoader.load(displacementURL);

        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: texture,
            displacementMap: displacementMap,
            displacementScale: 0.8,
            bumpMap: displacementMap,
            bumpScale: 0.5,
            reflectivity: 0,
            shininess: 0
        });

        const moon = new THREE.Mesh(geometry, material);

        // Crescent shadow (subtracting sphere)
        const crescentGeometry = new THREE.SphereGeometry(15, 60, 60);
        const crescentMaterial = new THREE.MeshPhongMaterial({
            color: 0x143c73, // Match sky top color
            side: THREE.BackSide,
            transparent: true,
            opacity: 1.0
        });
        const crescent = new THREE.Mesh(crescentGeometry, crescentMaterial);
        crescent.position.x = 6; // Offset to create crescent

        this.mesh.add(moon);
        this.mesh.add(crescent);

        // Optional: subtle moon glow
        const glowGeometry = new THREE.SphereGeometry(18, 60, 60);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xf5f3ce,
            transparent: true,
            opacity: 0.08
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);

        // Rotate to show crescent
        this.mesh.rotation.y = Math.PI / 4;
        this.mesh.rotation.x = Math.PI * 0.02;
    }
} 