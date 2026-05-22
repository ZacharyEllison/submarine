import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
} from "@iwsdk/core";

import { REEF_FLOOR_DIAMETER_M, REEF_PLAY_RADIUS_M } from "./constants.js";

type CoralPlacement = {
  x: number;
  y: number;
  z: number;
  scale: number;
  kind: "cone" | "sphere" | "cylinder";
  color: number;
};

const CORAL_PLACEMENTS: CoralPlacement[] = [
  { x: -12, y: -5.8, z: -8, scale: 1.2, kind: "cone", color: 0xc45c3e },
  { x: 8, y: -5.7, z: -10, scale: 0.9, kind: "sphere", color: 0xe8a87c },
  { x: -5, y: -5.85, z: -14, scale: 1.5, kind: "cylinder", color: 0x6b4a8a },
  { x: 14, y: -5.75, z: -12, scale: 1.1, kind: "cone", color: 0xd46a4a },
  { x: 0, y: -5.8, z: -16, scale: 2, kind: "sphere", color: 0x9b5de5 },
  { x: -18, y: -5.7, z: -11, scale: 0.8, kind: "cone", color: 0xf28482 },
  { x: 20, y: -5.85, z: -9, scale: 1.3, kind: "cylinder", color: 0x4a7c59 },
  { x: -10, y: -5.8, z: -20, scale: 1, kind: "sphere", color: 0xffb703 },
  { x: 6, y: -5.75, z: -22, scale: 1.4, kind: "cone", color: 0x8ecae6 },
  { x: -22, y: -5.8, z: -15, scale: 0.7, kind: "cylinder", color: 0x5a8f7b },
  { x: 18, y: -5.7, z: -18, scale: 1.6, kind: "cone", color: 0xbc6c25 },
  { x: -3, y: -5.85, z: -6, scale: 0.6, kind: "sphere", color: 0xdda15e },
];

function createCoralMesh(placement: CoralPlacement): Mesh {
  const mat = new MeshStandardMaterial({
    color: placement.color,
    roughness: 0.85,
    metalness: 0.05,
  });
  let mesh: Mesh;
  const s = placement.scale;
  switch (placement.kind) {
    case "cone":
      mesh = new Mesh(new ConeGeometry(0.8 * s, 2.2 * s, 6), mat);
      break;
    case "sphere":
      mesh = new Mesh(new SphereGeometry(1.1 * s, 8, 6), mat);
      break;
    case "cylinder":
      mesh = new Mesh(new CylinderGeometry(0.5 * s, 0.7 * s, 2.5 * s, 6), mat);
      break;
  }
  mesh.position.set(placement.x, placement.y, placement.z);
  return mesh;
}

/** Reef floor and coral inside the 50 m play zone. */
export function createReefFloor(diameterMeters = REEF_FLOOR_DIAMETER_M): Group {
  const reef = new Group();
  reef.name = "ReefFloor";

  const floor = new Mesh(
    new PlaneGeometry(diameterMeters, diameterMeters, 1, 1),
    new MeshStandardMaterial({
      color: 0x1a4a3a,
      roughness: 0.95,
      metalness: 0.05,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -6, -11);
  reef.add(floor);

  const sand = new Mesh(
    new PlaneGeometry(REEF_PLAY_RADIUS_M * 0.9, REEF_PLAY_RADIUS_M * 0.5),
    new MeshStandardMaterial({
      color: 0x4a9a6a,
      roughness: 0.9,
      metalness: 0,
      emissive: 0x1a4a32,
      emissiveIntensity: 0.35,
    }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -5.9, -10);
  reef.add(sand);

  const boundary = new Mesh(
    new PlaneGeometry(diameterMeters, diameterMeters),
    new MeshStandardMaterial({
      color: 0x0a1a22,
      roughness: 1,
      transparent: true,
      opacity: 0.35,
    }),
  );
  boundary.rotation.x = -Math.PI / 2;
  boundary.position.set(0, -6.2, -11);
  reef.add(boundary);

  for (const placement of CORAL_PLACEMENTS) {
    reef.add(createCoralMesh(placement));
  }

  return reef;
}
