import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';

/**
 * Rapier Physics Engine wrapper for the F1 game
 * Handles physics world initialization and car physics
 */
export class RapierPhysics {
    constructor() {
        this.world = null;
        this.carBody = null;
        this.carCollider = null;
        this.roadBody = null;
        this.roadCollider = null;
        this.isInitialized = false;
        this.debugMode = false;
        this.wireframeGroup = null;
        this.carWireframe = null;
        this.roadWireframe = null;
    }

    /**
     * Initialize the Rapier physics world
     * @param {boolean} debugMode - Enable debug mode
     */
    initialize(debugMode = false) {
        try {
            this.debugMode = debugMode;
            
            // Create physics world with gravity
            const gravity = { x: 0.0, y: -9.81, z: 0.0 };
            this.world = new RAPIER.World(gravity);
            
            // Create wireframe group for debug visualization
            this.wireframeGroup = new THREE.Group();
            this.wireframeGroup.name = 'PhysicsWireframes';
            
            console.log('Rapier physics world initialized successfully');
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Rapier physics:', error);
            throw error;
        }
    }

    /**
     * Create the road/track collision surface
     * @param {Object} roadConfig - Road configuration
     */
    createRoad(roadConfig = { width: 50, length: 100, height: 1 }) {
        if (!this.isInitialized) {
            throw new Error('Physics world not initialized. Call initialize() first.');
        }

        // Create static rigid body for the road
        const roadBodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(0, -roadConfig.height/2, 0);

        this.roadBody = this.world.createRigidBody(roadBodyDesc);

        // Create collision shape for the road (large flat surface)
        const roadColliderDesc = RAPIER.ColliderDesc.cuboid(
            roadConfig.width / 2,  // half-width
            roadConfig.height / 2, // half-height
            roadConfig.length / 2  // half-length
        );

        // Set road properties - higher friction for stability
        roadColliderDesc.setFriction(2.0);
        roadColliderDesc.setRestitution(0.0); // No bouncing

        this.roadCollider = this.world.createCollider(roadColliderDesc, this.roadBody);

        // Create wireframe for road if in debug mode
        if (this.debugMode) {
            this.createRoadWireframe(roadConfig);
        }

        console.log('Road physics body created');
    }

    /**
     * Create wireframe visualization for road
     * @param {Object} roadConfig - Road configuration
     */
    createRoadWireframe(roadConfig) {
        const wireframeGeometry = new THREE.BoxGeometry(
            roadConfig.width,
            roadConfig.height,
            roadConfig.length
        );
        
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        
        this.roadWireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.roadWireframe.name = 'RoadPhysicsWireframe';
        this.roadWireframe.position.y = -roadConfig.height/2;
        this.wireframeGroup.add(this.roadWireframe);
    }

    /**
     * Create the car physics body
     * @param {Object} carDimensions - Car dimensions from Constants
     * @param {Object} initialPosition - Initial position {x, y, z}
     * @param {Object} initialRotation - Initial rotation {x, y, z}
     */
    createCarBody(carDimensions, initialPosition = { x: 0, y: 0, z: 0 }, initialRotation = { x: 0, y: 0, z: 0 }) {
        if (!this.isInitialized) {
            throw new Error('Physics world not initialized. Call initialize() first.');
        }

        // Create rigid body for the car
        const carBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(initialPosition.x, initialPosition.y, initialPosition.z)
            .setRotation({ x: initialRotation.x, y: initialRotation.y, z: initialRotation.z, w: 1.0 })
            .setLinearDamping(0.1) // Add linear damping for stability
            .setAngularDamping(0.3); // Reduced from 0.5 to 0.3 for better turning

        this.carBody = this.world.createRigidBody(carBodyDesc);

        // Create collision shape for the car (using main body dimensions)
        const carColliderDesc = RAPIER.ColliderDesc.cuboid(
            carDimensions.BODY.width / 2,  // half-width
            carDimensions.BODY.height / 2, // half-height
            carDimensions.BODY.length / 2  // half-length
        );

        // Set mass and other properties
        carColliderDesc.setMass(1000.0); // 1000 kg
        carColliderDesc.setFriction(2.0); // Increased from 0.9 to match road
        carColliderDesc.setRestitution(0.0); // No bouncing

        this.carCollider = this.world.createCollider(carColliderDesc, this.carBody);

        // Create wireframe for car physics body
        if (this.debugMode) {
            this.createCarWireframe(carDimensions);
        }

        console.log('Car physics body created');
    }

    /**
     * Create wireframe visualization for car physics body
     * @param {Object} carDimensions - Car dimensions
     */
    createCarWireframe(carDimensions) {
        const wireframeGeometry = new THREE.BoxGeometry(
            carDimensions.BODY.width,
            carDimensions.BODY.height,
            carDimensions.BODY.length
        );
        
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        this.carWireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.carWireframe.name = 'CarPhysicsWireframe';
        this.wireframeGroup.add(this.carWireframe);
    }

    /**
     * Update physics simulation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.isInitialized) return;

        // Step the physics simulation
        this.world.step();

        // Update wireframe positions if in debug mode
        if (this.debugMode) {
            this.updateWireframes();
        }
    }

    /**
     * Update wireframe positions to match physics bodies
     */
    updateWireframes() {
        if (this.carBody && this.carWireframe) {
            const position = this.carBody.translation();
            const rotation = this.carBody.rotation();

            this.carWireframe.position.set(position.x, position.y, position.z);
            this.carWireframe.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    /**
     * Get car position from physics body
     * @returns {Object} Position {x, y, z}
     */
    getCarPosition() {
        if (!this.carBody) return { x: 0, y: 0, z: 0 };

        const position = this.carBody.translation();
        return { x: position.x, y: position.y, z: position.z };
    }

    /**
     * Get car rotation from physics body
     * @returns {Object} Rotation quaternion {x, y, z, w}
     */
    getCarRotation() {
        if (!this.carBody) return { x: 0, y: 0, z: 0, w: 1 };

        const rotation = this.carBody.rotation();
        return { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w };
    }

    /**
     * Get car velocity from physics body
     * @returns {Object} Velocity {x, y, z}
     */
    getCarVelocity() {
        if (!this.carBody) return { x: 0, y: 0, z: 0 };

        const velocity = this.carBody.linvel();
        return { x: velocity.x, y: velocity.y, z: velocity.z };
    }

    /**
     * Apply force to the car
     * @param {Object} force - Force vector {x, y, z}
     * @param {Object} point - Point of application {x, y, z} (optional)
     */
    applyForce(force, point = null) {
        if (!this.carBody) return;

        if (point) {
            this.carBody.applyImpulseAtPoint(force, point, true);
        } else {
            this.carBody.applyImpulse(force, true);
        }
    }

    /**
     * Apply torque to the car
     * @param {Object} torque - Torque vector {x, y, z}
     */
    applyTorque(torque) {
        if (!this.carBody) return;

        this.carBody.applyTorqueImpulse(torque, true);
    }

    /**
     * Get wireframe group for scene addition
     * @returns {THREE.Group} Wireframe group
     */
    getWireframeGroup() {
        return this.wireframeGroup;
    }

    /**
     * Get detailed velocity analysis
     * @returns {Object} Detailed velocity info
     */
    getDetailedVelocityInfo() {
        if (!this.carBody) {
            return {
                totalVelocity: { x: 0, y: 0, z: 0 },
                horizontalVelocity: { x: 0, z: 0 },
                verticalVelocity: 0,
                horizontalSpeed: 0,
                verticalSpeed: 0,
                totalSpeed: 0
            };
        }

        const velocity = this.getCarVelocity();
        const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        const verticalSpeed = Math.abs(velocity.y);
        const totalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);

        return {
            totalVelocity: velocity,
            horizontalVelocity: { x: velocity.x, z: velocity.z },
            verticalVelocity: velocity.y,
            horizontalSpeed,
            verticalSpeed,
            totalSpeed
        };
    }

    /**
     * Get debug information for UI display
     * @returns {Object} Debug info object
     */
    getDebugInfo() {
        if (!this.carBody) {
            return {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                velocity: { x: 0, y: 0, z: 0 },
                speed: 0
            };
        }

        const position = this.getCarPosition();
        const rotation = this.getCarRotation();
        const velocity = this.getCarVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

        return {
            position,
            rotation,
            velocity,
            speed
        };
    }

    /**
     * Log debug information
     */
    logDebugInfo() {
        if (!this.debugMode || !this.carBody) return;

        const debugInfo = this.getDebugInfo();
        
        console.log('=== Physics Debug Info ===');
        console.log(`Position: x=${debugInfo.position.x.toFixed(3)}, y=${debugInfo.position.y.toFixed(3)}, z=${debugInfo.position.z.toFixed(3)}`);
        console.log(`Rotation: x=${debugInfo.rotation.x.toFixed(3)}, y=${debugInfo.rotation.y.toFixed(3)}, z=${debugInfo.rotation.z.toFixed(3)}, w=${debugInfo.rotation.w.toFixed(3)}`);
        console.log(`Velocity: x=${debugInfo.velocity.x.toFixed(3)}, y=${debugInfo.velocity.y.toFixed(3)}, z=${debugInfo.velocity.z.toFixed(3)}`);
        console.log(`Speed: ${debugInfo.speed.toFixed(3)} m/s`);
        console.log('==========================');
    }

    /**
     * Clean up physics resources
     */
    dispose() {
        if (this.world) {
            this.world.free();
            this.world = null;
        }
        this.isInitialized = false;
    }
} 