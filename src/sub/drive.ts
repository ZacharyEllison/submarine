import {
  createSystem,
  Transform,
  Types,
  VisibilityState,
  type Entity,
} from "@iwsdk/core";

import { DriveMode, SubRoot, SubState } from "../components/sub-state.js";
import { applyReefFog } from "../environment/water.js";
import {
  applyBobTilt,
  clampDepthMeters,
  clampReefPosition,
  depthMetersFromY,
  MANUAL_INPUT_EPS,
  readThumbsticks,
  yFromDepthMeters,
} from "./motion.js";

function hasLeverInput(entity: Entity): boolean {
  const throttle = entity.getValue(SubState, "throttle") ?? 0;
  const steering = entity.getValue(SubState, "steering") ?? 0;
  const depth = entity.getValue(SubState, "depth") ?? 0;
  return (
    Math.abs(throttle) > MANUAL_INPUT_EPS ||
    Math.abs(steering) > MANUAL_INPUT_EPS ||
    Math.abs(depth) > MANUAL_INPUT_EPS
  );
}

export class SubDriveSystem extends createSystem(
  {
    sub: { required: [SubRoot, SubState, Transform] },
  },
  {
    maxSpeed: { type: Types.Float32, default: 2 },
    maxDepth: { type: Types.Float32, default: 15 },
    minDepth: { type: Types.Float32, default: -5 },
    drag: { type: Types.Float32, default: 0.85 },
    reefRadius: { type: Types.Float32, default: 50 },
    bobAmplitude: { type: Types.Float32, default: 0.03 },
    bobFrequency: { type: Types.Float32, default: 0.4 },
    thumbstickDrive: { type: Types.Boolean, default: true },
  },
) {
  private velocityX = 0;
  private velocityY = 0;
  private velocityZ = 0;
  private bobPhase = 0;

  init() {
    this.cleanupFuncs.push(
      this.world.visibilityState.subscribe((state) => {
        if (state === VisibilityState.Visible) {
          this.world.session?.updateTargetFrameRate(72);
          this.world.renderer.xr.setFoveation(1);
        }
      }),
    );
  }

  update(delta: number, time: number) {
    const maxSpeed = this.config.maxSpeed.peek();
    const drag = this.config.drag.peek();
    const reefRadius = this.config.reefRadius.peek();
    const bobAmp = this.config.bobAmplitude.peek();
    const bobFreq = this.config.bobFrequency.peek();
    const minDepth = this.config.minDepth.peek();
    const maxDepth = this.config.maxDepth.peek();

    for (const entity of this.queries.sub.entities) {
      const driveMode = entity.getValue(SubState, "driveMode");
      const sticks = readThumbsticks(
        this.input,
        this.config.thumbstickDrive.peek(),
      );
      const manualActive = sticks.active || hasLeverInput(entity);

      if (this.input.keyboard.getKeyDown("KeyC")) {
        const nextMode =
          driveMode === DriveMode.Cruise ? DriveMode.Manual : DriveMode.Cruise;
        entity.setValue(SubState, "driveMode", nextMode);
        if (nextMode === DriveMode.Manual) {
          this.resetVelocity();
        }
        continue;
      }

      if (driveMode === DriveMode.Cruise) {
        if (manualActive) {
          entity.setValue(SubState, "driveMode", DriveMode.Manual);
          this.resetVelocity();
        } else {
          continue;
        }
      }

      let throttle = entity.getValue(SubState, "throttle") ?? 0;
      let steering = entity.getValue(SubState, "steering") ?? 0;
      let depthInput = entity.getValue(SubState, "depth") ?? 0;

      if (sticks.active) {
        if (Math.abs(sticks.throttle) > 0) {
          throttle = sticks.throttle;
        }
        if (Math.abs(sticks.steering) > 0) {
          steering = sticks.steering;
        }
        if (Math.abs(sticks.depth) > 0) {
          depthInput = sticks.depth;
        }
      }

      entity.setValue(SubState, "throttle", throttle);
      entity.setValue(SubState, "steering", steering);
      entity.setValue(SubState, "depth", depthInput);

      const object = entity.object3D!;

      // The cockpit (and player) are fixed. SubRoot is the world that moves.
      // Moving the world opposite to the sub's travel creates the illusion of motion.
      // Sub forward = world backward: (+sin ry, 0, +cos ry) when rotation.y == 0 is +Z.
      // Sub turning right → world rotates left → rotation.y decreases.
      const targetVx = Math.sin(object.rotation.y) * throttle * maxSpeed;
      const targetVz = Math.cos(object.rotation.y) * throttle * maxSpeed;
      // Descending deeper → world content moves down → position.y decreases.
      const targetVy = depthInput * maxSpeed * 0.5;

      const blend = 1 - Math.pow(drag, delta * 60);
      this.velocityX += (targetVx - this.velocityX) * blend;
      this.velocityZ += (targetVz - this.velocityZ) * blend;
      this.velocityY += (targetVy - this.velocityY) * blend;

      object.position.x += this.velocityX * delta;
      object.position.y -= this.velocityY * delta;
      object.position.z += this.velocityZ * delta;
      object.rotation.y -= steering * delta;

      const reefClamp = clampReefPosition(
        object.position.x,
        object.position.z,
        reefRadius,
      );
      object.position.x = reefClamp.x;
      object.position.z = reefClamp.z;
      if (reefClamp.clamped) {
        this.velocityX *= 0.5;
        this.velocityZ *= 0.5;
      }

      // In inverted-world model: deeper sub → world moves down → SubRoot.y negative.
      // depthMeters = -SubRoot.position.y  (positive = below surface).
      const depthMeters = clampDepthMeters(
        -object.position.y,
        minDepth,
        maxDepth,
      );
      object.position.y = -depthMeters;
      entity.setValue(SubState, "depthMeters", depthMeters);

      this.bobPhase += delta * bobFreq * Math.PI * 2;
      applyBobTilt(object, this.bobPhase, bobAmp);

      applyReefFog(
        this.scene,
        Math.hypot(object.position.x, object.position.z),
        reefRadius,
      );
    }
  }

  private resetVelocity(): void {
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
  }
}
