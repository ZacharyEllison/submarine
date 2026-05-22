import { createSystem, Transform, Types, type Entity } from "@iwsdk/core";

import { DriveMode, SubRoot, SubState } from "../components/sub-state.js";
import { applyReefFog } from "../environment/water.js";
import {
  applyBobTilt,
  clampDepthMeters,
  clampReefPosition,
  depthMetersFromY,
  yFromDepthMeters,
} from "./motion.js";

export class SubCruiseSystem extends createSystem(
  {
    sub: { required: [SubRoot, SubState, Transform] },
  },
  {
    cruiseSpeed: { type: Types.Float32, default: 1 },
    pathRadius: { type: Types.Float32, default: 18 },
    pathCenterZ: { type: Types.Float32, default: -12 },
    cruiseDepth: { type: Types.Float32, default: 10 },
    minDepth: { type: Types.Float32, default: -5 },
    maxDepth: { type: Types.Float32, default: 15 },
    reefRadius: { type: Types.Float32, default: 50 },
    bobAmplitude: { type: Types.Float32, default: 0.03 },
    bobFrequency: { type: Types.Float32, default: 0.4 },
  },
) {
  private pathAngle = 0;
  private bobPhase = 0;
  private wasCruise = false;

  update(delta: number, time: number) {
    const speed = this.config.cruiseSpeed.peek();
    const radius = this.config.pathRadius.peek();
    const centerZ = this.config.pathCenterZ.peek();
    const cruiseDepth = this.config.cruiseDepth.peek();
    const minDepth = this.config.minDepth.peek();
    const maxDepth = this.config.maxDepth.peek();
    const reefRadius = this.config.reefRadius.peek();
    const bobAmp = this.config.bobAmplitude.peek();
    const bobFreq = this.config.bobFrequency.peek();

    for (const entity of this.queries.sub.entities) {
      const driveMode = entity.getValue(SubState, "driveMode");
      const object = entity.object3D!;

      if (driveMode !== DriveMode.Cruise) {
        this.wasCruise = false;
        continue;
      }

      if (!this.wasCruise) {
        this.syncPathAngle(entity, radius, centerZ);
        this.wasCruise = true;
      }

      this.pathAngle += (speed / radius) * delta;

      object.position.x = Math.sin(this.pathAngle) * radius;
      object.position.z = centerZ + Math.cos(this.pathAngle) * radius * 0.6;

      const reefClamp = clampReefPosition(
        object.position.x,
        object.position.z,
        reefRadius,
      );
      object.position.x = reefClamp.x;
      object.position.z = reefClamp.z;

      const depthMeters = clampDepthMeters(cruiseDepth, minDepth, maxDepth);
      object.position.y = yFromDepthMeters(depthMeters);

      object.rotation.y = this.pathAngle + Math.PI;

      entity.setValue(SubState, "throttle", speed / 2);
      entity.setValue(SubState, "steering", 0);
      entity.setValue(SubState, "depth", 0);
      entity.setValue(SubState, "depthMeters", depthMetersFromY(object.position.y));

      this.bobPhase += delta * bobFreq * Math.PI * 2;
      applyBobTilt(object, this.bobPhase, bobAmp);

      applyReefFog(
        this.scene,
        Math.hypot(object.position.x, object.position.z),
        reefRadius,
      );
    }
  }

  /** Pick up the closed elliptical path at the sub's current position. */
  private syncPathAngle(entity: Entity, radius: number, centerZ: number): void {
    const object = entity.object3D!;
    this.pathAngle = Math.atan2(
      object.position.x / radius,
      (object.position.z - centerZ) / (radius * 0.6),
    );
  }
}
