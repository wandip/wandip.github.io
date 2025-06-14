# F1 Racing Game

A 3D Formula 1 racing game built with Three.js that features realistic car physics, dynamic camera controls, and a procedurally generated track.

## Project Structure

```
src/
├── core/
│   ├── Game.js           # Main game class that orchestrates all components
│   ├── Scene.js          # Scene setup and management
│   └── Camera.js         # Camera controls and view management
├── physics/
│   ├── CarPhysics.js     # Car movement and physics calculations
│   └── WheelPhysics.js   # Wheel-specific physics and steering
├── models/
│   ├── Car.js            # Car model and components
│   ├── Wheel.js          # Wheel model and behavior
│   └── Road.js           # Road generation and management
├── utils/
│   ├── Controls.js       # Input handling and key management
│   └── Constants.js      # Game constants and configuration
└── index.js             # Entry point
```

## Features

- Realistic car physics with acceleration, deceleration, and steering
- Dynamic camera system with multiple views (behind car and top-down)
- Procedurally generated track with proper road markings
- Smooth car controls with realistic wheel turning
- Responsive design that adapts to window resizing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm start
```

## Controls

- Arrow Up: Accelerate
- Arrow Down: Brake/Reverse
- Arrow Left/Right: Steer
- C: Toggle camera view (behind car/top-down)

## Technical Details

The game is built using:
- Three.js for 3D rendering
- ES6+ JavaScript
- Modular architecture for better maintainability

Each component is designed to be independent and reusable, following SOLID principles. 