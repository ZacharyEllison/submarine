import { createComponent, Types } from "@iwsdk/core";

/** Individual fish agent — velocity stored for flocking. */
export const Fish = createComponent("Fish", {
  schoolId: { type: Types.Int32, default: 0 },
  velocity: { type: Types.Vec3, default: [0, 0, 0] },
});

/** School anchor — defines wander center and bounds for its members. */
export const FishSchool = createComponent("FishSchool", {
  schoolId: { type: Types.Int32, default: 0 },
  center: { type: Types.Vec3, default: [0, 0, 0] },
  wanderRadius: { type: Types.Float32, default: 12 },
});

export const CreatureKind = {
  Turtle: "turtle",
  Ray: "ray",
} as const;

export type CreatureKindValue =
  (typeof CreatureKind)[keyof typeof CreatureKind];

/** Large pass-by creature (turtle or ray). */
export const Creature = createComponent("Creature", {
  kind: {
    type: Types.Enum,
    enum: CreatureKind,
    default: CreatureKind.Turtle,
  },
  speed: { type: Types.Float32, default: 1.2 },
});
