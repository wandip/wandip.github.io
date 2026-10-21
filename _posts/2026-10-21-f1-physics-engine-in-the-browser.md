---
layout: post
title: "Building the Best Browser Game to Learn Formula 1 Physics"
tags: [f1, physics, threejs, game-dev]
type: deep-dive
description: "How I'm turning a 3D Three.js + Rapier3D browser game into an interactive F1 Race Engineer sandbox—mapping game physics 1:1 to real-world SI units, fixing suspension collapse, and cutting 1,000+ draw calls down to 92."
keywords: "Formula 1 physics, learn F1 basics, F1 browser game, Three.js racing game, Rapier3D vehicle controller, F1 race engineer simulator, tire friction, downforce"
---

If you watch Formula 1 on Sundays, you constantly hear race engineers on the radio talking about **understeer**, **front wing aero balance**, **tire thermal degradation**, **brake migration**, and **bottoming out**.

Unless you have driven a race car or spent hundreds of hours in a hardcore simulator, those words remain abstract trivia. You *hear* that soft tires have more grip than hards, or that adding rear wing costs straight-line speed, but you don't **feel** why a 2% shift in grip changes where you have to brake for Turn 1.

Hardcore sims like *iRacing* or *Assetto Corsa* require a steering wheel rig, a gaming PC, and 60 GB of downloads—and they drop you into a cockpit with fifty telemetry channels at once. Arcade games go to the opposite extreme and replace physics with scripted drift buttons.

I wanted something in between: **[a fast, zero-install 3D F1 game right in the browser](/f1/)** that is **the best place to learn F1 basics by playing both the Race Engineer and the Driver**. Tweak a single physics parameter—friction, suspension stiffness, wing angle, brake bias—drive out of the garage onto the track in the same browser tab, and immediately feel what changed.

> **Play it live:** **[Launch the F1 Browser Game →](/f1/)**  
> *(Note: This post is a **living engineering log**. As we roll out each new Race Engineer system—tire compounds, aero downforce & DRS, weight transfer, and live telemetry—we will update this article with the math, code, and lessons learned.)*

---

## 1. The Architecture: Three.js Visuals vs. Rapier3D Physics

When I first built the car in [Three.js](https://threejs.org/), I modeled the F1 chassis from geometric primitives: the Ferrari-red monocoque, tapered nose cone, cockpit and titanium halo, sidepods, front and rear wings, and four wheels with compound rings.

To make the car drive with real dynamics instead of hard-coded coordinate math, I paired Three.js with **[Rapier3D](https://rapier.rs/)** (a Rust physics engine compiled to WebAssembly) using its `DynamicRayCastVehicleController`.

### How a Raycast Vehicle Works

In real-time game physics, you almost never collide high-polygon visual meshes or spinning cylinder colliders against the ground at 300 km/h—discrete collision detection at high RPM causes wheels to jitter and catch on polygon edges. Instead, industry engines (Unity `WheelCollider`, Unreal Chaos Vehicles, Bullet, and Rapier) use a **Raycast Vehicle** model:

1. **The Chassis** is a single rigid body (`RigidBody`) with a simplified box or convex hull collider representing the car's mass (`800 kg`) and rotational inertia.
2. **The 4 Wheels** are downward rays cast from the suspension mount points (`chassisConnectionCs`) every physics step (`1 / 60 s`).
3. Each ray measures the distance to the asphalt, computes the **Hooke's law spring + damper force** to hold the car up, and applies **longitudinal (engine/brake)** and **lateral (cornering)** friction impulses at the tire contact patch.

### The Trap in My First Implementation: Intermediate Wireframe Meshes

In my initial prototype, I tried to bridge Three.js and Rapier by cloning the visual car, stripping out the wings and wheels, computing a `THREE.Box3` bounding box, and spawning an invisible `THREE.Mesh` (`physicsWireframe`) plus four invisible cylinder meshes (`wireWheel`) in the scene:

```
[Rapier RigidBody] ──► [Hidden physicsWireframe Mesh] ──► [Visual F1 Car Group]
```

On paper, this looked modular. In practice, it created three nasty bugs:

1. **The Unrotated Center-Offset Bug:** The bounding box of the F1 body wasn't centered at `(0, 0, 0)` because the nose cone extends further forward (`+4.4 m`) than the rear (`-2.25 m`), creating a local center offset of `(0, 0.35, 0.72)`. Every frame, the code subtracted that local offset in *world space* (`wireframeWorldPosition.sub(centerOffset)`) without rotating it by the car's quaternion. Whenever the car turned 180° down the back straight, the visual car drifted **1.44 meters off its own physics collider**!
2. **Suspension Collapse (Belly-Scraping):** In Rapier, I had set `SUSPENSION_STIFFNESS: 1` and `SUSPENSION_COMPRESSION: 0`. Because Rapier normalizes stiffness by mass, a stiffness of `1.0` produced an upward spring acceleration 50× weaker than gravity (`9.81 m/s²`). On frame 1, the suspension collapsed to a negative length (`-0.026 m`), and the car's box collider dropped onto the asphalt—sliding around the track on its belly like a brick.
3. **Wrong Forward Axis:** Rapier's `DynamicRayCastVehicleController` defaults `indexForwardAxis` to `0` (`+X`), whereas our Three.js F1 car points along `+Z` (`axis = 2`).

### The Fix: Direct 1:1 Pose Binding

We ripped out the intermediate `physicsWireframe` and `wireWheel` meshes completely. Instead, we attach the chassis cuboid collider to the Rapier `RigidBody` with a **local translation offset** baked directly into `ColliderDesc`:

```javascript
// Create dynamic rigid body at the car's world origin
const bodyDesc = rapier.RigidBodyDesc.dynamic()
    .setTranslation(0, 0.05, -7)
    .setLinearDamping(0.15)
    .setAngularDamping(0.5);
this.chassisBody = world.createRigidBody(bodyDesc);

// Offset the cuboid collider in local chassis space so RigidBody pose === Visual Car pose
const colliderDesc = rapier.ColliderDesc.cuboid(0.85, 0.22, 2.8)
    .setTranslation(0.0, 0.35, 0.7)
    .setMass(800)
    .setRestitution(0.1);
world.createCollider(colliderDesc, this.chassisBody);

// Create raycast vehicle controller along the +Z forward axis
this.vehicleController = world.createVehicleController(this.chassisBody);
this.vehicleController.setIndexForwardAxis = 2;
```

Now, synchronizing the Three.js visual car every frame is a zero-allocation, 1:1 copy—plus we drive the visual wheels' steering angle, rolling spin, and vertical suspension compression directly from Rapier's raycast state:

```javascript
// 1:1 chassis sync
this.visualCar.syncWithPhysics(
    this.chassisBody.translation(),
    this.chassisBody.rotation()
);

// Per-wheel steering, rolling spin, and suspension travel sync
for (let i = 0; i < 4; i++) {
    const steering = this.vehicleController.wheelSteering(i) || 0;
    const rotation = this.vehicleController.wheelRotation(i) || 0;
    const suspLen  = this.vehicleController.wheelSuspensionLength(i);
    const localY   = wheelData.connectionY - suspLen;
    this.visualCar.updateWheelFromPhysics(i, steering, rotation, localY);
}
```

With `connectionY = 0.55 m`, `suspensionRestLength = 0.20 m`, `stiffness = 35.0`, and `wheelRadius = 0.45 m`, the car settles under gravity at **`y = 0.036 m` (3.6 cm ground clearance)**—right in the real Formula 1 ride-height window—with the tires planted flush on the asphalt.

---

## 2. Mapping Game Physics 1:1 to Real-World F1 Numbers

A question I asked myself while tuning the car: **Can we map the numbers in our JavaScript physics engine 1:1 to real-world Formula 1 engineering units, or is game physics all fake magic numbers?**

The answer is **yes, there is an exact mathematical correspondence**—once you understand which parameters in Rapier3D are raw **SI units (meters, kilograms, seconds, Newtons)** and which ones inside `DynamicRayCastVehicleController` are **mass-normalized** (inherited from Bullet Physics' `btRaycastVehicle`).

### Parameters That Are Already 1:1 SI Units

| Parameter | Unit in Rapier | Our Game Value | Real F1 Car (2024–2026) | Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Dimensions** | Meters (`m`) | Width `2.0 m`, Wheelbase `4.5 m` | Width `2.0 m`, Wheelbase `3.6 m` | **1:1 SI** |
| **Gravity** | `m/s²` | `-9.81 m/s²` | `-9.81 m/s²` | **Exact 1:1** |
| **Car Mass** | Kilograms (`kg`) | `800 kg` | `798 kg` (min weight + driver) | **Exact 1:1** |
| **Velocity** | `m/s` | `speed * 3.6 = km/h` | Up to `95 m/s` (`342 km/h`) | **Exact 1:1** |
| **Engine Force** | Newtons (`N`) | `3,500 N` per wheel (`14,000 N` total) | Peak tractive force `~12,000–15,000 N` | **1:1 in Newtons** |

### The 4 Conversion Formulas for Mass-Normalized Vehicle Parameters

Rapier divides suspension and braking parameters by chassis mass internally so that changing a car's weight doesn't require retuning its springs from scratch. To expose real F1 engineering units in our setup sliders, we use four conversion equations:

#### 1. Suspension Spring Rate (`N/m`)
Rapier's `wheelSuspensionStiffness` is mass-normalized stiffness (`s⁻²`):

```
Rapier Stiffness = k_real (N/m) / M_car (kg)
```

With `M_car = 800 kg`, our `SUSPENSION_STIFFNESS = 35.0` corresponds to **`28,000 N/m` (`28 N/mm`)** per corner. A real F1 car runs ultra-stiff suspension (`~120,000 N/m`, or `stiffness = 150` in Rapier) because its aerodynamic floor must stay within millimeters of the ground without bottoming out under `1,500 kg` of downforce.

#### 2. Suspension Damping — Bump & Rebound (`N·s/m`)
Rapier's `wheelSuspensionCompression` (bump) and `wheelSuspensionRelaxation` (rebound) are also divided by chassis mass (`s⁻¹`):

```
Rapier Damping = c_real (N·s/m) / M_car (kg)
```

Our values of `4.0` (compression) and `5.0` (relaxation) on an `800 kg` chassis equal **`3,200 N·s/m` bump** and **`4,000 N·s/m` rebound**—right inside real race-car damper curves.

#### 3. Tire Coefficient of Friction (`μ`)
In physics, maximum lateral and longitudinal tire force is governed by Coulomb / Pacejka friction:

```
F_max = μ × F_normal
```

In Rapier's raycast vehicle, peak tire force is scaled by `wheelFrictionSlip × wheelSideFrictionStiffness`. When `sideFrictionStiffness = 1.0`, **`wheelFrictionSlip` is literally the tire's coefficient of friction `μ`**:

- **Wet Asphalt / Grass:** `μ ≈ 0.4 – 0.8`
- **Street Car Tire:** `μ ≈ 1.0`
- **F1 Hard Compound (C1):** `μ ≈ 1.6`
- **F1 Medium Compound (C3):** `μ ≈ 1.8`
- **F1 Soft Compound (C5):** `μ ≈ 2.0+`

*Why does an F1 car corner at 5G if `μ` is only `2.0`?* Because of **Aerodynamic Downforce** (`F_down = ½ · ρ · C_L · A · v²`). At `250 km/h`, the front and rear wings plus the underbody floor push the car down with nearly twice its own weight in air pressure—tripling `F_normal` on the tires without adding a single kilogram of mass to accelerate or brake!

#### 4. Brake Force (`N`)
Rapier's `setWheelBrake(i, brakeImpulse)` expects an **impulse per physics step (`N·s`)** rather than continuous Newtons:

```
Rapier Brake Impulse = F_brake (N) × Δt
```

---

## 3. Why Accuracy Alone Isn't Enough: Designing "Feel" in a Browser

Here is the biggest design insight from building this game: **if you put a 100% mathematically accurate F1 car into a browser and control it with a keyboard (`W/A/S/D`), you won't feel subtle setup changes—and the car will be almost impossible to drive.**

Why?
1. **Binary Inputs:** In a real F1 car, a driver modulates a 900° steering wheel by `1.5°` at `300 km/h` and feathers a load-cell brake pedal. On a keyboard, pressing `A` or `W` is an instant `0% → 100%` step function.
2. **No Vestibular or Force Feedback:** You don't have G-forces pushing your ribs or a steering column fighting your hands when the front tires start scrubbing.

To make this the **best game to learn F1 basics**, "feel" matters more than raw spreadsheet numbers. As we introduce each F1 engineering parameter, we are pairing the 1:1 physics math with **sensory browser cues**:

- **Speed-Sensitive Steering & Camera FOV:** Filtering maximum steering lock as a function of speed so keyboard taps stay at the peak of the tire slip curve, while widening camera Field-of-View (`FOV`) and adding subtle pitch/roll during heavy braking and cornering so your eyes feel weight transfer.
- **Visible & Audible Limit-of-Grip:** When you dial in too little front wing (understeer), you should *see* the nose push wide of the apex and scrub the front tires; when you dial in too much rear brake bias or aggressive throttle (oversteer), you should *see* the rear step out and leave tire marks.
- **Playable Dynamic Ranges:** Making the contrast between a **Monza Low-Drag Setup** and a **Monaco High-Downforce Setup** unmistakable within two corners.

---

## 4. Performance Engineering: Cutting 1,050+ Draw Calls Down to 92

Before adding new physics systems, we profiled why the browser renderer was working harder than it needed to. A Three.js scene slows down primarily from **draw calls** (CPU-to-GPU state switches per `THREE.Mesh` and `THREE.Material`), shadow-map render passes, and per-frame garbage collection:

1. **525 Transparent Cloud Meshes → 1 `InstancedMesh`:** Originally, 21 clouds were built from ~25 individual `SphereGeometry` meshes each, with 525 separate `transparent: true` PBR materials sorted on the CPU every frame. We replaced them with structured 5-puff stylized clouds rendered via a single `THREE.InstancedMesh`—dropping **525 transparent draw calls to 1**.
2. **Merging Road Kerbs, Start Line & Mountains:** Every 5 meters of red-and-white kerb stripe along the track previously spawned its own `TubeGeometry` and `MeshStandardMaterial`. By sharing materials and batching geometries with `mergeGeometries` (and converting 160 tree meshes into 2 `InstancedMesh` calls), total scene meshes dropped from **~1,050+ to 92**, and unique materials dropped from **~900+ to 31**.
3. **Eliminating 54 Point-Light Shadow Passes in the Garage:** The 3D Garage viewer initialized a second `WebGLRenderer` at page load with 9 shadow-casting `PointLight`s. Because each omnidirectional point light shadow map is a 6-face cubemap, that was **54 shadow render passes** sitting in GPU memory. We switched the Garage to lazy initialization on open and studio directional/hemisphere lighting.
4. **Deterministic Timestep & Zero Per-Frame Allocations:** We fixed a double `Clock.getDelta()` bug between `Game.js` and `RapierPhysics.js`, clamped the physics timestep so tab-switching never explodes suspension forces, pre-allocated reusable `THREE.Vector3` / `Quaternion` objects in the camera and physics loops, and cached the 2D minimap's static track layout onto an offscreen canvas.

---

## 5. Living Devlog & Feature Roadmap

We are building out the **F1 Race Engineer** experience one physics system at a time so each mechanic is rock-solid and immediately felt on track:

- **✅ Log 01 (Current):** Direct Rapier3D-to-Three.js raycast vehicle architecture, 1:1 SI unit mapping, suspension & steering fixes, and 10× rendering optimization (**[Play v1 Live](/f1/)**).
- **🔜 Log 02 (Next):** **Tire Compounds & Surface Grip** — Soft / Medium / Hard compounds, track-limits detection (Asphalt vs. Kerbs vs. Off-Track Grass penalty), and visual/camera slip feedback.
- **🔜 Log 03:** **Aerodynamics & DRS** — Front and Rear Wing angles, speed-squared downforce (`F_down ∝ v²`) vs. straight-line drag (`F_drag ∝ v²`), and a functional DRS zone on straights.
- **🔜 Log 04:** **Powertrain, Brake Bias & Live Race Engineer HUD** — 8-speed F1 gearbox curve, front/rear brake locking balance, sector lap timing, and an on-track Engineer Setup Drawer.

**[Take the car for a spin on track right now →](/f1/)**
