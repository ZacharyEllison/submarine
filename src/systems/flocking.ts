import {
  createSystem,
  Transform,
  Types,
  Vector3,
} from "@iwsdk/core";

import { Fish, FishSchool } from "../components/fish.js";
import { REEF_PLAY_RADIUS_M } from "../environment/constants.js";

const SEPARATION_RADIUS = 1.8;
const NEIGHBOR_RADIUS = 6;
const MAX_SPEED = 2.2;
const MAX_FORCE = 1.8;
const BOUNDS_Y_MIN = -5.5;
const BOUNDS_Y_MAX = -2.5;

export class FlockingSystem extends createSystem(
  {
    fish: { required: [Fish, Transform] },
    schools: { required: [FishSchool] },
  },
  {
    separationWeight: { type: Types.Float32, default: 1.4 },
    alignmentWeight: { type: Types.Float32, default: 0.6 },
    cohesionWeight: { type: Types.Float32, default: 0.5 },
    boundsWeight: { type: Types.Float32, default: 0.8 },
  },
) {
  private separation!: Vector3;
  private alignment!: Vector3;
  private cohesion!: Vector3;
  private bounds!: Vector3;
  private desired!: Vector3;
  private steer!: Vector3;
  private schoolCenters = new Map<number, Float32Array>();
  private schoolRadii = new Map<number, number>();

  init() {
    this.separation = new Vector3();
    this.alignment = new Vector3();
    this.cohesion = new Vector3();
    this.bounds = new Vector3();
    this.desired = new Vector3();
    this.steer = new Vector3();
  }

  update(delta: number) {
    this.schoolCenters.clear();
    this.schoolRadii.clear();
    for (const school of this.queries.schools.entities) {
      const id = school.getValue(FishSchool, "schoolId") ?? 0;
      const center = school.getVectorView(FishSchool, "center") as Float32Array;
      const radius = school.getValue(FishSchool, "wanderRadius") ?? 12;
      this.schoolCenters.set(id, center);
      this.schoolRadii.set(id, radius);
    }

    const sepW = this.config.separationWeight.peek();
    const alignW = this.config.alignmentWeight.peek();
    const cohW = this.config.cohesionWeight.peek();
    const boundsW = this.config.boundsWeight.peek();
    const fishList = this.queries.fish.entities;

    for (const entity of fishList) {
      const pos = entity.getVectorView(Transform, "position") as Float32Array;
      const vel = entity.getVectorView(Fish, "velocity") as Float32Array;
      const schoolId = entity.getValue(Fish, "schoolId") ?? 0;

      this.separation.set(0, 0, 0);
      this.alignment.set(0, 0, 0);
      this.cohesion.set(0, 0, 0);
      this.bounds.set(0, 0, 0);

      let neighborCount = 0;
      let separationCount = 0;

      for (const other of fishList) {
        if (other === entity) {
          continue;
        }
        const otherPos = other.getVectorView(
          Transform,
          "position",
        ) as Float32Array;
        const dx = pos[0] - otherPos[0];
        const dy = pos[1] - otherPos[1];
        const dz = pos[2] - otherPos[2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < SEPARATION_RADIUS * SEPARATION_RADIUS && distSq > 0.0001) {
          const invDist = 1 / Math.sqrt(distSq);
          this.separation.x += dx * invDist;
          this.separation.y += dy * invDist;
          this.separation.z += dz * invDist;
          separationCount++;
        }

        if (distSq < NEIGHBOR_RADIUS * NEIGHBOR_RADIUS) {
          const otherVel = other.getVectorView(Fish, "velocity") as Float32Array;
          this.alignment.x += otherVel[0];
          this.alignment.y += otherVel[1];
          this.alignment.z += otherVel[2];
          this.cohesion.x += otherPos[0];
          this.cohesion.y += otherPos[1];
          this.cohesion.z += otherPos[2];
          neighborCount++;
        }
      }

      if (separationCount > 0) {
        this.separation.multiplyScalar(1 / separationCount);
      }
      if (neighborCount > 0) {
        this.alignment.multiplyScalar(1 / neighborCount);
        this.cohesion.x = this.cohesion.x / neighborCount - pos[0];
        this.cohesion.y = this.cohesion.y / neighborCount - pos[1];
        this.cohesion.z = this.cohesion.z / neighborCount - pos[2];
      }

      const schoolCenter = this.schoolCenters.get(schoolId);
      if (schoolCenter) {
        this.bounds.x = schoolCenter[0] - pos[0];
        this.bounds.y = schoolCenter[1] - pos[1];
        this.bounds.z = schoolCenter[2] - pos[2];
        const boundsDist = Math.hypot(
          this.bounds.x,
          this.bounds.y,
          this.bounds.z,
        );
        const wanderRadius =
          this.getSchoolWanderRadius(schoolId) ?? NEIGHBOR_RADIUS;
        if (boundsDist > wanderRadius) {
          this.bounds.multiplyScalar((boundsDist - wanderRadius) * 0.08);
        } else if (boundsDist > 0.001) {
          this.bounds.set(0, 0, 0);
        }
      }

      const horizontalDist = Math.hypot(pos[0], pos[2]);
      if (horizontalDist > REEF_PLAY_RADIUS_M * 0.85) {
        const pull = (horizontalDist - REEF_PLAY_RADIUS_M * 0.85) * 0.15;
        this.bounds.x -= (pos[0] / horizontalDist) * pull;
        this.bounds.z -= (pos[2] / horizontalDist) * pull;
      }

      if (pos[1] < BOUNDS_Y_MIN) {
        this.bounds.y += (BOUNDS_Y_MIN - pos[1]) * 0.2;
      } else if (pos[1] > BOUNDS_Y_MAX) {
        this.bounds.y -= (pos[1] - BOUNDS_Y_MAX) * 0.2;
      }

      const accel = this.steer;
      accel.set(0, 0, 0);
      this.accumulateForce(accel, this.separation, sepW);
      this.accumulateForce(accel, this.alignment, alignW);
      this.accumulateForce(accel, this.cohesion, cohW);
      this.accumulateForce(accel, this.bounds, boundsW);

      vel[0] += accel.x * delta;
      vel[1] += accel.y * delta;
      vel[2] += accel.z * delta;

      const speed = Math.hypot(vel[0], vel[1], vel[2]);
      if (speed > MAX_SPEED) {
        const scale = MAX_SPEED / speed;
        vel[0] *= scale;
        vel[1] *= scale;
        vel[2] *= scale;
      }

      pos[0] += vel[0] * delta;
      pos[1] += vel[1] * delta;
      pos[2] += vel[2] * delta;

      if (speed > 0.05) {
        const object = entity.object3D!;
        object.rotation.y = Math.atan2(-vel[0], -vel[2]);
        object.rotation.x =
          Math.atan2(vel[1], Math.hypot(vel[0], vel[2])) * 0.3;
      }
    }
  }

  private accumulateForce(
    out: Vector3,
    force: Vector3,
    weight: number,
  ): void {
    if (force.lengthSq() < 0.0001) {
      return;
    }
    this.desired.copy(force).normalize().multiplyScalar(MAX_SPEED);
    this.steer.copy(this.desired);
    const steerMag = this.steer.length();
    if (steerMag > MAX_FORCE) {
      this.steer.multiplyScalar(MAX_FORCE / steerMag);
    }
    out.x += this.steer.x * weight;
    out.y += this.steer.y * weight;
    out.z += this.steer.z * weight;
  }

  private getSchoolWanderRadius(schoolId: number): number | undefined {
    return this.schoolRadii.get(schoolId);
  }
}
