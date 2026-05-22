import {
  type AssetManifest,
  SessionMode,
  World,
} from "@iwsdk/core";

import { createCockpit } from "./cockpit.js";
import {
  AmbientLight,
  DirectionalLight,
  PointLight,
  SpotLight,
  FogExp2,
  Color,
} from "three";

const assets: AssetManifest = {};

World.create(document.getElementById("scene-container") as HTMLDivElement, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: "always",
    features: { handTracking: false, layers: true },
  },
  features: {
    locomotion: false,
    grabbing: true,
    physics: false,
    sceneUnderstanding: false,
    environmentRaycast: false,
  },
}).then((world) => {
  const { camera } = world;

  // Sitting VR — player seated at origin
  camera.position.set(0, 1.2, 0);

  const cockpit = createCockpit();
  world.createTransformEntity(cockpit);

  // --- Fog: underwater haze ---
  world.scene.fog = new FogExp2(new Color(0x001a2a), 0.04);

  // --- Ambient: deep blue-green wash ---
  const ambient = new AmbientLight(0x001a2a, 0.6);
  world.scene.add(ambient);

  // --- Sunlight from surface ---
  const sun = new DirectionalLight(0x2266aa, 1.2);
  sun.position.set(5, 20, -10);
  world.scene.add(sun);

  // --- Sub spotlight: external beam (initially off) ---
  const spotlight = new SpotLight(0xffffcc, 0, 30, Math.PI / 5, 0.4);
  spotlight.position.set(0, 0.5, -2.5);
  spotlight.target.position.set(0, -2, -20);
  world.scene.add(spotlight);
  world.scene.add(spotlight.target);

  // --- Cockpit interior glow ---
  const glow = new PointLight(0xff8844, 0.4, 4);
  glow.position.set(0, 0.9, -0.8);
  world.scene.add(glow);

  console.log("Submarine Simulator — sitting VR ready");
});
