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
2. The user **drives the sub** through the reef using hand controllers
3. Player looks around: marine life swims past the viewport
4. Dashboard has interactive controls (see §3)
5. Movement feels underwater — slow, with inertia and drag

### Seating

- **Sitting VR** (`immersive-vr`, sitting reference space)
- Player sits in the real world; the sub moves virtually around them
- Head tracking only — arms reach out to drive the sub

## 3. Cockpit

### Viewport

- Large circular or rectangular window looking down/out at the reef
- Realistic water visibility (murkiness, light rays)
- Bubble particles rising past the window

### Dashboard Controls (interactive)

| Control              | Action                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Throttle**         | Forward/backward speed — grab and pull/push a lever or twist |
| **Steering wheel**   | Turn left/right — grab and rotate                            |
| **Depth lever**      | Move up/down — pull up or push down                          |
| **Spotlight toggle** | Switches an external sub light on/off, illuminating the reef |
| **Depth gauge**      | Visual readout showing current depth                         |
| **Periscope**        | Small periscope window showing a "surface" view              |
| **Speaker/hailer**   | Plays a sound through the sub speaker                        |

### Cockpit details

- Dim interior lighting (dashboard glow)
- Ambient hum/buzz of the sub engine (spatial audio)
- Sonar pings occasionally (audio)
- Warning lights flicker for atmosphere

## 4. Reef Environment

### Layout

- **Open area**: Player drives freely around a bounded reef zone
- Zone is large enough to feel expansive but bounded by "deep walls" (dark fog)
- Multiple points of interest: coral gardens, cave entrance, etc.
- Boundaries are invisible — deep water fog discourages going too far

### Marine life

- Fish schools (various colors, following flocking behavior)
- Sea turtles, rays, or other large creatures occasionally swim by
- Coral formations: brain coral, branching coral, sea fans
- Seaweed/kelp swaying
- Occasional "rare" sightings (jellyfish, octopus hiding in rocks)

### Atmosphere

- Underwater fog/haze for depth
- God rays / light shafts from above
- Bubbles rising
- Muffled underwater audio

## 5. Technical Architecture (IWSDK)

### Project setup

```
npm create @iwsdk@latest submarine
```

- VR mode, TypeScript, no Spatial Editor

### Project structure

```
submarine/
├── src/
│   ├── index.ts           # World setup, scene init, system registration
│   ├── cockpit/
│   │   ├── cockpit.ts     # Cockpit entity, dashboard components
│   │   └── controls.ts    # Interactive dashboard controls (grab/press)
│   ├── environment/
│   │   ├── reef.ts        # Reef terrain, coral entities
│   │   └── water.ts       # Water effects, fog, light rays
│   ├── marine/
│   │   ├── fish.ts        # Fish spawning, flocking system
│   │   └── creatures.ts   # Larger creatures (turtles, rays)
│   ├── sub/
│   │   ├── movement.ts    # Sub slow-drift path system
│   │   └── lights.ts      # External spotlight system
│   └── audio/
│       └── ambience.ts    # Engine hum, sonar, water sounds
├── ui/
│   └── hud.uikitml        # Spatial UI for depth gauge, camera flash
├── public/
│   ├── gltf/
│   │   ├── cockpit/       # Sub cockpit interior
│   │   ├── coral/         # Coral models
│   │   ├── fish/          # Fish models
│   │   └── creatures/     # Turtles, rays, etc.
│   ├── audio/
│   │   ├── engine-hum.mp3
│   │   ├── sonar-ping.mp3
│   │   └── underwater.mp3
│   └── textures/          # Water, fog, dashboard textures
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### Key IWSDK ECS systems

| System           | Responsibility                                     |
| ---------------- | -------------------------------------------------- |
| `SubDriveSystem` | Reads controller input → applies thrust, steering  |
| `FlockingSystem` | Fish flocking AI (separation, alignment, cohesion) |
| `ControlSystem`  | Dashboard lever/wheel/button interactions          |
| `ParticleSystem` | Bubbles rising, dust motes in water                |
| `AudioSystem`    | Ambient audio, sonar pings, hydrophone sounds      |
| `CreatureSystem` | Large creature spawn timing and pathing            |

## 6. 3D Assets

### Sourcing strategy

- **Cockpit**: Procedural geometry (cylinder/sphere interior) OR simple GLTF model
- **Coral reef**: Mix of free GLTF models + procedural placement
- **Fish**: Simple low-poly models (can be geometric primitives initially)
- **Textures**: Procedural or free CC0 textures

### Where to find free assets

- **Kenney.nl** — CC0 game assets
- **Sketchfab** — Free GLTF models (filter by license)
- **Poly Haven** — Free HDRIs, models, textures
- **NASA/NOAA** — Public domain marine imagery

## 7. Development Phases

### Phase 1: Skeleton

- [ ] Scaffold IWSDK project (`npm create @iwsdk@latest`)
- [ ] Basic sitting VR scene
- [ ] Cockpit placeholder (cylinder/sphere interior)
- [ ] Viewport window (hole in cockpit looking at reef plane)
- [ ] Basic lighting

### Phase 2: Environment

- [ ] Reef floor (plane with texture or coral models)
- [ ] Water effects (fog, haze)
- [ ] Light rays from above
- [ ] Bubble particles

### Phase 3: Marine Life

- [ ] Fish models + spawning system
- [ ] Flocking AI behavior
- [ ] Large creature encounters (turtle/ray)

### Phase 4: Sub Driving

- [ ] Controller input → sub thrust, steering, depth
- [ ] Underwater physics feel (drag, inertia, slow response)
- [ ] Gentle bob/tilt animation on movement

### Phase 5: Interactions

- [ ] Dashboard controls (grab/press buttons, levers)
- [ ] Spotlight toggle
- [ ] Depth gauge UI

### Phase 6: Polish

- [ ] Spatial audio (engine hum, sonar, water)
- [ ] Dashboard glow lighting
- [ ] Atmosphere tuning
- [ ] Testing in IWER + on headset

## 8. Decisions Made

1. **Cockpit model**: Procedural geometry (no external model needed)
2. **Reef scope**: Small open zone to start — bounded by deep fog
3. **Audio**: Source free CC0 audio assets
4. **Camera feature**: Skip in v1
5. **Periscope**: Include in v1
6. **Target headset**: Meta Quest 2/3/3S
7. **Driving**: User drives with hand controllers — throttle, steering, depth lever
