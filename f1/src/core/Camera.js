import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/Constants';

/**
 * Manages camera movement and different view modes
 */
export class Camera {
    constructor(scene) {
        this.scene = scene;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.isTopView = false;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 0.5; // seconds
        this.lastToggleTime = 0;
        this.setupCamera();
        this.setupResizeHandler();
    }

    /**
     * Initial camera setup
     */
    setupCamera() {
        this.camera.position.set(0, 3, -7);
        this.camera.lookAt(0, 0, 20);
        this.camera.up.set(0, 1, 0);
    }

    /**
     * Sets up window resize handler
     */
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    /**
     * Toggles between top view and behind car view
     */
    toggleView() {
        const currentTime = performance.now() / 1000;
        // Prevent rapid toggling
        if (currentTime - this.lastToggleTime < this.transitionDuration) {
            return;
        }
        this.lastToggleTime = currentTime;
        this.isTopView = !this.isTopView;
        this.isTransitioning = true;
        this.transitionProgress = 0;
    }

    /**
     * Updates camera position and orientation based on car position and rotation
     * @param {THREE.Vector3} carPosition - Current car position
     * @param {number} carRotation - Current car rotation
     */
    update(carPosition, carRotation) {
        if (this.isTransitioning) {
            this.updateTransition(carPosition, carRotation);
        } else if (this.isTopView) {
            this.updateTopView(carPosition);
        } else {
            this.updateBehindCarView(carPosition, carRotation);
        }
    }

    /**
     * Updates camera for top-down view
     * @param {THREE.Vector3} carPosition - Current car position
     */
    updateTopView(carPosition) {
        this.camera.position.set(
            carPosition.x,
            CAMERA_CONFIG.HEIGHT,
            carPosition.z
        );
        this.camera.lookAt(
            carPosition.x,
            0,
            carPosition.z + 20
        );
    }

    /**
     * Updates camera for behind-car view
     * @param {THREE.Vector3} carPosition - Current car position
     * @param {number} carRotation - Current car rotation
     */
    updateBehindCarView(carPosition, carRotation) {
        const cameraOffset = new THREE.Vector3(
            -Math.sin(carRotation) * CAMERA_CONFIG.BEHIND_CAR_DISTANCE,
            CAMERA_CONFIG.BEHIND_CAR_HEIGHT,
            -Math.cos(carRotation) * CAMERA_CONFIG.BEHIND_CAR_DISTANCE
        );
        
        const targetCameraPos = new THREE.Vector3().copy(carPosition).add(cameraOffset);
        this.camera.position.lerp(targetCameraPos, CAMERA_CONFIG.LERP_FACTOR);
        
        const lookTarget = new THREE.Vector3().copy(carPosition).add(
            new THREE.Vector3(
                Math.sin(carRotation) * 20,
                CAMERA_CONFIG.BEHIND_CAR_HEIGHT * 0.3,
                Math.cos(carRotation) * 20
            )
        );
        
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        const targetLookAt = lookTarget.clone().sub(this.camera.position).normalize();
        currentLookAt.lerp(targetLookAt, CAMERA_CONFIG.LERP_FACTOR);
        this.camera.lookAt(this.camera.position.clone().add(currentLookAt));
    }

    /**
     * Updates camera during view transition
     * @param {THREE.Vector3} carPosition - Current car position
     * @param {number} carRotation - Current car rotation
     */
    updateTransition(carPosition, carRotation) {
        const deltaTime = 1/60; // Assuming 60 FPS
        this.transitionProgress += deltaTime / this.transitionDuration;
        
        if (this.transitionProgress >= 1) {
            this.transitionProgress = 1;
            this.isTransitioning = false;
        }

        // Calculate interpolated positions
        const topViewPos = new THREE.Vector3(
            carPosition.x,
            CAMERA_CONFIG.HEIGHT,
            carPosition.z
        );
        
        const behindCarOffset = new THREE.Vector3(
            -Math.sin(carRotation) * CAMERA_CONFIG.BEHIND_CAR_DISTANCE,
            CAMERA_CONFIG.BEHIND_CAR_HEIGHT,
            -Math.cos(carRotation) * CAMERA_CONFIG.BEHIND_CAR_DISTANCE
        );
        const behindCarPos = carPosition.clone().add(behindCarOffset);

        // Interpolate between views
        if (this.isTopView) {
            this.camera.position.lerpVectors(behindCarPos, topViewPos, this.transitionProgress);
            const lookTarget = new THREE.Vector3(
                carPosition.x,
                0,
                carPosition.z + 20
            );
            this.camera.lookAt(lookTarget);
        } else {
            this.camera.position.lerpVectors(topViewPos, behindCarPos, this.transitionProgress);
            const lookTarget = new THREE.Vector3().copy(carPosition).add(
                new THREE.Vector3(
                    Math.sin(carRotation) * 20,
                    CAMERA_CONFIG.BEHIND_CAR_HEIGHT * 0.3,
                    Math.cos(carRotation) * 20
                )
            );
            this.camera.lookAt(lookTarget);
        }
    }

    /**
     * Gets the camera instance
     * @returns {THREE.PerspectiveCamera} The camera instance
     */
    getCamera() {
        return this.camera;
    }
} 