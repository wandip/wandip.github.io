import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/Constants';

/**
 * Manages camera movement and different view modes
 */
export class Camera {
    constructor(scene) {
        this.scene = scene;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.currentViewMode = 'behind-car'; // 'behind-car', 'top-view', 'first-person'
        this.previousViewMode = 'behind-car'; // Track the previous view mode for transitions
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
     * Toggles between behind-car, top-view, and first-person camera views
     */
    toggleView() {
        const currentTime = performance.now() / 1000;
        // Prevent rapid toggling
        if (currentTime - this.lastToggleTime < this.transitionDuration) {
            return;
        }
        this.lastToggleTime = currentTime;
        
        // Store the current view mode before changing it
        const previousViewMode = this.currentViewMode;
        this.currentViewMode = this.getNextViewMode();
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        // Store the previous view mode for transition calculations
        this.previousViewMode = previousViewMode;
    }

    /**
     * Updates camera position and orientation based on car position and rotation
     * @param {THREE.Vector3} carPosition - Current car position
     * @param {number} carRotation - Current car rotation
     */
    update(carPosition, carRotation) {
        if (this.isTransitioning) {
            this.updateTransition(carPosition, carRotation);
        } else if (this.currentViewMode === 'top-view') {
            this.updateTopView(carPosition, carRotation);
        } else if (this.currentViewMode === 'first-person') {
            this.updateFirstPersonView(carPosition, carRotation);
        } else {
            this.updateBehindCarView(carPosition, carRotation);
        }
    }

    /**
     * Updates camera for top-down view
     * @param {THREE.Vector3} carPosition - Current car position
     * @param {number} carRotation - Current car rotation
     */
    updateTopView(carPosition, carRotation) {
        this.camera.position.set(
            carPosition.x,
            CAMERA_CONFIG.HEIGHT,
            carPosition.z
        );
        
        // Calculate look-at target based on car's direction
        const lookTarget = new THREE.Vector3(
            carPosition.x + Math.sin(carRotation) * 20,
            0,
            carPosition.z + Math.cos(carRotation) * 20
        );
        this.camera.lookAt(lookTarget);
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
        
        // Calculate look-at target based on car's direction
        const lookTarget = new THREE.Vector3().copy(carPosition).add(
            new THREE.Vector3(
                Math.sin(carRotation) * 20,
                CAMERA_CONFIG.BEHIND_CAR_HEIGHT * 0.3,
                Math.cos(carRotation) * 20
            )
        );
        
        // Directly look at the target without lerping the direction
        this.camera.lookAt(lookTarget);
    }

    /**
     * Updates camera for first-person view (from car bonnet)
     * @param {THREE.Vector3} carPosition - Current car position
     * @param {number} carRotation - Current car rotation
     */
    updateFirstPersonView(carPosition, carRotation) {
        // Position camera rigidly at car bonnet level, slightly forward and up
        const cameraOffset = new THREE.Vector3(
            Math.sin(carRotation) * CAMERA_CONFIG.FIRST_PERSON_FORWARD_OFFSET,
            CAMERA_CONFIG.FIRST_PERSON_HEIGHT + CAMERA_CONFIG.FIRST_PERSON_UP_OFFSET,
            Math.cos(carRotation) * CAMERA_CONFIG.FIRST_PERSON_FORWARD_OFFSET
        );
        
        // Set camera position directly without lerping for rigid attachment
        this.camera.position.copy(carPosition).add(cameraOffset);
        
        // Look in the direction the car is facing
        const lookTarget = new THREE.Vector3().copy(carPosition).add(
            new THREE.Vector3(
                Math.sin(carRotation) * 50,
                CAMERA_CONFIG.FIRST_PERSON_HEIGHT,
                Math.cos(carRotation) * 50
            )
        );
        
        this.camera.lookAt(lookTarget);
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

        // Calculate positions for all three views
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

        const firstPersonOffset = new THREE.Vector3(
            Math.sin(carRotation) * CAMERA_CONFIG.FIRST_PERSON_FORWARD_OFFSET,
            CAMERA_CONFIG.FIRST_PERSON_HEIGHT + CAMERA_CONFIG.FIRST_PERSON_UP_OFFSET,
            Math.cos(carRotation) * CAMERA_CONFIG.FIRST_PERSON_FORWARD_OFFSET
        );
        const firstPersonPos = carPosition.clone().add(firstPersonOffset);

        // Determine which views to interpolate between based on current mode
        let fromPos, toPos, lookTarget;
        
        if (this.currentViewMode === 'top-view') {
            // Transitioning to top view
            if (this.previousViewMode === 'behind-car') {
                fromPos = behindCarPos;
                toPos = topViewPos;
            } else {
                fromPos = firstPersonPos;
                toPos = topViewPos;
            }
            lookTarget = new THREE.Vector3(
                carPosition.x + Math.sin(carRotation) * 20,
                0,
                carPosition.z + Math.cos(carRotation) * 20
            );
        } else if (this.currentViewMode === 'first-person') {
            // Transitioning to first-person view
            if (this.previousViewMode === 'behind-car') {
                fromPos = behindCarPos;
                toPos = firstPersonPos;
            } else {
                fromPos = topViewPos;
                toPos = firstPersonPos;
            }
            lookTarget = new THREE.Vector3().copy(carPosition).add(
                new THREE.Vector3(
                    Math.sin(carRotation) * 50,
                    CAMERA_CONFIG.FIRST_PERSON_HEIGHT,
                    Math.cos(carRotation) * 50
                )
            );
        } else {
            // Transitioning to behind-car view
            if (this.previousViewMode === 'top-view') {
                fromPos = topViewPos;
                toPos = behindCarPos;
            } else {
                fromPos = firstPersonPos;
                toPos = behindCarPos;
            }
            lookTarget = new THREE.Vector3().copy(carPosition).add(
                new THREE.Vector3(
                    Math.sin(carRotation) * 20,
                    CAMERA_CONFIG.BEHIND_CAR_HEIGHT * 0.3,
                    Math.cos(carRotation) * 20
                )
            );
        }

        // Interpolate position
        this.camera.position.lerpVectors(fromPos, toPos, this.transitionProgress);
        this.camera.lookAt(lookTarget);
    }

    /**
     * Gets the camera instance
     * @returns {THREE.PerspectiveCamera} The camera instance
     */
    getCamera() {
        return this.camera;
    }

    getNextViewMode() {
        const modes = ['behind-car', 'first-person', 'top-view'];
        const currentIndex = modes.indexOf(this.currentViewMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        return modes[nextIndex];
    }

    getPreviousViewMode() {
        const modes = ['behind-car', 'first-person', 'top-view'];
        const currentIndex = modes.indexOf(this.currentViewMode);
        const previousIndex = (currentIndex - 1 + modes.length) % modes.length;
        return modes[previousIndex];
    }
} 