import * as THREE from 'three';

export class Clouds {
    constructor(scene) {
        this.scene = scene;
        this.addClouds();
    }

    addClouds() {
        const cloudPositions = [
            // Front clouds
            { x: -40, y: 60, z: 0 },
            { x: 50, y: 65, z: 40 },
            { x: -30, y: 70, z: 80 },
            { x: 60, y: 62, z: 120 },
            { x: -50, y: 68, z: 160 },
            // Back clouds
            { x: -60, y: 65, z: -40 },
            { x: 40, y: 70, z: -80 },
            { x: -45, y: 63, z: -120 },
            { x: 55, y: 67, z: -160 },
            // Left side clouds
            { x: -160, y: 64, z: -30 },
            { x: -140, y: 69, z: 40 },
            { x: -120, y: 62, z: -50 },
            { x: -100, y: 66, z: 30 },
            // Right side clouds
            { x: 160, y: 63, z: -40 },
            { x: 140, y: 68, z: 50 },
            { x: 120, y: 61, z: -30 },
            { x: 100, y: 65, z: 40 },
            // Additional scattered clouds
            { x: -80, y: 67, z: -100 },
            { x: 90, y: 64, z: -90 },
            { x: -70, y: 69, z: 100 },
            { x: 80, y: 63, z: 110 }
        ];

        cloudPositions.forEach(pos => {
            const cloudGroup = new THREE.Group();
            
            // Create more cloud parts for a fluffier look
            const numParts = 20 + Math.floor(Math.random() * 10); // 20-29 parts per cloud
            for (let i = 0; i < numParts; i++) {
                // Vary the cloud part shapes between spheres and ellipsoids
                const isEllipsoid = Math.random() > 0.5;
                let cloudGeometry;
                
                if (isEllipsoid) {
                    const radiusX = 4 + Math.random() * 4;
                    const radiusY = 3 + Math.random() * 3;
                    const radiusZ = 4 + Math.random() * 4;
                    cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
                    cloudGeometry.scale(radiusX, radiusY, radiusZ);
                } else {
                    const size = 4 + Math.random() * 4;
                    cloudGeometry = new THREE.SphereGeometry(size, 8, 8);
                }

                // Create a more atmospheric cloud material
                const cloudMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(0xffffff).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1), // Slight color variation
                    roughness: 0.95,
                    metalness: 0.0,
                    transparent: true,
                    opacity: 0.7 + Math.random() * 0.2, // Vary opacity between 0.7 and 0.9
                    fog: true,
                    depthWrite: false // Helps with transparency
                });
                
                const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
                
                // Position each part randomly within the cloud group with more spread
                cloudPart.position.set(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 20
                );
                
                // Add slight random rotation to each part
                cloudPart.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                cloudGroup.add(cloudPart);
            }
            
            // Position the entire cloud group
            cloudGroup.position.set(pos.x, pos.y, pos.z);
            
            // Add slight random rotation to the entire cloud group
            cloudGroup.rotation.y = Math.random() * Math.PI;
            
            this.scene.add(cloudGroup);
        });
    }
} 