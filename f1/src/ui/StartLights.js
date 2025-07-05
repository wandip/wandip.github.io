import * as THREE from 'three';

export class StartLights {
    constructor(scene, camera, onRaceStart) {
        this.scene = scene;
        this.camera = camera;
        this.onRaceStart = onRaceStart;
        this.lights = [];
        this.group = new THREE.Group();
        this.createLights();
        this.scene.add(this.group);
        this.isAnimating = false;
        
        // Initialize audio components
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        this.beepSound = new THREE.Audio(this.audioListener);
        this.audioLoader = new THREE.AudioLoader();
        this.audioInitialized = false;
        this.audioBuffer = null;
        
        // Pre-load the audio file
        this.audioLoadPromise = this.loadAudioFile();
        
        // Create start message
        this.createStartMessage();
        
        // Add click event listener to initialize audio
        this.setupAudioInitialization();
    }

    createStartMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.color = 'white';
        messageDiv.style.fontSize = '24px';
        messageDiv.style.fontFamily = 'Arial, sans-serif';
        messageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        messageDiv.style.zIndex = '1000';
        // messageDiv.textContent = 'Press Start Race to begin';
        // Add Start Race button
        const startBtn = document.createElement('button');
        startBtn.textContent = 'Start Race';
        startBtn.style.display = 'block';
        startBtn.style.margin = '30px auto 0 auto';
        startBtn.style.padding = '16px 40px';
        startBtn.style.fontSize = '26px';
        startBtn.style.background = '#181c20';
        startBtn.style.color = '#b2eaff';
        startBtn.style.border = '2px solid #5fa8d3';
        startBtn.style.borderRadius = '8px';
        startBtn.style.cursor = 'pointer';
        startBtn.style.fontWeight = '900';
        startBtn.style.fontFamily = "'Orbitron', 'Arial Black', Arial, sans-serif";
        startBtn.style.fontStyle = 'italic';
        startBtn.style.letterSpacing = '2px';
        startBtn.style.boxShadow = '0 2px 8px 0 #5fa8d3';
        startBtn.style.textTransform = 'uppercase';
        startBtn.style.transition = 'box-shadow 0.2s, border-color 0.2s, background 0.2s, color 0.2s';
        startBtn.style.outline = 'none';
        startBtn.onmouseenter = () => {
            startBtn.style.boxShadow = '0 4px 16px 0 #5fa8d3';
            startBtn.style.borderColor = '#b2eaff';
            startBtn.style.background = '#23272e';
            startBtn.style.color = '#b2eaff';
        };
        startBtn.onmouseleave = () => {
            startBtn.style.boxShadow = '0 2px 8px 0 #5fa8d3';
            startBtn.style.borderColor = '#5fa8d3';
            startBtn.style.background = '#181c20';
            startBtn.style.color = '#b2eaff';
        };
        messageDiv.appendChild(startBtn);
        this.startMessage = messageDiv;
        document.body.appendChild(messageDiv);
        // Attach click handler for start
        startBtn.addEventListener('click', () => {
            this.handleStartRace();
        });
    }

    setupAudioInitialization() {
        // Remove any previous listeners (if any)
        // Only start race on Start Race button click now
    }

    handleStartRace() {
        const initAudio = async () => {
            if (!this.audioInitialized) {
                await this.initializeAudio();
            }
            // Remove start message
            if (this.startMessage) {
                document.body.removeChild(this.startMessage);
                this.startMessage = null;
            }
            // Start animation
            this.animate();
        };
        initAudio();
    }

    async loadAudioFile() {
        try {
            this.audioBuffer = await new Promise((resolve, reject) => {
                this.audioLoader.load('./src/audio/f1_beep.mp3', 
                    (buffer) => resolve(buffer),
                    undefined,
                    (error) => reject(error)
                );
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async initializeAudio() {
        if (this.audioInitialized || !this.audioBuffer) return;
        
        try {
            if (this.audioListener.context.state === 'suspended') {
                await this.audioListener.context.resume();
            }
            
            this.beepSound.setBuffer(this.audioBuffer);
            this.beepSound.setVolume(1.0);
            this.audioInitialized = true;
        } catch (error) {
            // Silent fail
        }
    }

    createLights() {
        const columns = 5;
        const rows = 2;
        const spacingX = 2.2;
        const spacingY = 2.5;
        const radius = 0.8;
        const lightOffColor = 0x330000;
        const lightOnColor = 0xff0000;
        this.lights = [];
        for (let col = 0; col < columns; col++) {
            let colArr = [];
            for (let row = 0; row < rows; row++) {
                const geometry = new THREE.SphereGeometry(radius, 32, 32);
                const material = new THREE.MeshStandardMaterial({ color: lightOffColor, emissive: 0x000000 });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = (col - (columns - 1) / 2) * spacingX;
                mesh.position.y = (rows - row - 0.5) * spacingY;
                mesh.position.z = 0;
                this.group.add(mesh);
                colArr.push(mesh);
            }
            this.lights.push(colArr);
        }
        // Position the group above the car's start (assume y=12, z=-8 reasonable for top of screen)
        this.group.position.set(0, 8, 10);
    }

    async animate() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        await this.audioLoadPromise;
        await this.initializeAudio();
        
        const lightOnColor = 0xff0000;
        const lightOffColor = 0x330000;
        await this.sleep(1000);
        
        for (let col = 0; col < 5; col++) {
            this.lights[col][1].material.color.setHex(lightOnColor);
            this.lights[col][1].material.emissive.setHex(lightOnColor);
            
            if (this.audioInitialized) {
                if (this.beepSound.isPlaying) {
                    this.beepSound.stop();
                }
                try {
                    await this.beepSound.play();
                } catch (error) {
                    // Silent fail
                }
            }
            await this.sleep(1000);
        }
        
        // Wait a random time (0.2-0.7s), then turn all off
        await this.sleep(200 + Math.random() * 500);
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 2; row++) {
                this.lights[col][row].material.color.setHex(lightOffColor);
                this.lights[col][row].material.emissive.setHex(0x000000);
            }
        }
        if (this.onRaceStart) this.onRaceStart();
        this.isAnimating = false;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    remove() {
        this.scene.remove(this.group);
        if (this.startMessage) {
            document.body.removeChild(this.startMessage);
        }
    }
} 