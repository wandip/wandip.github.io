import * as THREE from 'three';

/**
 * Lightweight, clean stylized clouds rendered in a single InstancedMesh draw call
 */
export class Clouds {
    constructor(scene) {
        this.scene = scene;
        this.addClouds();
    }

    addClouds() {
        const cloudPositions = [
            // Front clouds
            { x: -40, y: 62, z: 0 },
            { x: 50, y: 66, z: 40 },
            { x: -30, y: 70, z: 80 },
            { x: 60, y: 63, z: 120 },
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

        // Each cloud is built from 5 structured puffs (wide base + central dome + side puffs)
        const puffTemplate = [
            { ox: 0, oy: 0, oz: 0, sx: 10, sy: 3.5, sz: 7 },     // Flat wide base
            { ox: 0, oy: 2.2, oz: 0, sx: 6.5, sy: 4.8, sz: 5.5 }, // Main center dome
            { ox: -5.5, oy: 1.0, oz: 0.8, sx: 5.2, sy: 3.6, sz: 4.5 }, // Left puff
            { ox: 5.5, oy: 1.2, oz: -0.6, sx: 5.0, sy: 3.8, sz: 4.5 }, // Right puff
            { ox: 1.5, oy: 1.0, oz: 3.2, sx: 4.8, sy: 3.2, sz: 4.2 }   // Front puff
        ];

        const totalInstances = cloudPositions.length * puffTemplate.length;
        const geometry = new THREE.SphereGeometry(1, 10, 8);
        const material = new THREE.MeshLambertMaterial({
            color: 0xf8fbff,
            fog: true
        });

        const instancedClouds = new THREE.InstancedMesh(geometry, material, totalInstances);
        const dummy = new THREE.Object3D();
        const groupQuat = new THREE.Quaternion();
        const offsetVec = new THREE.Vector3();
        const upAxis = new THREE.Vector3(0, 1, 0);

        let instanceIndex = 0;
        cloudPositions.forEach((pos, idx) => {
            // Deterministic variation based on cloud index
            const yaw = (idx * 1.7) % (Math.PI * 2);
            const cloudScale = 0.85 + ((idx * 7) % 5) * 0.08;
            groupQuat.setFromAxisAngle(upAxis, yaw);

            puffTemplate.forEach((puff) => {
                offsetVec.set(puff.ox * cloudScale, puff.oy * cloudScale, puff.oz * cloudScale);
                offsetVec.applyQuaternion(groupQuat);

                dummy.position.set(
                    pos.x + offsetVec.x,
                    pos.y + offsetVec.y,
                    pos.z + offsetVec.z
                );
                dummy.quaternion.copy(groupQuat);
                dummy.scale.set(
                    puff.sx * cloudScale,
                    puff.sy * cloudScale,
                    puff.sz * cloudScale
                );
                dummy.updateMatrix();
                instancedClouds.setMatrixAt(instanceIndex++, dummy.matrix);
            });
        });

        instancedClouds.instanceMatrix.needsUpdate = true;
        instancedClouds.computeBoundingSphere();
        this.scene.add(instancedClouds);
    }
}
