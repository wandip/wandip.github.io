import * as THREE from 'three';

export class Trees {
    constructor(scene) {
        this.scene = scene;
        this.addTrees();
    }

    addTrees() {
        // Tree positions further from the track and outside the grid area
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

        const foliageLayers = 3;
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 6, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4d2926,
            roughness: 0.9,
            metalness: 0.1
        });

        const foliageGeometry = new THREE.ConeGeometry(3, 6, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.2
        });

        const trunkInstanced = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treePositions.length);
        const foliageInstanced = new THREE.InstancedMesh(foliageGeometry, foliageMaterial, treePositions.length * foliageLayers);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        let foliageIndex = 0;
        treePositions.forEach((pos, idx) => {
            const randomOffset = {
                x: (Math.random() - 0.5) * 4,
                z: (Math.random() - 0.5) * 4
            };
            const trunkScaleY = 0.85 + Math.random() * 0.3;

            dummy.position.set(
                pos.x + randomOffset.x,
                3 * trunkScaleY,
                pos.z + randomOffset.z
            );
            dummy.rotation.set(0, (idx * 1.1) % (Math.PI * 2), 0);
            dummy.scale.set(1, trunkScaleY, 1);
            dummy.updateMatrix();
            trunkInstanced.setMatrixAt(idx, dummy.matrix);

            for (let i = 0; i < foliageLayers; i++) {
                const scale = 1 - i * 0.2;
                const height = 7 + i * 2;
                dummy.position.set(
                    pos.x + randomOffset.x + (Math.random() - 0.5) * 0.5,
                    height,
                    pos.z + randomOffset.z + (Math.random() - 0.5) * 0.5
                );
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                foliageInstanced.setMatrixAt(foliageIndex, dummy.matrix);

                color.setHex(0x2d6a4f).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
                foliageInstanced.setColorAt(foliageIndex, color);
                foliageIndex++;
            }
        });

        trunkInstanced.instanceMatrix.needsUpdate = true;
        trunkInstanced.computeBoundingSphere();
        foliageInstanced.instanceMatrix.needsUpdate = true;
        if (foliageInstanced.instanceColor) foliageInstanced.instanceColor.needsUpdate = true;
        foliageInstanced.computeBoundingSphere();

        this.scene.add(trunkInstanced);
        this.scene.add(foliageInstanced);
    }
}
