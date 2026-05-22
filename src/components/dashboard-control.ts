import { createComponent, Types } from "@iwsdk/core";

export const DashboardControlType = {
  Throttle: "throttle",
  Wheel: "wheel",
  Depth: "depth",
  Spotlight: "spotlight",
  Autopilot: "autopilot",
  Hailer: "hailer",
} as const;

export type DashboardControlTypeValue =
  (typeof DashboardControlType)[keyof typeof DashboardControlType];

/** Tags an interactive dashboard lever, wheel, or button. */
export const DashboardControl = createComponent("DashboardControl", {
  type: {
    type: Types.Enum,
    enum: DashboardControlType,
    default: DashboardControlType.Throttle,
  },
});
