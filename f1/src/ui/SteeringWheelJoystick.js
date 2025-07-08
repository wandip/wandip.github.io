/**
 * F1 Steering Wheel Joystick for mobile devices (F1 Style)
 */
export class SteeringWheelJoystick {
    constructor() {
        this.container = null;
        this.wheel = null;
        this.isActive = false;
        this.centerX = 0;
        this.centerY = 0;
        this.lastPointerAngle = 0;
        this.currentAngle = 0; // in degrees
        this.maxAngle = 135; // max rotation left/right (degrees)
        this.steeringSensitivity = 1.0;
        this.steeringValue = 0; // -1 to 1
        this.lastSteeringValue = 0; // Track last steering value to avoid unnecessary updates
        this.smoothedSteeringValue = 0; // For smoothing steering input
        this.steeringSmoothingFactor = 0.3; // Smoothing factor (0-1, lower = smoother)
        
        // Multi-touch support
        this.activeTouchId = null; // Track which touch is controlling steering
        this.accelerateTouchId = null; // Track accelerate button touch
        this.brakeTouchId = null; // Track brake button touch
        
        this.onSteeringChange = null;
        this.onAccelerateChange = null;
        this.onBrakeChange = null;
        this.accelerateBtn = null;
        this.brakeBtn = null;
        this.resetTimeout = null;
        this.init();
    }

    init() {
        this.createF1SteeringWheel();
        this.setupEventListeners();
    }

    createF1SteeringWheel() {
        // Container
        this.container = document.createElement('div');
        this.container.id = 'steering-joystick-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 30px;
            width: 160px;
            height: 120px;
            z-index: 10000;
            display: none;
            pointer-events: auto;
        `;

        // F1 wheel body
        this.wheel = document.createElement('div');
        this.wheel.id = 'f1-steering-wheel';
        this.wheel.style.cssText = `
            width: 120px;
            height: 60px;
            background: #111;
            border-radius: 28px 28px 18px 18px / 38px 38px 18px 18px;
            position: absolute;
            left: 20px;
            top: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s cubic-bezier(.4,1.4,.6,1);
            touch-action: none;
        `;
        // Side grips
        const leftGrip = document.createElement('div');
        leftGrip.style.cssText = `
            position: absolute;
            left: -22px;
            top: 10px;
            width: 28px;
            height: 60px;
            background: #222;
            border-radius: 18px 0 28px 28px / 28px 0 38px 38px;
            box-shadow: 2px 0 8px rgba(0,0,0,0.2);
        `;
        const rightGrip = document.createElement('div');
        rightGrip.style.cssText = `
            position: absolute;
            right: -22px;
            top: 10px;
            width: 28px;
            height: 60px;
            background: #222;
            border-radius: 0 18px 28px 28px / 0 28px 38px 38px;
            box-shadow: -2px 0 8px rgba(0,0,0,0.2);
        `;
        // Top LEDs
        const ledRow = document.createElement('div');
        ledRow.style.cssText = `
            position: absolute;
            top: 7px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 3px;
            z-index: 2;
        `;
        for (let i = 0; i < 12; i++) {
            const led = document.createElement('div');
            led.style.cssText = `
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #eee;
                opacity: 0.7;
            `;
            ledRow.appendChild(led);
        }
        // Center hub (for touch/mouse visual)
        const hub = document.createElement('div');
        hub.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #222;
            border: 2px solid #fff;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
        `;
        this.wheel.appendChild(leftGrip);
        this.wheel.appendChild(rightGrip);
        this.wheel.appendChild(ledRow);
        this.wheel.appendChild(hub);

        // Acceleration and brake buttons
        const accelerateBtn = document.createElement('div');
        accelerateBtn.id = 'accelerate-btn';
        accelerateBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(145deg, #2d5a2d, #1a3a1a);
            border: 3px solid #4a7c4a;
            display: none;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-family: 'Orbitron', Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            user-select: none;
            touch-action: none;
            z-index: 10000;
            box-shadow: 
                inset 0 2px 4px rgba(255, 255, 255, 0.1),
                0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        accelerateBtn.textContent = 'GAS';

        const brakeBtn = document.createElement('div');
        brakeBtn.id = 'brake-btn';
        brakeBtn.style.cssText = `
            position: fixed;
            bottom: 110px;
            right: 20px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(145deg, #5a2d2d, #3a1a1a);
            border: 3px solid #7c4a4a;
            display: none;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-family: 'Orbitron', Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            user-select: none;
            touch-action: none;
            z-index: 10000;
            box-shadow: 
                inset 0 2px 4px rgba(255, 255, 255, 0.1),
                0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        brakeBtn.textContent = 'BRAKE';

        this.container.appendChild(this.wheel);
        this.container.appendChild(accelerateBtn);
        this.container.appendChild(brakeBtn);
        this.accelerateBtn = accelerateBtn;
        this.brakeBtn = brakeBtn;
    }

    setupEventListeners() {
        // Touch/mouse events for wheel rotation
        this.wheel.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.wheel.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.wheel.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.wheel.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
        this.wheel.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Acceleration and brake button events
        this.accelerateBtn.addEventListener('touchstart', this.handleAccelerateStart.bind(this), { passive: false });
        this.accelerateBtn.addEventListener('touchend', this.handleAccelerateEnd.bind(this), { passive: false });
        this.accelerateBtn.addEventListener('touchcancel', this.handleAccelerateEnd.bind(this), { passive: false });
        this.accelerateBtn.addEventListener('mousedown', this.handleAccelerateStart.bind(this));
        this.accelerateBtn.addEventListener('mouseup', this.handleAccelerateEnd.bind(this));

        this.brakeBtn.addEventListener('touchstart', this.handleBrakeStart.bind(this), { passive: false });
        this.brakeBtn.addEventListener('touchend', this.handleBrakeEnd.bind(this), { passive: false });
        this.brakeBtn.addEventListener('touchcancel', this.handleBrakeEnd.bind(this), { passive: false });
        this.brakeBtn.addEventListener('mousedown', this.handleBrakeStart.bind(this));
        this.brakeBtn.addEventListener('mouseup', this.handleBrakeEnd.bind(this));

        // Prevent context menu on long press
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the touch that's on the wheel
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Check if the touch is on the wheel or any of its children
            if (element && (element === this.wheel || this.wheel.contains(element) || 
                element.closest('#f1-steering-wheel'))) {
                this.activeTouchId = touch.identifier;
                this.startInteraction(touch.clientX, touch.clientY);
                break;
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isActive || this.activeTouchId === null) return;
        
        // Find the touch with the active ID
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.identifier === this.activeTouchId) {
                this.updateRotation(touch.clientX, touch.clientY);
                break;
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if our active touch ended
        let touchStillActive = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.activeTouchId) {
                touchStillActive = true;
                break;
            }
        }
        
        if (!touchStillActive) {
            this.activeTouchId = null;
            this.endInteraction();
        }
    }

    handleTouchCancel(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.activeTouchId = null;
        this.endInteraction();
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.startInteraction(e.clientX, e.clientY);
    }

    handleMouseMove(e) {
        if (!this.isActive) return;
        this.updateRotation(e.clientX, e.clientY);
    }

    handleMouseUp(e) {
        this.endInteraction();
    }

    startInteraction(clientX, clientY) {
        const rect = this.wheel.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        this.isActive = true;
        this.lastPointerAngle = this.getPointerAngle(clientX, clientY);
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
            this.resetTimeout = null;
        }
    }

    updateRotation(clientX, clientY) {
        const pointerAngle = this.getPointerAngle(clientX, clientY);
        let delta = pointerAngle - this.lastPointerAngle;
        
        // Normalize delta to [-180, 180] - simplified calculation
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        
        this.currentAngle += delta;
        // Clamp angle
        this.currentAngle = Math.max(-this.maxAngle, Math.min(this.maxAngle, this.currentAngle));
        this.lastPointerAngle = pointerAngle;
        
        // Update wheel visual rotation
        this.wheel.style.transform = `rotate(${this.currentAngle}deg)`;
        
        // Continuous steering calculation with smoothing
        const rawSteeringValue = (this.currentAngle / this.maxAngle) * this.steeringSensitivity;
        this.steeringValue = Math.max(-1, Math.min(1, rawSteeringValue));
        
        // Apply smoothing to reduce stepwise feeling
        this.smoothedSteeringValue = this.smoothedSteeringValue * (1 - this.steeringSmoothingFactor) + 
                                    this.steeringValue * this.steeringSmoothingFactor;
        
        // Only call callback if smoothed steering value actually changed
        if (Math.abs(this.smoothedSteeringValue - this.lastSteeringValue) > 0.01) {
            this.lastSteeringValue = this.smoothedSteeringValue;
            if (this.onSteeringChange) {
                this.onSteeringChange(this.smoothedSteeringValue);
            }
        }
    }

    endInteraction() {
        this.isActive = false;
        // Animate back to center with continuous steering
        const start = this.currentAngle;
        const duration = 250; // ms
        const startTime = performance.now();
        const animateBack = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            this.currentAngle = start * (1 - t);
            this.wheel.style.transform = `rotate(${this.currentAngle}deg)`;
            
            // Continuous steering during reset with smoothing
            const rawSteeringValue = (this.currentAngle / this.maxAngle) * this.steeringSensitivity;
            this.steeringValue = Math.max(-1, Math.min(1, rawSteeringValue));
            
            // Apply smoothing during reset
            this.smoothedSteeringValue = this.smoothedSteeringValue * (1 - this.steeringSmoothingFactor) + 
                                        this.steeringValue * this.steeringSmoothingFactor;
            
            if (this.onSteeringChange) {
                this.onSteeringChange(this.smoothedSteeringValue);
            }
            
            if (t < 1) {
                this.resetTimeout = requestAnimationFrame(animateBack);
            } else {
                this.currentAngle = 0;
                this.steeringValue = 0;
                this.smoothedSteeringValue = 0;
                this.lastSteeringValue = 0;
                if (this.onSteeringChange) {
                    this.onSteeringChange(0);
                }
            }
        };
        animateBack(performance.now());
    }

    getPointerAngle(clientX, clientY) {
        // Simplified angle calculation - no need for atan2 for step-based steering
        const dx = clientX - this.centerX;
        const dy = clientY - this.centerY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    handleAccelerateStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Track the touch ID for this button
        if (e.touches && e.touches.length > 0) {
            this.accelerateTouchId = e.touches[0].identifier;
        }
        
        this.accelerateBtn.style.background = 'linear-gradient(145deg, #3d7a3d, #2a5a2a)';
        this.accelerateBtn.style.transform = 'scale(0.95)';
        if (this.onAccelerateChange) {
            this.onAccelerateChange(1);
        }
    }

    handleAccelerateEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Clear the touch ID
        this.accelerateTouchId = null;
        
        this.accelerateBtn.style.background = 'linear-gradient(145deg, #2d5a2d, #1a3a1a)';
        this.accelerateBtn.style.transform = 'scale(1)';
        if (this.onAccelerateChange) {
            this.onAccelerateChange(0);
        }
    }

    handleBrakeStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Track the touch ID for this button
        if (e.touches && e.touches.length > 0) {
            this.brakeTouchId = e.touches[0].identifier;
        }
        
        this.brakeBtn.style.background = 'linear-gradient(145deg, #7a3d3d, #5a2a2a)';
        this.brakeBtn.style.transform = 'scale(0.95)';
        if (this.onBrakeChange) {
            this.onBrakeChange(1);
        }
    }

    handleBrakeEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Clear the touch ID
        this.brakeTouchId = null;
        
        this.brakeBtn.style.background = 'linear-gradient(145deg, #5a2d2d, #3a1a1a)';
        this.brakeBtn.style.transform = 'scale(1)';
        if (this.onBrakeChange) {
            this.onBrakeChange(0);
        }
    }

    show() {
        if (this.container && !document.body.contains(this.container)) {
            document.body.appendChild(this.container);
        }
        this.container.style.display = 'block';
        this.accelerateBtn.style.display = 'flex';
        this.brakeBtn.style.display = 'flex';
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        this.accelerateBtn.style.display = 'none';
        this.brakeBtn.style.display = 'none';
    }

    setCallbacks(onSteeringChange, onAccelerateChange, onBrakeChange) {
        this.onSteeringChange = onSteeringChange;
        this.onAccelerateChange = onAccelerateChange;
        this.onBrakeChange = onBrakeChange;
    }

    setSteeringSensitivity(sensitivity) {
        this.steeringSensitivity = sensitivity;
    }

    getSteeringSensitivity() {
        return this.steeringSensitivity;
    }

    setSteeringSmoothingFactor(factor) {
        this.steeringSmoothingFactor = Math.max(0.1, Math.min(1.0, factor));
    }

    getSteeringSmoothingFactor() {
        return this.steeringSmoothingFactor;
    }



    getSteeringValue() {
        return this.steeringValue;
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.resetTimeout) {
            cancelAnimationFrame(this.resetTimeout);
            this.resetTimeout = null;
        }
        // Reset all touch states
        this.activeTouchId = null;
        this.accelerateTouchId = null;
        this.brakeTouchId = null;
        this.isActive = false;
    }

    /**
     * Resets all touch states (useful for handling unexpected touch events)
     */
    resetTouchStates() {
        this.activeTouchId = null;
        this.accelerateTouchId = null;
        this.brakeTouchId = null;
        this.isActive = false;
        
        // Reset button states
        if (this.accelerateBtn) {
            this.accelerateBtn.style.background = 'linear-gradient(145deg, #2d5a2d, #1a3a1a)';
            this.accelerateBtn.style.transform = 'scale(1)';
        }
        if (this.brakeBtn) {
            this.brakeBtn.style.background = 'linear-gradient(145deg, #5a2d2d, #3a1a1a)';
            this.brakeBtn.style.transform = 'scale(1)';
        }
    }
} 