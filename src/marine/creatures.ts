import {
  createSystem,
  Transform,
  Types,
  type Entity,
} from "@iwsdk/core";

import { Creature, CreatureKind } from "../components/fish.js";
import { createRayMesh, createTurtleMesh } from "./fish.js";

const MIN_SPAWN_INTERVAL = 35;
const MAX_SPAWN_INTERVAL = 70;
const DESPAWN_X = 45;

export class CreatureSystem extends createSystem(
  {
    creatures: { required: [Creature, Transform] },
  },
  {
    minInterval: { type: Types.Float32, default: MIN_SPAWN_INTERVAL },
    maxInterval: { type: Types.Float32, default: MAX_SPAWN_INTERVAL },
  },
) {
  private spawnTimer = 15;
  private marineParent: Entity | null = null;
  private toDespawn: Entity[] = [];
  private passByPhase = 0;

  init() {
    this.spawnTimer = 15 + Math.random() * 10;
  }

  /** Call once after reef content entity is created. */
  setMarineParent(entity: Entity): void {
    this.marineParent = entity;
  }

  update(delta: number) {
    if (!this.marineParent) {
      return;
    }

    this.toDespawn.length = 0;
    this.passByPhase += delta;

    for (const entity of this.queries.creatures.entities) {
      const pos = entity.getVectorView(Transform, "position") as Float32Array;
      const speed = entity.getValue(Creature, "speed") ?? 1.2;
      const kind = entity.getValue(Creature, "kind");

      if (kind === CreatureKind.Turtle) {
        pos[0] += speed * delta;
        const object = entity.object3D!;
        object.rotation.y = Math.PI / 2;
        object.rotation.z = Math.sin(this.passByPhase * 2) * 0.08;
      } else {
        pos[0] += speed * delta;
        pos[1] += Math.sin(this.passByPhase * 3 + pos[2]) * 0.15 * delta;
        const object = entity.object3D!;
        object.rotation.y = Math.PI / 2;
        object.rotation.x = Math.sin(this.passByPhase * 2.5) * 0.12;
      }

      if (Math.abs(pos[0]) > DESPAWN_X) {
        this.toDespawn.push(entity);
      }
    }

    for (let i = 0; i < this.toDespawn.length; i++) {
      this.toDespawn[i]!.dispose();
    }

    if (this.queries.creatures.entities.size > 0) {
      return;
    }

    this.spawnTimer -= delta;
    if (this.spawnTimer > 0) {
      return;
    }

    this.spawnPassBy();
    const minI = this.config.minInterval.peek();
    const maxI = this.config.maxInterval.peek();
    this.spawnTimer = minI + Math.random() * (maxI - minI);
  }

  private spawnPassBy(): void {
    if (!this.marineParent) {
      return;
    }

    const fromLeft = Math.random() > 0.5;
    const kind =
      Math.random() > 0.45 ? CreatureKind.Ray : CreatureKind.Turtle;
    const mesh =
      kind === CreatureKind.Turtle ? createTurtleMesh() : createRayMesh();

    const y = -3.5 + Math.random() * 1.5;
    const z = -12 - Math.random() * 18;
    const startX = fromLeft ? -38 : 38;
    mesh.position.set(startX, y, z);
    if (!fromLeft) {
      mesh.rotation.y = -Math.PI / 2;
    }

    const speed = kind === CreatureKind.Turtle ? 0.9 + Math.random() * 0.4 : 1.4 + Math.random() * 0.6;
    const direction = fromLeft ? 1 : -1;

    const entity = this.world.createTransformEntity(mesh, {
      parent: this.marineParent,
    });
    entity.addComponent(Creature, {
      kind,
      speed: speed * direction,
    });
  }
}
