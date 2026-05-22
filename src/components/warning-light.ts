import { createComponent, Types } from "@iwsdk/core";

/** Dashboard warning indicator — emissive flicker driven by WarningLightsSystem. */
export const WarningLight = createComponent("WarningLight", {
  emissiveOn: { type: Types.Float32, default: 1.2 },
  emissiveOff: { type: Types.Float32, default: 0.06 },
});
