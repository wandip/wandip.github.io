import * as THREE from 'three';
import { CAMERA_CONFIG } from '../utils/Constants';

// Pre-allocated vectors to avoid per-frame garbage collection
const _cameraOffset = new THREE.Vector3();
const _targetCameraPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _topViewPos = new THREE.Vector3();
const _behindCarPos = new THREE.Vector3();
const _firstPersonPos = new THREE.Vector3();

/**
 * Manages camera movement and different view modes
 */
export class Camera {
    constructor(scene) {
        this.scene = scene;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.currentViewMode = 'behind-car'; // 'behind-car', 'top-view', 'first-person'
        this.previousViewMode = 'behind-car';
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
     * Detects if the current device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobileDevice() {
        return window.innerWidth <= 768 ||
            (window.innerWidth <= 1024 && window.innerHeight <= 768) ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Gets the appropriate camera configuration based on device type
     * @returns {Object} Camera configuration object
     */
    getCameraConfig() {
        if (this.isMobileDevice()) {
            return {
                ...CAMERA_CONFIG,
                BEHIND_CAR_DISTANCE: CAMERA_CONFIG.MOBILE.BEHIND_CAR_DISTANCE,
                BEHIND_CAR_HEIGHT: CAMERA_CONFIG.MOBILE.BEHIND_CAR_HEIGHT,
                FIRST_PERSON_HEIGHT: CAMERA_CONFIG.MOBILE.FIRST_PERSON_HEIGHT,
                FIRST_PERSON_FORWARD_OFFSET: CAMERA_CONFIG.MOBILE.FIRST_PERSON_FORWARD_OFFSET,
                FIRST_PERSON_UP_OFFSET: CAMERA_CONFIG.MOBILE.FIRST_PERSON_UP_OFFSET
            };
        }
        return CAMERA_CONFIG;
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
        if (currentTime - this.lastToggleTime < this.transitionDuration) {
            return;
        }
        this.lastToggleTime = currentTime;

        const previousViewMode = this.currentViewMode;
        this.currentViewMode = this.getNextViewMode();
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.previousViewMode = previousViewMode;
    }

    /**
     * Updates camera position and orientation based on car position and rotation
     * @param {THREE.Vector3} carPosition - Current car position
     * @param {number} carRotation - Current car rotation
     * @param {number} [deltaTime=1/60] - Frame delta time in seconds
     */
    update(carPosition, carRotation, deltaTime = 1 / 60) {
        if (this.isTransitioning) {
            this.updateTransition(carPosition, carRotation, deltaTime);
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
     */
    updateTopView(carPosition, carRotation) {
        this.camera.position.set(
            carPosition.x,
            CAMERA_CONFIG.HEIGHT,
            carPosition.z
        );

        _lookTarget.set(
            carPosition.x + Math.sin(carRotation) * 20,
            0,
            carPosition.z + Math.cos(carRotation) * 20
        );
        this.camera.lookAt(_lookTarget);
    }

    /**
     * Updates camera for behind-car view
     */
    updateBehindCarView(carPosition, carRotation) {
        const config = this.getCameraConfig();
        const sinR = Math.sin(carRotation);
        const cosR = Math.cos(carRotation);

        _cameraOffset.set(
            -sinR * config.BEHIND_CAR_DISTANCE,
            config.BEHIND_CAR_HEIGHT,
            -cosR * config.BEHIND_CAR_DISTANCE
        );

        _targetCameraPos.copy(carPosition).add(_cameraOffset);
        this.camera.position.lerp(_targetCameraPos, config.LERP_FACTOR);

        _lookTarget.set(
            carPosition.x + sinR * 20,
            carPosition.y + config.BEHIND_CAR_HEIGHT * 0.3,
            carPosition.z + cosR * 20
        );

        this.camera.lookAt(_lookTarget);
    }

    /**
     * Updates camera for first-person view (from car bonnet)
     */
    updateFirstPersonView(carPosition, carRotation) {
        const config = this.getCameraConfig();
        const sinR = Math.sin(carRotation);
        const cosR = Math.cos(carRotation);

        _cameraOffset.set(
            sinR * config.FIRST_PERSON_FORWARD_OFFSET,
            config.FIRST_PERSON_HEIGHT + config.FIRST_PERSON_UP_OFFSET,
            cosR * config.FIRST_PERSON_FORWARD_OFFSET
        );

        this.camera.position.copy(carPosition).add(_cameraOffset);

        _lookTarget.set(
            carPosition.x + sinR * 50,
            carPosition.y + config.FIRST_PERSON_HEIGHT,
            carPosition.z + cosR * 50
        );

        this.camera.lookAt(_lookTarget);
    }

    /**
     * Updates camera during view transition
     */
    updateTransition(carPosition, carRotation, deltaTime = 1 / 60) {
        const config = this.getCameraConfig();
        const dt = deltaTime > 0 ? Math.min(deltaTime, 0.1) : 1 / 60;
        this.transitionProgress += dt / this.transitionDuration;

        if (this.transitionProgress >= 1) {
            this.transitionProgress = 1;
            this.isTransitioning = false;
        }

        const sinR = Math.sin(carRotation);
        const cosR = Math.cos(carRotation);

        _topViewPos.set(carPosition.x, CAMERA_CONFIG.HEIGHT, carPosition.z);

        _behindCarPos.set(
            carPosition.x - sinR * config.BEHIND_CAR_DISTANCE,
            carPosition.y + config.BEHIND_CAR_HEIGHT,
            carPosition.z - cosR * config.BEHIND_CAR_DISTANCE
        );

        _firstPersonPos.set(
            carPosition.x + sinR * config.FIRST_PERSON_FORWARD_OFFSET,
            carPosition.y + config.FIRST_PERSON_HEIGHT + config.FIRST_PERSON_UP_OFFSET,
            carPosition.z + cosR * config.FIRST_PERSON_FORWARD_OFFSET
        );

        let fromPos, toPos;

        if (this.currentViewMode === 'top-view') {
            fromPos = this.previousViewMode === 'behind-car' ? _behindCarPos : _firstPersonPos;
            toPos = _topViewPos;
            _lookTarget.set(
                carPosition.x + sinR * 20,
                0,
                carPosition.z + cosR * 20
            );
        } else if (this.currentViewMode === 'first-person') {
            fromPos = this.previousViewMode === 'behind-car' ? _behindCarPos : _topViewPos;
            toPos = _firstPersonPos;
            _lookTarget.set(
                carPosition.x + sinR * 50,
                carPosition.y + config.FIRST_PERSON_HEIGHT,
                carPosition.z + cosR * 50
            );
        } else {
            fromPos = this.previousViewMode === 'top-view' ? _topViewPos : _firstPersonPos;
            toPos = _behindCarPos;
            _lookTarget.set(
                carPosition.x + sinR * 20,
                carPosition.y + config.BEHIND_CAR_HEIGHT * 0.3,
                carPosition.z + cosR * 20
            );
        }

        this.camera.position.lerpVectors(fromPos, toPos, this.transitionProgress);
        this.camera.lookAt(_lookTarget);
    }

    getCamera() {
        return this.camera;
    }

    getNextViewMode() {
        const modes = ['behind-car', 'first-person', 'top-view'];
        const currentIndex = modes.indexOf(this.currentViewMode);
        return modes[(currentIndex + 1) % modes.length];
    }

    getPreviousViewMode() {
        const modes = ['behind-car', 'first-person', 'top-view'];
        const currentIndex = modes.indexOf(this.currentViewMode);
        return modes[(currentIndex - 1 + modes.length) % modes.length];
    }
}
