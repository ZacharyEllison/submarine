import {
  createSystem,
  Grabbed,
  Transform,
  type Entity,
} from "@iwsdk/core";

import {
  DashboardControl,
  DashboardControlType,
} from "../components/dashboard-control.js";
import { DriveMode, SubRoot, SubState } from "../components/sub-state.js";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => {
  if (inMax === inMin) {
    return outMin;
  }
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
};

/** Maps grabbable dashboard motion to submarine state. */
export class DashboardControlSystem extends createSystem({
  controls: { required: [DashboardControl, Transform] },
  sub: { required: [SubRoot, SubState] },
}) {
  private grabbedLastFrame = new Map<number, boolean>();
  private restPosition = new Map<number, [number, number, number]>();
  private restRotation = new Map<number, [number, number, number]>();

  init() {
    this.queries.controls.subscribe("qualify", (entity) => {
      this.captureRest(entity);
    });
  }

  private captureRest(entity: Entity) {
    const object = entity.object3D!;
    this.restPosition.set(entity.index, [
      object.position.x,
      object.position.y,
      object.position.z,
    ]);
    this.restRotation.set(entity.index, [
      object.rotation.x,
      object.rotation.y,
      object.rotation.z,
    ]);
  }

  private subEntity(): Entity | undefined {
    for (const entity of this.queries.sub.entities) {
      return entity;
    }
    return undefined;
  }

  update() {
    const sub = this.subEntity();
    if (!sub) {
      return;
    }

    for (const entity of this.queries.controls.entities) {
      const type = entity.getValue(DashboardControl, "type");
      const object = entity.object3D!;
      const isGrabbed = entity.hasComponent(Grabbed);
      const wasGrabbed = this.grabbedLastFrame.get(entity.index) ?? false;

      if (!this.restPosition.has(entity.index)) {
        this.captureRest(entity);
      }

      const restPos = this.restPosition.get(entity.index)!;
      const restRot = this.restRotation.get(entity.index)!;

      switch (type) {
        case DashboardControlType.Throttle: {
          const deltaZ = object.position.z - restPos[2];
          const throttle = clamp(mapRange(deltaZ, -0.12, 0.12, -1, 1), -1, 1);
          sub.setValue(SubState, "throttle", throttle);
          break;
        }
        case DashboardControlType.Wheel: {
          const deltaY = object.rotation.y - restRot[1];
          const steering = clamp(mapRange(deltaY, -1.4, 1.4, -1, 1), -1, 1);
          sub.setValue(SubState, "steering", steering);
          break;
        }
        case DashboardControlType.Depth: {
          const deltaY = object.position.y - restPos[1];
          const depth = clamp(mapRange(deltaY, -0.1, 0.1, -1, 1), -1, 1);
          sub.setValue(SubState, "depth", depth);
          break;
        }
        case DashboardControlType.Spotlight: {
          if (wasGrabbed && !isGrabbed) {
            const pushed = object.position.z - restPos[2] < -0.015;
            if (pushed) {
              const on = sub.getValue(SubState, "spotlightOn") ?? false;
              sub.setValue(SubState, "spotlightOn", !on);
            }
            object.position.z = restPos[2];
          }
          break;
        }
        case DashboardControlType.Autopilot: {
          if (wasGrabbed && !isGrabbed) {
            const pushed = object.position.z - restPos[2] < -0.015;
            if (pushed) {
              const mode = sub.getValue(SubState, "driveMode");
              sub.setValue(
                SubState,
                "driveMode",
                mode === DriveMode.Cruise
                  ? DriveMode.Manual
                  : DriveMode.Cruise,
              );
            }
            object.position.z = restPos[2];
          }
          break;
        }
        case DashboardControlType.Hailer: {
          if (wasGrabbed && !isGrabbed) {
            const pushed = object.position.z - restPos[2] < -0.015;
            if (pushed) {
              this.world.globals.hailerPending = true;
            }
            object.position.z = restPos[2];
          }
          break;
        }
      }

      this.grabbedLastFrame.set(entity.index, isGrabbed);
    }
  }
}
