import {
  ConeGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Entity,
  type World,
} from "@iwsdk/core";

import { Fish, FishSchool } from "../components/fish.js";
import { REEF_PLAY_RADIUS_M } from "../environment/constants.js";

export const SCHOOL_COUNT = 4;
export const FISH_PER_SCHOOL = 15;

const FISH_COLORS = [0x44aaff, 0xffaa44, 0x88ddff, 0xffcc66, 0x66ccaa];

type SchoolDef = {
  id: number;
  center: [number, number, number];
  wanderRadius: number;
  color: number;
};

const SCHOOL_DEFS: SchoolDef[] = [
  { id: 0, center: [-15, -4, -18], wanderRadius: 10, color: 0x44aaff },
  { id: 1, center: [20, -3.5, -25], wanderRadius: 12, color: 0xffaa44 },
  { id: 2, center: [-25, -4.5, -12], wanderRadius: 9, color: 0x88ddff },
  { id: 3, center: [8, -3, -30], wanderRadius: 11, color: 0xffcc66 },
];

function createFishMesh(color: number): Mesh {
  const mesh = new Mesh(
    new ConeGeometry(0.12, 0.45, 5),
    new MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.15,
    }),
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function spawnFish(
  world: World,
  parent: Entity,
  schoolId: number,
  position: [number, number, number],
  velocity: [number, number, number],
  color: number,
): void {
  const mesh = createFishMesh(color);
  mesh.position.set(...position);

  const entity = world.createTransformEntity(mesh, { parent });
  entity.addComponent(Fish, { schoolId, velocity });
}

export type FishSpawnResult = {
  container: Group;
  schoolCount: number;
  fishCount: number;
};

/** Spawns fish schools inside the reef play zone (within 50 m). */
export function spawnFishSchools(
  world: World,
  parent: Entity,
): FishSpawnResult {
  const container = new Group();
  container.name = "FishSchools";
  const containerEntity = world.createTransformEntity(container, { parent });

  let fishCount = 0;

  for (const def of SCHOOL_DEFS) {
    const schoolAnchor = new Group();
    schoolAnchor.name = `FishSchool_${def.id}`;
    schoolAnchor.position.set(...def.center);

    const schoolEntity = world.createTransformEntity(schoolAnchor, {
      parent: containerEntity,
    });
    schoolEntity.addComponent(FishSchool, {
      schoolId: def.id,
      center: def.center,
      wanderRadius: def.wanderRadius,
    });

    for (let i = 0; i < FISH_PER_SCHOOL; i++) {
      const angle = (i / FISH_PER_SCHOOL) * Math.PI * 2;
      const radius = 1 + Math.random() * (def.wanderRadius * 0.4);
      const x = def.center[0] + Math.cos(angle) * radius;
      const y = def.center[1] + (Math.random() - 0.5) * 1.2;
      const z = def.center[2] + Math.sin(angle) * radius;

      const dist = Math.hypot(x, z);
      if (dist > REEF_PLAY_RADIUS_M * 0.9) {
        continue;
      }

      const speed = 0.8 + Math.random() * 0.6;
      const heading = Math.random() * Math.PI * 2;
      const vx = Math.sin(heading) * speed;
      const vz = Math.cos(heading) * speed;
      const color =
        FISH_COLORS[(def.id + i) % FISH_COLORS.length] ?? def.color;

      spawnFish(
        world,
        containerEntity,
        def.id,
        [x, y, z],
        [vx, (Math.random() - 0.5) * 0.2, vz],
        color,
      );
      fishCount++;
    }
  }

  return {
    container,
    schoolCount: SCHOOL_DEFS.length,
    fishCount,
  };
}

/** Simple turtle mesh — sphere body + cone flippers. */
export function createTurtleMesh(): Group {
  const turtle = new Group();
  turtle.name = "Turtle";

  const shell = new Mesh(
    new SphereGeometry(0.9, 8, 6),
    new MeshStandardMaterial({
      color: 0x3d6b4f,
      roughness: 0.8,
      metalness: 0.05,
    }),
  );
  shell.scale.set(1.2, 0.5, 1.4);
  turtle.add(shell);

  const flipperMat = new MeshStandardMaterial({
    color: 0x2a5040,
    roughness: 0.85,
  });
  for (const side of [-1, 1]) {
    const flipper = new Mesh(new ConeGeometry(0.25, 0.7, 4), flipperMat);
    flipper.rotation.z = side * Math.PI / 2;
    flipper.position.set(side * 1.1, -0.1, 0);
    turtle.add(flipper);
  }

  return turtle;
}

/** Simple ray mesh — flattened cone body. */
export function createRayMesh(): Group {
  const ray = new Group();
  ray.name = "Ray";

  const body = new Mesh(
    new ConeGeometry(1.4, 0.15, 6),
    new MeshStandardMaterial({
      color: 0x556677,
      roughness: 0.7,
      metalness: 0.1,
      side: DoubleSide,
    }),
  );
  body.rotation.x = Math.PI / 2;
  ray.add(body);

  const tail = new Mesh(
    new ConeGeometry(0.08, 0.6, 4),
    new MeshStandardMaterial({ color: 0x445566, roughness: 0.75 }),
  );
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0, -1.1);
  ray.add(tail);

  return ray;
}
