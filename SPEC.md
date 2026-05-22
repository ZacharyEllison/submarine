# Submarine Simulator — Spec

> A sitting VR experience: you're in a small sub exploring a coral reef.

## 1. Core Concept

- **Genre**: Ambient exploration / relaxation
- **Platform**: WebXR (sitting) — Meta Quest 2/3/3S primary
- **Engine**: Immersive Web SDK (IWSDK) — ECS architecture, TypeScript, Vite
- **Perspective**: Inside a mini-sub cockpit, looking out through a viewport window

## 2. Player Experience

### What happens

1. User enters VR → they're sitting in the sub cockpit
2. The user **drives the sub** through the reef using **controllers or hands** (grab levers/wheel)
3. Optional **autopilot cruise** follows a gentle path through the reef (toggle on dashboard)
4. Player looks around: marine life swims past the viewport
5. Dashboard has interactive controls (see §3)
6. Movement feels underwater — slow, with inertia and drag

### Driving modes

| Mode | Input | Behavior |
| ---- | ----- | -------- |
| **Manual** (default) | Throttle, steering wheel, depth lever | Player sets thrust, heading, depth; damped velocity on `SubRoot` |
| **Autopilot cruise** | Dashboard toggle | `SubCruiseSystem` moves `SubRoot` along a authored path; manual controls override or pause cruise |

### Seating & movement model

- **Sitting VR** (`immersive-vr`, `referenceSpaceType: 'local'` — validate on Quest)
- Player **does not** use IWSDK locomotion; `world.player` stays at the seat
- The **sub** moves: all reef/cockpit/exterior content is parented under a **`SubRoot`** entity whose transform is driven by systems
- Head tracking only for view; **arms/hands** reach dashboard grabbables

### Input

- **Hand tracking**: enabled (`handTracking: true`) — same `OneHandGrabbable` / `Interactable` flow as controllers (cheap win with grabbing already on)
- **Controllers**: thumbsticks can supplement or backup drive if levers are not grabbed (configurable in `SubDriveSystem`)

## 3. Cockpit

### Viewport

- Large circular window looking out at the reef
- Realistic water visibility (murkiness, light rays)
- Bubble particles rising past the window

### Periscope (v1)

- Small periscope window on the hull
- **v1 implementation**: static **surface image** (texture on periscope glass mesh) — no extra camera or render target
- Asset: e.g. `public/textures/surface-view.jpg` (CC0 sky/ocean photo)
- v2+ (optional): live render or dome swap

### Dashboard Controls (interactive)

| Control | Action |
| ------- | ------ |
| **Throttle** | Forward/backward — grab lever |
| **Steering wheel** | Turn left/right — grab and rotate |
| **Depth lever** | Up/down — grab and translate |
| **Spotlight toggle** | External sub light on/off |
| **Autopilot toggle** | Enable/disable cruise along reef path |
| **Depth gauge** | Readout bound to `SubState.depthMeters` (PanelUI or 3D) |
| **Periscope** | Shows surface image (see above) |
| **Speaker/hailer** | One-shot sound |

### Cockpit details

- Dim interior lighting (dashboard glow)
- Engine hum, occasional sonar, warning light flicker (Phase 6)

## 4. Reef Environment

### Layout

- **Play zone radius**: **50 m** from start (centered on spawn)
- Soft boundary: fog density increases + optional position clamp on `SubRoot`
- POIs: coral gardens, cave entrance, etc. (authored inside the 50 m disc)
- Boundaries are invisible — deep water fog discourages leaving the zone

### Marine life

- Fish schools (flocking), occasional turtles/rays, coral/seaweed, rare sightings

### Atmosphere

- Underwater fog/haze, god rays (cheap quads or simple cones), bubbles, muffled audio

## 5. Technical Architecture (IWSDK)

### World configuration

```typescript
World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    referenceSpace: ReferenceSpaceType.Local,
    offer: 'always',
    features: { handTracking: true, layers: true },
  },
  features: {
    locomotion: false,   // seated — SubRoot moves, not the player
    grabbing: true,      // dashboard + hand tracking
    physics: false,      // v1: kinematic SubRoot; revisit for reef collision
    sceneUnderstanding: false,
  },
});
```

On `VisibilityState.Visible`: request **72 FPS** and foveation on Quest.

### Entity hierarchy

```
world.player (fixed at seat)
  └── world.camera (head)
SubRoot (moves — thrust, steer, depth, cruise path)
  ├── Cockpit (interior, dashboard, periscope)
  ├── Exterior (spotlight rig)
  └── ReefContent (floor, coral, fish containers)
```

### Tunable parameters (adjustable without code changes)

Expose via `SubDriveSystem` / `SubCruiseSystem` **config** (IWSDK signals) or `world.globals`:

| Parameter | Default (starting point) | Notes |
| --------- | ------------------------ | ----- |
| `maxSpeed` | 2.0 m/s | Forward/back cap |
| `maxDepth` / `minDepth` | +15 m / −5 m relative to surface baseline | Depth lever limits |
| `drag` | 0.85 | Per-frame velocity damping |
| `reefRadius` | 50 m | Clamp / fog falloff |
| `cruiseSpeed` | 1.0 m/s | Autopilot |

Tune in dev with ECS debug or a debug PanelUI later.

### Project structure (target)

```
submarine/
├── src/
│   ├── index.ts
│   ├── cockpit/
│   │   ├── cockpit.ts
│   │   └── controls.ts
│   ├── components/
│   │   ├── sub-state.ts      # SubState, DashboardControl, DriveMode
│   │   └── fish.ts           # Fish, FishSchool tags
│   ├── environment/
│   │   ├── reef.ts
│   │   └── water.ts
│   ├── marine/
│   │   ├── fish.ts
│   │   └── creatures.ts
│   ├── sub/
│   │   ├── drive.ts          # SubDriveSystem — manual input
│   │   ├── cruise.ts         # SubCruiseSystem — autopilot path
│   │   └── lights.ts         # SpotlightSystem
│   └── systems/
│       ├── dashboard-control.ts
│       ├── flocking.ts
│       ├── bubbles.ts
│       └── sonar-ambience.ts
├── ui/
│   └── hud.uikitml           # Depth gauge (+ optional debug tuning)
├── public/
│   ├── textures/
│   │   └── surface-view.jpg  # Periscope v1
│   ├── gltf/ …
│   └── audio/ …
```

**Cleanup:** Remove starter-only files (`robot.ts`, `panel.ts`, `welcome.uikitml`, desk/plant GLTFs) when implementing structure.

### Components (custom)

| Component | Purpose |
| --------- | ------- |
| `SubState` | `throttle`, `steering`, `depth`, `velocity`, `depthMeters`, `spotlightOn`, `driveMode` (`manual` \| `cruise`) |
| `DashboardControl` | `type`: throttle, wheel, depth, spotlight, hailer, autopilot |
| `Fish` / `FishSchool` | Marine life tags |

### Systems (custom — do not shadow IWSDK built-ins)

| System | Priority | Responsibility |
| ------ | -------- | -------------- |
| `SubDriveSystem` | 0 | Manual input → `SubState` → `SubRoot` transform |
| `SubCruiseSystem` | 1 | When `driveMode === cruise`, advance along path; yield to manual override |
| `DashboardControlSystem` | 0 | Grabbable levers/buttons → `SubState` |
| `SpotlightSystem` | 20 | Sync spotlight intensity to `spotlightOn` |
| `FlockingSystem` | 10 | Fish schools |
| `CreatureSystem` | 10 | Rare large creatures |
| `BubbleParticleSystem` | 30 | Viewport bubbles |
| `SonarAmbienceSystem` | 35 | Timed sonar one-shots |

Built-in IWSDK **AudioSystem** handles `AudioSource` playback; use `AudioUtils.play` from custom systems.

### Dashboard interaction pattern

Each control entity: `Interactable` + `OneHandGrabbable` (rotation/translation limits per control type) + `DashboardControl`. Works with **controllers and hand tracking** without a separate code path.

## 6. 3D Assets

- **Cockpit**: Procedural (current `cockpit.ts`)
- **Periscope v1**: `public/textures/surface-view.jpg`
- **Reef**: Primitives + free GLTF coral/fish as needed
- **Audio**: CC0 — `engine-hum`, `sonar-ping`, `underwater`, `hailer`

Sources: Kenney, Sketchfab (license), Poly Haven, NASA/NOAA imagery.

## 7. Development Phases

### Phase 1: Skeleton

- [x] Scaffold IWSDK project
- [x] Cockpit placeholder (procedural)
- [x] Basic lighting + fog
- [x] Sitting XR config (`referenceSpace: local`, `handTracking: true`)
- [x] `SubRoot` entity; parent cockpit + reef
- [x] Placeholder reef plane visible through viewport
- [x] Register `SubDriveSystem` (manual motion + tunable config)

### Phase 2: Environment

- [x] Reef floor inside **50 m** radius
- [x] Level-root underwater `DomeGradient` / `IBLGradient`
- [x] Fog tuned for edge falloff at `reefRadius`
- [x] Light rays + `BubbleParticleSystem`

### Phase 3: Marine Life

- [x] Fish spawn + `FlockingSystem`
- [x] `CreatureSystem` pass-bys

### Phase 4: Sub Driving

- [x] Manual: levers + optional thumbstick → damped `SubRoot` motion
- [x] Config: `maxSpeed`, depth limits, `drag`, `reefRadius` (adjustable)
- [x] Gentle bob/tilt on `SubRoot`
- [x] **Autopilot**: simple closed path + dashboard toggle (`SubCruiseSystem`; dev toggle: keyboard **C** until Phase 5 dashboard)

### Phase 5: Interactions

- [x] All dashboard grabbables (incl. autopilot, spotlight, hailer)
- [x] Periscope **surface image** on glass
- [x] `hud.uikitml` depth gauge
- [ ] Hand-tracking grab verified on Quest / IWER

### Phase 6: Polish

- [x] Spatial audio (engine, sonar, underwater bed)
- [x] Warning lights, atmosphere pass
- [ ] Quest 72 FPS + IWER + device test

**Atmosphere pass (implemented):**

- `DomeGradient` / fog / god rays / bubbles from Phase 2 provide murky underwater feel
- Spatial audio bed: non-positional `underwaterBed` + positional `engineHum` on cockpit anchor
- Timed `sonarPing` one-shots via `SonarAmbienceSystem` (10–22 s random interval)
- Red dashboard `WarningLight` emissive flicker via `WarningLightsSystem`
- Audio placeholders use `public/audio/chime.mp3` until CC0 assets (`engine-hum`, `sonar-ping`, `underwater`) land

**Quest 72 FPS:** `SubDriveSystem.init()` requests `updateTargetFrameRate(72)` and foveation on `VisibilityState.Visible` — verify on device / IWER.

## 8. Decisions Made

| # | Topic | Decision |
| - | ----- | -------- |
| 1 | Cockpit | Procedural geometry |
| 2 | Reef size | **50 m** play radius at start; fog + soft clamp |
| 3 | Audio | Free CC0 assets |
| 4 | Camera / photo | **Skip** v1 |
| 5 | Periscope v1 | **Static surface image** on periscope glass (fastest) |
| 6 | Target headset | Quest 2 / 3 / 3S |
| 7 | Driving | Manual levers + optional sticks; **autopilot cruise** as toggle |
| 8 | Locomotion | **Off** — move `SubRoot`, not `world.player` |
| 9 | Speed / depth limits | **Adjustable** via system config / globals |
| 10 | Hand tracking | **On** — reuse grabbing for dashboard (no separate interaction stack) |
| 11 | Physics v1 | **Off** — kinematic integration; add physics later if needed |
