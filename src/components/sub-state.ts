import { createComponent, Types } from "@iwsdk/core";

export const DriveMode = {
  Manual: "manual",
  Cruise: "cruise",
} as const;

export type DriveModeValue = (typeof DriveMode)[keyof typeof DriveMode];

/** Marks the entity that moves the sub (cockpit + reef parent). */
export const SubRoot = createComponent("SubRoot", {});

export const SubState = createComponent("SubState", {
  throttle: { type: Types.Float32, default: 0 },
  steering: { type: Types.Float32, default: 0 },
  depth: { type: Types.Float32, default: 0 },
  depthMeters: { type: Types.Float32, default: 10 },
  spotlightOn: { type: Types.Boolean, default: false },
  driveMode: {
    type: Types.Enum,
    enum: DriveMode,
    default: DriveMode.Manual,
  },
});
