import * as THREE from 'three';

export class Trees {
    constructor(scene) {
        this.scene = scene;
        this.addTrees();
    }

    addTrees() {
        // Create tree positions further from the track and outside the grid area
        const treePositions = [
            // Left side trees (near)
            { x: -70, z: 150 },
            { x: -75, z: 170 },
            { x: -68, z: 190 },
            { x: -72, z: 210 },
            { x: -67, z: 230 },
            { x: -71, z: 250 },
            { x: -66, z: 270 },
            { x: -69, z: 290 },
            { x: -73, z: 310 },
            { x: -68, z: 330 },
            // Right side trees (near)
            { x: 70, z: 150 },
            { x: 75, z: 170 },
            { x: 68, z: 190 },
            { x: 72, z: 210 },
            { x: 67, z: 230 },
            { x: 71, z: 250 },
            { x: 66, z: 270 },
            { x: 69, z: 290 },
            { x: 73, z: 310 },
            { x: 68, z: 330 },
            // Distant trees (left side)
            { x: -120, z: 200 },
            { x: -125, z: 250 },
            { x: -118, z: 300 },
            { x: -122, z: 350 },
            { x: -117, z: 400 },
            { x: -121, z: 450 },
            { x: -116, z: 500 },
            { x: -119, z: 550 },
            { x: -123, z: 600 },
            { x: -118, z: 650 },
            // Distant trees (right side)
            { x: 120, z: 200 },
            { x: 125, z: 250 },
            { x: 118, z: 300 },
            { x: 122, z: 350 },
            { x: 117, z: 400 },
            { x: 121, z: 450 },
            { x: 116, z: 500 },
            { x: 119, z: 550 },
            { x: 123, z: 600 },
            { x: 118, z: 650 }
        ];

        treePositions.forEach(pos => {
            // Add some randomness to tree positions while keeping them outside the grid
            const randomOffset = {
                x: (Math.random() - 0.5) * 4,
                z: (Math.random() - 0.5) * 4
            };

            // Tree trunk with more detail
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5 + Math.random() * 2, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x4d2926,
                roughness: 0.9,
                metalness: 0.1
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(
                pos.x + randomOffset.x,
                2.5 + Math.random(),
                pos.z + randomOffset.z
            );
            this.scene.add(trunk);

            // Create multiple layers of foliage for more realistic trees
            const foliageLayers = 3;
            for (let i = 0; i < foliageLayers; i++) {
                const scale = 1 - (i * 0.2); // Each layer gets slightly smaller
                const height = 7 + (i * 2); // Each layer gets higher
                const topGeometry = new THREE.ConeGeometry(3 * scale, 6 * scale, 8);
                const topMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(0x2d6a4f).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1), // Slight color variation
                    roughness: 0.8,
                    metalness: 0.2
                });
                const top = new THREE.Mesh(topGeometry, topMaterial);
                top.position.set(
                    pos.x + randomOffset.x + (Math.random() - 0.5) * 0.5,
                    height,
                    pos.z + randomOffset.z + (Math.random() - 0.5) * 0.5
                );
                this.scene.add(top);
            }
        });
    }
} 