import {
  Color,
  ConeGeometry,
  DoubleSide,
  DomeGradient,
  FogExp2,
  Group,
  IBLGradient,
  Mesh,
  MeshBasicMaterial,
  Scene,
  type World,
} from "@iwsdk/core";

import { REEF_PLAY_RADIUS_M } from "./constants.js";

const UNDERWATER_SKY: [number, number, number, number] = [0.02, 0.08, 0.14, 1];
const UNDERWATER_EQUATOR: [number, number, number, number] = [
  0.03, 0.12, 0.2, 1,
];
const UNDERWATER_GROUND: [number, number, number, number] = [
  0.01, 0.05, 0.1, 1,
];

function applyUnderwaterGradients(root: NonNullable<World["activeLevel"]>["value"]): void {
  if (!root || root.hasComponent(DomeGradient)) {
    return;
  }
  root.addComponent(DomeGradient, {
    sky: UNDERWATER_SKY,
    equator: UNDERWATER_EQUATOR,
    ground: UNDERWATER_GROUND,
    intensity: 0.9,
  });
  root.addComponent(IBLGradient, {
    sky: [0.05, 0.2, 0.32, 1],
    equator: [0.04, 0.16, 0.26, 1],
    ground: [0.02, 0.08, 0.12, 1],
    intensity: 0.75,
  });
}

/** Attach underwater dome + IBL to the active level root (must be level root per IWSDK). */
export function setupUnderwaterEnvironment(world: World): void {
  applyUnderwaterGradients(world.activeLevel.value);
  if (world.activeLevel) {
    world.activeLevel.subscribe((level) => {
      applyUnderwaterGradients(level);
    });
  }
}

export function applyReefFog(
  scene: Scene,
  distanceFromCenter: number,
  reefRadius = REEF_PLAY_RADIUS_M,
): void {
  const baseDensity = 0.022;
  const edge = reefRadius * 0.85;
  const falloffSpan = Math.max(reefRadius - edge, 1);
  const t = Math.max(0, (distanceFromCenter - edge) / falloffSpan);
  const density = baseDensity + t * 0.045;
  scene.fog = new FogExp2(new Color(0x001a2a), density);
}

/** Simple god-ray quads above the reef. */
export function createGodRays(): Group {
  const rays = new Group();
  rays.name = "GodRays";

  const rayMat = new MeshBasicMaterial({
    color: 0xaaccff,
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    side: DoubleSide,
  });

  const offsets: [number, number, number, number][] = [
    [-8, 14, -18, 0.15],
    [4, 16, -22, 0.12],
    [0, 18, -14, 0.18],
    [-12, 12, -25, 0.1],
    [10, 15, -20, 0.11],
  ];

  for (const [x, y, z, scale] of offsets) {
    const cone = new Mesh(new ConeGeometry(3 * scale, 22, 8, 1, true), rayMat);
    cone.position.set(x, y, z);
    cone.rotation.x = Math.PI;
    rays.add(cone);
  }

  return rays;
}
