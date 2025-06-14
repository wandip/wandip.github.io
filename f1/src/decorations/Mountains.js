import * as THREE from 'three';

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

        // Create mountains in a full 360-degree circle
        const numMountainRanges = 8; // Number of mountain ranges around the track
        const mountainsPerRange = 3; // Number of mountains in each range
        const baseRadius = 300; // Distance from center
        const radiusVariation = 50; // Variation in distance

        for (let range = 0; range < numMountainRanges; range++) {
            const angle = (range / numMountainRanges) * Math.PI * 2;
            const rangeRadius = baseRadius + (Math.random() - 0.5) * radiusVariation;
            
            // Create a mountain range
            for (let i = 0; i < mountainsPerRange; i++) {
                // Calculate position with some randomness
                const mountainAngle = angle + (Math.random() - 0.5) * 0.5;
                const mountainRadius = rangeRadius + (Math.random() - 0.5) * 30;
                const x = Math.cos(mountainAngle) * mountainRadius;
                const z = Math.sin(mountainAngle) * mountainRadius;

                // Create main mountain with more segments for realism
                const height = 40 + Math.random() * 40;
                const radius = 25 + Math.random() * 25;
                const segments = 8 + Math.floor(Math.random() * 4); // More segments for realism
                const geometry = new THREE.ConeGeometry(radius, height, segments, 1, false);

                // Pick a random earthy base color for this mountain
                const baseColor = earthyColors[Math.floor(Math.random() * earthyColors.length)];

                // Increase probability and lower snow line
                const hasSnow = height > 50 && Math.random() > 0.1; // 90% chance for tall mountains
                const snowLine = hasSnow ? 0.5 : 1.1; // Snow starts at 50% of height if present

                // Assign vertex colors for snow blending
                const position = geometry.attributes.position;
                const colors = [];
                for (let v = 0; v < position.count; v++) {
                    const y = position.getY(v);
                    const t = y / height;
                    if (t > snowLine) {
                        // Distinct, pure white snow
                        colors.push(1, 1, 1);
                    } else {
                        // Earthy base color with slight variation
                        const variation = (Math.random() - 0.5) * 0.08;
                        colors.push(
                            Math.max(0, Math.min(1, baseColor[0] + variation)),
                            Math.max(0, Math.min(1, baseColor[1] + variation)),
                            Math.max(0, Math.min(1, baseColor[2] + variation))
                        );
                    }
                }
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

                // Use vertex colors in the material
                const material = new THREE.MeshStandardMaterial({
                    vertexColors: true,
                    roughness: 0.8 + Math.random() * 0.2,
                    metalness: 0.1,
                    flatShading: true
                });

                const mountain = new THREE.Mesh(geometry, material);
                mountain.position.set(x, height / 2, z);
                mountain.rotation.y = Math.random() * Math.PI;
                this.scene.add(mountain);

                // Add some smaller peaks around the main mountain
                if (Math.random() > 0.5) {
                    const smallPeakCount = 1 + Math.floor(Math.random() * 2);
                    for (let j = 0; j < smallPeakCount; j++) {
                        const smallPeakAngle = mountainAngle + (Math.random() - 0.5) * 0.3;
                        const smallPeakDistance = mountainRadius + (Math.random() - 0.5) * 20;
                        const smallPeakX = Math.cos(smallPeakAngle) * smallPeakDistance;
                        const smallPeakZ = Math.sin(smallPeakAngle) * smallPeakDistance;
                        
                        const smallPeakHeight = height * (0.4 + Math.random() * 0.3);
                        const smallPeakBaseRadius = radius * (0.4 + Math.random() * 0.2);
                        const smallSegments = segments;
                        const smallGeometry = new THREE.ConeGeometry(smallPeakBaseRadius, smallPeakHeight, smallSegments, 1, false);
                        // Use the same base color for small peaks in the same range
                        const smallHasSnow = smallPeakHeight > 30 && Math.random() > 0.2; // 80% chance for smaller peaks
                        const smallSnowLine = smallHasSnow ? 0.5 : 1.1;
                        const smallColors = [];
                        const smallPosition = smallGeometry.attributes.position;
                        for (let v = 0; v < smallPosition.count; v++) {
                            const y = smallPosition.getY(v);
                            const t = y / smallPeakHeight;
                            if (t > smallSnowLine) {
                                smallColors.push(1, 1, 1);
                            } else {
                                const variation = (Math.random() - 0.5) * 0.08;
                                smallColors.push(
                                    Math.max(0, Math.min(1, baseColor[0] + variation)),
                                    Math.max(0, Math.min(1, baseColor[1] + variation)),
                                    Math.max(0, Math.min(1, baseColor[2] + variation))
                                );
                            }
                        }
                        smallGeometry.setAttribute('color', new THREE.Float32BufferAttribute(smallColors, 3));
                        const smallMaterial = new THREE.MeshStandardMaterial({
                            vertexColors: true,
                            roughness: 0.8 + Math.random() * 0.2,
                            metalness: 0.1,
                            flatShading: true
                        });
                        const smallPeak = new THREE.Mesh(smallGeometry, smallMaterial);
                        smallPeak.position.set(smallPeakX, smallPeakHeight / 2, smallPeakZ);
                        smallPeak.rotation.y = Math.random() * Math.PI;
                        this.scene.add(smallPeak);
                    }
                }
            }
        }
    }
} 