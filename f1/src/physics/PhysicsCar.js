import * as THREE from 'three';
import { PHYSICS_CONFIG, PHYSICS_WHEEL_POSITIONS, WHEEL_DIRECTIONS, DEFAULT_STEERING_SENSITIVITY } from './PhysicsConstants';

// Pre-allocated temporaries to avoid per-frame garbage collection
const _quat = new THREE.Quaternion();
const _forward = new THREE.Vector3();

/**
 * Handles all physics-related car logic and vehicle controller
 */
export class PhysicsCar {
    constructor(rapierPhysics, visualCar, movement, scene) {
        this.rapierPhysics = rapierPhysics;
        this.visualCar = visualCar;
        this.scene = scene;
        this.chassisBody = null;
        this.chassisCollider = null;
        this.vehicleController = null;
        this.physicsWheels = [];

        // Use the shared movement object from Game
        this.movement = movement || {
            forward: 0,
            right: 0,
            brake: 0,
            accelerateForce: { value: 0, min: PHYSICS_CONFIG.ENGINE_FORCE_MIN, max: PHYSICS_CONFIG.ENGINE_FORCE_MAX, step: PHYSICS_CONFIG.ENGINE_FORCE_STEP },
            brakeForce: { value: 0, min: 0, max: PHYSICS_CONFIG.BRAKE_FORCE_MAX, step: PHYSICS_CONFIG.BRAKE_FORCE_STEP }
        };

        // Rotation tracking for continuous camera interpolation
        this.lastRotation = 0;
        this.totalRotations = 0;
        this.currentYaw = 0;

        this.steeringSensitivity = DEFAULT_STEERING_SENSITIVITY;
        this.lastSteeringValue = 0;
        this.steeringSmoothingFactor = 0.4;

        this.setupPhysics();
    }

    /**
     * Sets up the physics car with chassis rigid body and raycast vehicle controller
     * without needing any intermediate Three.js wireframe meshes
     */
    setupPhysics() {
        const { rapier, world } = this.rapierPhysics;
        const carObject = this.visualCar.getObject();

        // Spawn car behind the checkered start line at proper ride height
        const spawnY = PHYSICS_CONFIG.GROUND_LEVEL + PHYSICS_CONFIG.CAR_HEIGHT_OFFSET;
        carObject.position.set(0, spawnY, -7);
        carObject.quaternion.identity();

        // Create dynamic rigid body directly at car's world position
        const bodyDesc = rapier.RigidBodyDesc.dynamic()
            .setTranslation(carObject.position.x, carObject.position.y, carObject.position.z)
            .setLinearDamping(0.15)
            .setAngularDamping(0.5)
            .setCanSleep(false);

        this.chassisBody = world.createRigidBody(bodyDesc);

        // Attach cuboid collider with local offset matching the visual F1 chassis
        const halfExtents = PHYSICS_CONFIG.CHASSIS_HALF_EXTENTS;
        const colliderOffset = PHYSICS_CONFIG.CHASSIS_COLLIDER_OFFSET;
        const colliderDesc = rapier.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z)
            .setTranslation(colliderOffset.x, colliderOffset.y, colliderOffset.z)
            .setMass(PHYSICS_CONFIG.CAR_MASS)
            .setRestitution(PHYSICS_CONFIG.CAR_RESTITUTION)
            .setFriction(0.3);

        this.chassisCollider = world.createCollider(colliderDesc, this.chassisBody);

        // Create raycast vehicle controller and set forward axis to Z (2)
        this.vehicleController = world.createVehicleController(this.chassisBody);
        this.vehicleController.setIndexForwardAxis = 2;

        this.addPhysicsWheels();
    }

    /**
     * Adds physics wheels that coincide with the visual wheels
     */
    addPhysicsWheels() {
        PHYSICS_WHEEL_POSITIONS.forEach((pos, index) => {
            this.addPhysicsWheel(index, pos);
        });
    }

    /**
     * Adds and configures a single raycast wheel on the vehicle controller
     */
    addPhysicsWheel(index, pos) {
        const wheelRadius = PHYSICS_CONFIG.WHEEL_RADIUS;
        const suspensionRestLength = PHYSICS_CONFIG.SUSPENSION_REST_LENGTH;
        const connectionY = pos.connectionY ?? PHYSICS_CONFIG.WHEEL_CONNECTION_HEIGHT;

        const wheelConnection = {
            x: pos.x,
            y: connectionY,
            z: pos.z
        };

        this.vehicleController.addWheel(
            wheelConnection,
            WHEEL_DIRECTIONS.DIRECTION,
            WHEEL_DIRECTIONS.AXLE,
            suspensionRestLength,
            wheelRadius
        );

        this.vehicleController.setWheelSuspensionStiffness(index, PHYSICS_CONFIG.SUSPENSION_STIFFNESS);
        this.vehicleController.setWheelSuspensionCompression(index, PHYSICS_CONFIG.SUSPENSION_COMPRESSION);
        this.vehicleController.setWheelSuspensionRelaxation(index, PHYSICS_CONFIG.SUSPENSION_RELAXATION);
        this.vehicleController.setWheelMaxSuspensionTravel(index, PHYSICS_CONFIG.SUSPENSION_TRAVEL);
        this.vehicleController.setWheelMaxSuspensionForce(index, PHYSICS_CONFIG.MAX_SUSPENSION_FORCE);
        this.vehicleController.setWheelFrictionSlip(index, PHYSICS_CONFIG.WHEEL_FRICTION_SLIP);
        this.vehicleController.setWheelSideFrictionStiffness(index, PHYSICS_CONFIG.WHEEL_SIDE_FRICTION_STIFFNESS);

        this.physicsWheels[index] = {
            index,
            connectionY,
            position: pos
        };
    }

    /**
     * Updates car controls based on input
     */
    updateCarControls() {
        let accelerateForce = 0;

        if (this.movement.forward < 0) {
            accelerateForce = this.movement.accelerateForce.value - this.movement.accelerateForce.step;
            if (accelerateForce < this.movement.accelerateForce.min) accelerateForce = this.movement.accelerateForce.min;
        } else if (this.movement.forward > 0) {
            accelerateForce = this.movement.accelerateForce.value + this.movement.accelerateForce.step;
            if (accelerateForce > this.movement.accelerateForce.max) accelerateForce = this.movement.accelerateForce.max;
        } else {
            accelerateForce = this.movement.accelerateForce.value * PHYSICS_CONFIG.FORCE_DECAY;
            if (Math.abs(accelerateForce) < 1) accelerateForce = 0;
        }

        this.movement.accelerateForce.value = accelerateForce;

        let brakeForce = 0;
        if (this.movement.brake > 0) {
            brakeForce = this.movement.brakeForce.value + this.movement.brakeForce.step;
            if (brakeForce > this.movement.brakeForce.max) brakeForce = this.movement.brakeForce.max;
        }
        this.movement.brakeForce.value = brakeForce;

        for (let i = 0; i < 4; i++) {
            this.vehicleController.setWheelEngineForce(i, accelerateForce);
            this.vehicleController.setWheelBrake(i, brakeForce);
        }

        // Continuous steering calculation with smoothing
        const steerDirection = this.movement.right * (this.steeringSensitivity || 1.0);
        const maxSteerAngle = PHYSICS_CONFIG.MAX_STEER_ANGLE;
        const targetSteering = Math.max(-maxSteerAngle, Math.min(maxSteerAngle, steerDirection * maxSteerAngle));

        const smoothedSteering = this.lastSteeringValue * (1 - this.steeringSmoothingFactor) +
            targetSteering * this.steeringSmoothingFactor;
        this.lastSteeringValue = smoothedSteering;

        // Apply steering to front wheels (0 and 1)
        this.vehicleController.setWheelSteering(0, smoothedSteering);
        this.vehicleController.setWheelSteering(1, smoothedSteering);
    }

    /**
     * Steps the Rapier vehicle controller with dynamic collider filtering
     * @param {number} deltaTime
     */
    stepVehicle(deltaTime) {
        if (!this.vehicleController) return;
        const dt = deltaTime > 0 ? Math.min(Math.max(deltaTime, 1 / 240), 1 / 30) : 1 / 60;
        const filterFlags = this.rapierPhysics.rapier.QueryFilterFlags.EXCLUDE_DYNAMIC;
        this.vehicleController.updateVehicle(dt, filterFlags);
    }

    /**
     * Updates visual wheel steering, rolling rotation, and suspension compression
     */
    updatePhysicsWheels() {
        if (!this.vehicleController) return;

        for (let i = 0; i < 4; i++) {
            const wheelData = this.physicsWheels[i];
            if (!wheelData) continue;

            const steering = this.vehicleController.wheelSteering(i) || 0;
            const rotation = this.vehicleController.wheelRotation(i) || 0;
            const suspLen = this.vehicleController.wheelSuspensionLength(i);
            const localY = suspLen !== null ? wheelData.connectionY - suspLen : wheelData.position.y;

            this.visualCar.updateWheelFromPhysics(i, steering, rotation, localY);
        }
    }

    /**
     * Synchronizes the visual car directly from the Rapier chassis rigid body
     * and updates continuous yaw tracking once per frame
     */
    updateVisualCar() {
        if (!this.chassisBody) return;

        const translation = this.chassisBody.translation();
        const rotation = this.chassisBody.rotation();
        this.visualCar.syncWithPhysics(translation, rotation);

        // Extract yaw angle cleanly from rotated forward vector (immune to quaternion w sign flip & pitch/roll)
        _quat.set(rotation.x, rotation.y, rotation.z, rotation.w);
        _forward.set(0, 0, 1).applyQuaternion(_quat);
        const currentRotation = Math.atan2(_forward.x, _forward.z);

        let angleDifference = currentRotation - this.lastRotation;
        if (angleDifference > Math.PI) {
            angleDifference -= 2 * Math.PI;
        } else if (angleDifference < -Math.PI) {
            angleDifference += 2 * Math.PI;
        }

        this.totalRotations += angleDifference;
        this.lastRotation = currentRotation;
        this.currentYaw = this.totalRotations;
    }

    /**
     * Gets the car's continuous yaw rotation in radians
     * @returns {number}
     */
    getCarRotation() {
        return this.currentYaw;
    }

    getChassisBody() {
        return this.chassisBody;
    }

    getVehicleController() {
        return this.vehicleController;
    }

    getMovement() {
        return this.movement;
    }

    getPhysicsWheels() {
        return this.physicsWheels;
    }

    isPhysicsReady() {
        return Boolean(this.chassisBody && this.vehicleController);
    }

    /**
     * Gets physics debug information (only called when DEBUG_MODE is active)
     */
    getPhysicsDebugInfo() {
        if (!this.isPhysicsReady()) {
            return {
                physicsReady: false,
                position: { x: 'N/A', y: 'N/A', z: 'N/A' },
                velocity: { x: 'N/A', y: 'N/A', z: 'N/A' },
                speed: 'N/A',
                engineForce: 'N/A',
                brakeForce: 'N/A',
                input: { forward: this.movement.forward, right: this.movement.right, brake: this.movement.brake },
                wheelForces: ['N/A', 'N/A', 'N/A', 'N/A'],
                suspension: ['N/A', 'N/A', 'N/A', 'N/A'],
                vehicleState: 'Physics Not Ready',
                groundContact: false,
                rotation: 'N/A'
            };
        }

        const physicsPosition = this.chassisBody.translation();
        const velocity = this.chassisBody.linvel();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

        const forceStr = this.movement.accelerateForce.value.toFixed(1);
        const wheelForces = [forceStr, forceStr, forceStr, forceStr];

        const wheelContacts = [
            this.vehicleController.wheelIsInContact(0),
            this.vehicleController.wheelIsInContact(1),
            this.vehicleController.wheelIsInContact(2),
            this.vehicleController.wheelIsInContact(3)
        ];

        const suspensionLengths = [
            (this.vehicleController.wheelSuspensionLength(0) ?? 0).toFixed(3),
            (this.vehicleController.wheelSuspensionLength(1) ?? 0).toFixed(3),
            (this.vehicleController.wheelSuspensionLength(2) ?? 0).toFixed(3),
            (this.vehicleController.wheelSuspensionLength(3) ?? 0).toFixed(3)
        ];

        const groundContact = wheelContacts.some(Boolean);

        return {
            physicsReady: true,
            position: {
                x: physicsPosition.x.toFixed(2),
                y: physicsPosition.y.toFixed(2),
                z: physicsPosition.z.toFixed(2)
            },
            velocity: {
                x: velocity.x.toFixed(2),
                y: velocity.y.toFixed(2),
                z: velocity.z.toFixed(2)
            },
            speed: speed.toFixed(2),
            engineForce: forceStr,
            brakeForce: this.movement.brakeForce.value.toFixed(1),
            input: {
                forward: this.movement.forward,
                right: this.movement.right,
                brake: this.movement.brake
            },
            wheelForces,
            suspension: suspensionLengths,
            vehicleState: `Wheels: ${this.vehicleController.numWheels()}`,
            groundContact,
            rotation: (this.currentYaw * 180 / Math.PI).toFixed(2)
        };
    }

    /**
     * Gets the car's speed in m/s (magnitude of velocity in XZ plane)
     */
    getSpeed() {
        if (!this.chassisBody) return 0;
        const velocity = this.chassisBody.linvel();
        return Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    }

    setSteeringSensitivity(value) {
        this.steeringSensitivity = value;
    }

    getSteeringSensitivity() {
        return this.steeringSensitivity;
    }
}
