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
2. The sub hovers gently over a coral reef below
3. Player looks around: marine life swims past the viewport
4. Dashboard has a few interactive elements (see §3)
5. The sub drifts slowly along a path — time-based progression

### Seating

- **Sitting VR** (`immersive-vr`, sitting reference space)
- Player is stationary (no locomotion, no teleport)
- Head tracking only — look around freely

## 3. Cockpit

### Viewport

- Large circular or rectangular window looking down/out at the reef
- Realistic water visibility (murkiness, light rays)
- Bubble particles rising past the window

### Dashboard Controls (interactive)

| Control              | Action                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Spotlight toggle** | Switches an external sub light on/off, illuminating the reef |
| **Depth gauge**      | Visual readout showing current "depth" (decorative)          |
| **Periscope**        | Small periscope window showing a "surface" view (optional)   |
| **Speaker/hailer**   | Plays a sound through the sub speaker                        |
| **Camera button**    | Takes a "photo" of the current view (spatial UI snapshot)    |

### Cockpit details

- Dim interior lighting (dashboard glow)
- Ambient hum/buzz of the sub engine (spatial audio)
- Sonar pings occasionally (audio)
- Warning lights flicker for atmosphere

## 4. Reef Environment

### Layout

- **Guided path**: The sub follows a slow, gentle route over the reef
- Duration: ~5-10 minute loop before repeating
- The reef changes gradually (different coral types, fish schools, etc.)

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
| `DriftSystem`    | Moves the sub along a gentle path over time        |
| `FlockingSystem` | Fish flocking AI (separation, alignment, cohesion) |
| `ControlSystem`  | Dashboard button presses, spotlight toggle         |
| `ParticleSystem` | Bubbles rising, dust motes in water                |
| `AudioSystem`    | Ambient audio, spatial sonar pings                 |
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

### Phase 4: Sub Movement

- [ ] Slow drift path (time-based camera/sub movement)
- [ ] Gentle bob/tilt animation

### Phase 5: Interactions

- [ ] Dashboard controls (grab/press buttons)
- [ ] Spotlight toggle
- [ ] Camera/photo feature
- [ ] Depth gauge UI

### Phase 6: Polish

- [ ] Spatial audio (engine hum, sonar, water)
- [ ] Dashboard glow lighting
- [ ] Atmosphere tuning
- [ ] Testing in IWER + on headset

## 8. Open Questions

1. **Cockpit model**: Do you have a 3D model, or should we build one procedurally?
2. **Reef scope**: How large/diverse should the reef be? (small loop vs. expansive)
3. **Audio**: Do you have sound assets, or should we source generative/free audio?
4. **Camera feature**: Is the "take a photo" feature important, or skip for now?
5. **Periscope**: Include or leave out?
