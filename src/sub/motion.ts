import { InputComponent, type InputManager, type Object3D } from "@iwsdk/core";

/** Ignore small thumbstick drift. */
export const STICK_DEADZONE = 0.12;

/** Treat lever values above this as active manual input (pauses cruise). */
export const MANUAL_INPUT_EPS = 0.05;

export type StickInput = {
  throttle: number;
  steering: number;
  depth: number;
  active: boolean;
};

/** Positive depthMeters = below surface (surface baseline y = 0). */
export function depthMetersFromY(y: number): number {
  return -y;
}

export function yFromDepthMeters(depthMeters: number): number {
  return -depthMeters;
}

export function clampDepthMeters(
  depthMeters: number,
  minDepth: number,
  maxDepth: number,
): number {
  return Math.max(minDepth, Math.min(maxDepth, depthMeters));
}

export function clampReefPosition(
  x: number,
  z: number,
  reefRadius: number,
): { x: number; z: number; clamped: boolean } {
  const horizontalDist = Math.hypot(x, z);
  if (horizontalDist <= reefRadius) {
    return { x, z, clamped: false };
  }
  const scale = reefRadius / horizontalDist;
  return { x: x * scale, z: z * scale, clamped: true };
}

export function applyBobTilt(
  object: Object3D,
  bobPhase: number,
  bobAmp: number,
): void {
  object.rotation.x = Math.sin(bobPhase) * bobAmp;
  object.rotation.z = Math.cos(bobPhase * 0.7) * bobAmp * 0.5;
}

export function readThumbsticks(
  input: InputManager,
  enabled: boolean,
): StickInput {
  if (!enabled) {
    return { throttle: 0, steering: 0, depth: 0, active: false };
  }

  let throttle = 0;
  let steering = 0;
  let depth = 0;
  let active = false;

  const right = input.xr.gamepads.right;
  const rightAxes = right?.getAxesValues(InputComponent.Thumbstick);
  if (rightAxes) {
    if (Math.abs(rightAxes.y) > STICK_DEADZONE) {
      throttle = -rightAxes.y;
      active = true;
    }
    if (Math.abs(rightAxes.x) > STICK_DEADZONE) {
      steering = rightAxes.x * 1.2;
      active = true;
    }
  }

  const left = input.xr.gamepads.left;
  const leftAxes = left?.getAxesValues(InputComponent.Thumbstick);
  if (leftAxes && Math.abs(leftAxes.y) > STICK_DEADZONE) {
    depth = -leftAxes.y;
    active = true;
  }

  return { throttle, steering, depth, active };
}
