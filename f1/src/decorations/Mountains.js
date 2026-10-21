import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class Mountains {
    constructor(scene) {
        this.scene = scene;
        this.addMountains();
    }

    addMountains() {
        // Earthy base color palette (as RGB arrays)
        const earthyColors = [
            [0.18, 0.13, 0.08], // dark brown
            [0.10, 0.10, 0.10], // black
            [0.13, 0.20, 0.13], // dark green
            [0.28, 0.28, 0.28], // dark gray
            [0.20, 0.16, 0.12], // brown
        ];

        const numMountainRanges = 8;
        const mountainsPerRange = 3;
        const baseRadius = 300;
        const radiusVariation = 50;

        const geometriesToMerge = [];
        const matrix = new THREE.Matrix4();
        const euler = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const positionVec = new THREE.Vector3();
        const scaleVec = new THREE.Vector3(1, 1, 1);

        const buildPeakGeometry = (radius, height, segments, baseColor, snowLine, x, z) => {
            const cone = new THREE.ConeGeometry(radius, height, segments, 1, false);
            const nonIndexed = cone.toNonIndexed();
            cone.dispose();

            const position = nonIndexed.attributes.position;
            const colors = new Float32Array(position.count * 3);
            for (let v = 0; v < position.count; v++) {
                const y = position.getY(v);
                const t = y / height;
                const idx = v * 3;
                if (t > snowLine) {
                    colors[idx] = 1;
                    colors[idx + 1] = 1;
                    colors[idx + 2] = 1;
                } else {
                    const variation = (Math.random() - 0.5) * 0.08;
                    colors[idx] = Math.max(0, Math.min(1, baseColor[0] + variation));
                    colors[idx + 1] = Math.max(0, Math.min(1, baseColor[1] + variation));
                    colors[idx + 2] = Math.max(0, Math.min(1, baseColor[2] + variation));
                }
            }
            nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            positionVec.set(x, height / 2, z);
            euler.set(0, Math.random() * Math.PI, 0);
            quaternion.setFromEuler(euler);
            matrix.compose(positionVec, quaternion, scaleVec);
            nonIndexed.applyMatrix4(matrix);
            return nonIndexed;
        };

        for (let range = 0; range < numMountainRanges; range++) {
            const angle = (range / numMountainRanges) * Math.PI * 2;
            const rangeRadius = baseRadius + (Math.random() - 0.5) * radiusVariation;

            for (let i = 0; i < mountainsPerRange; i++) {
                const mountainAngle = angle + (Math.random() - 0.5) * 0.5;
                const mountainRadius = rangeRadius + (Math.random() - 0.5) * 30;
                const x = Math.cos(mountainAngle) * mountainRadius;
                const z = Math.sin(mountainAngle) * mountainRadius;

                const height = 40 + Math.random() * 40;
                const radius = 25 + Math.random() * 25;
                const segments = 8 + Math.floor(Math.random() * 4);
                const baseColor = earthyColors[Math.floor(Math.random() * earthyColors.length)];
                const hasSnow = height > 50 && Math.random() > 0.1;
                const snowLine = hasSnow ? 0.5 : 1.1;

                geometriesToMerge.push(buildPeakGeometry(radius, height, segments, baseColor, snowLine, x, z));

                if (Math.random() > 0.5) {
                    const smallPeakCount = 1 + Math.floor(Math.random() * 2);
                    for (let j = 0; j < smallPeakCount; j++) {
                        const smallPeakAngle = mountainAngle + (Math.random() - 0.5) * 0.3;
                        const smallPeakDistance = mountainRadius + (Math.random() - 0.5) * 20;
                        const smallPeakX = Math.cos(smallPeakAngle) * smallPeakDistance;
                        const smallPeakZ = Math.sin(smallPeakAngle) * smallPeakDistance;

                        const smallPeakHeight = height * (0.4 + Math.random() * 0.3);
                        const smallPeakBaseRadius = radius * (0.4 + Math.random() * 0.2);
                        const smallHasSnow = smallPeakHeight > 30 && Math.random() > 0.2;
                        const smallSnowLine = smallHasSnow ? 0.5 : 1.1;

                        geometriesToMerge.push(
                            buildPeakGeometry(smallPeakBaseRadius, smallPeakHeight, segments, baseColor, smallSnowLine, smallPeakX, smallPeakZ)
                        );
                    }
                }
            }
        }

        const mergedGeometry = mergeGeometries(geometriesToMerge, false);
        geometriesToMerge.forEach(g => g.dispose());

        const sharedMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });

        const mountainsMesh = new THREE.Mesh(mergedGeometry, sharedMaterial);
        this.scene.add(mountainsMesh);
    }
}
