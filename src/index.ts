import {
  type AssetManifest,
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  PanelUI,
  PointLight,
  ReferenceSpaceType,
  SessionMode,
  SpotLight,
  World,
} from "@iwsdk/core";

import { DashboardControl } from "./components/dashboard-control.js";
import { SubRoot, SubState } from "./components/sub-state.js";
import { createCockpit } from "./cockpit/cockpit.js";
import { createDashboardControls } from "./cockpit/controls.js";
import { REEF_FLOOR_DIAMETER_M } from "./environment/constants.js";
import { createReefFloor } from "./environment/reef.js";
import { createSurfaceCanvasTexture } from "./environment/surface-texture.js";
import {
  applyReefFog,
  createGodRays,
  setupUnderwaterEnvironment,
} from "./environment/water.js";
import { BubbleParticleSystem } from "./systems/bubbles.js";
import { DashboardControlSystem } from "./systems/dashboard-control.js";
import { DepthHudSystem } from "./systems/hud.js";
import { SubCruiseSystem } from "./sub/cruise.js";
import { SubDriveSystem } from "./sub/drive.js";
import { SpotlightSystem } from "./sub/lights.js";

const assets: AssetManifest = {};

World.create(document.getElementById("scene-container") as HTMLDivElement, {
  assets,
  render: {
    fov: 65,
    near: 0.1,
    far: 250,
    defaultLighting: false,
    camera: {
      position: [0, 1.2, 0.05],
      lookAt: [0, -1.5, -12],
    },
  },
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    referenceSpace: ReferenceSpaceType.Local,
    offer: "always",
    features: { handTracking: true, layers: true },
  },
  features: {
    locomotion: false,
    grabbing: true,
    physics: false,
    sceneUnderstanding: false,
    environmentRaycast: false,
  },
}).then((world) => {
  world
    .registerComponent(SubRoot)
    .registerComponent(SubState)
    .registerComponent(DashboardControl);
  world
    .registerSystem(DashboardControlSystem, { priority: 0 })
    .registerSystem(SubDriveSystem, { priority: 0 })
    .registerSystem(SubCruiseSystem, { priority: 1 })
    .registerSystem(DepthHudSystem, { priority: 5 })
    .registerSystem(SpotlightSystem, { priority: 20 })
    .registerSystem(BubbleParticleSystem, { priority: 30 });

  setupUnderwaterEnvironment(world);

  const { camera, player, scene } = world;
  player.position.set(0, 0, 0);
  camera.position.set(0, 1.2, 0.05);
  camera.lookAt(0, -1.5, -12);
  scene.background = new Color(0x001a2a);
  applyReefFog(scene, 0);

  const subRootGroup = new Group();
  subRootGroup.name = "SubRoot";
  // SubRoot starts at origin — it moves to simulate the sub travelling through the world.
  // The cockpit (and player) stay fixed; only reef/world content is parented here.

  const subRootEntity = world.createTransformEntity(subRootGroup, {
    parent: world.sceneEntity,
    persistent: true,
  });
  subRootEntity.addComponent(SubRoot);
  subRootEntity.addComponent(SubState, {
    depthMeters: 0,
    spotlightOn: false,
  });

  // Cockpit is fixed around the player — NOT a child of SubRoot.
  const surfaceTexture = createSurfaceCanvasTexture();
  const { group: cockpit, dashGroup } = createCockpit(surfaceTexture);
  const cockpitEntity = world.createTransformEntity(cockpit, {
    parent: world.sceneEntity,
    persistent: true,
  });
  createDashboardControls(world, cockpitEntity, dashGroup);

  const hudAnchor = new Group();
  hudAnchor.position.set(-0.15, 0.72, -0.92);
  hudAnchor.rotation.set(-0.2, 0, 0);
  dashGroup.add(hudAnchor);
  const hudEntity = world.createTransformEntity(hudAnchor, {
    parent: cockpitEntity,
  });
  hudEntity.addComponent(PanelUI, {
    config: "./ui/hud.json",
    maxWidth: 0.18,
    maxHeight: 0.06,
  });

  const reefContent = new Group();
  reefContent.name = "ReefContent";
  const reefContentEntity = world.createTransformEntity(reefContent, {
    parent: subRootEntity,
  });

  const reef = createReefFloor(REEF_FLOOR_DIAMETER_M);
  world.createTransformEntity(reef, { parent: reefContentEntity });

  const godRays = createGodRays();
  world.createTransformEntity(godRays, { parent: reefContentEntity });

  const ambient = new AmbientLight(0x001a2a, 0.45);
  subRootGroup.add(ambient);

  const sun = new DirectionalLight(0x4488bb, 1.6);
  sun.position.set(3, 18, -8);
  subRootGroup.add(sun);

  // Exterior spotlight travels with the reef-world (SubRoot) to illuminate the scene ahead.
  const spotlight = new SpotLight(0xffffcc, 0, 30, Math.PI / 5, 0.4);
  spotlight.position.set(0, 0.5, -2.5);
  spotlight.target.position.set(0, -2, -20);
  subRootGroup.add(spotlight);
  subRootGroup.add(spotlight.target);
  world.globals.subSpotlight = spotlight;

  // Interior cockpit glow is fixed with the cockpit, not the moving world.
  const glow = new PointLight(0xff8844, 0.35, 4);
  glow.position.set(0, 0.9, -0.8);
  cockpit.add(glow);

  document.title = "Submarine Simulator";
  console.log(
    "[submarine] Phase 5 — dashboard grabbables, periscope surface, depth HUD. Grab levers or use thumbsticks.",
  );
});
