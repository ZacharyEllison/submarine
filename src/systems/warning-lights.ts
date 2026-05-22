import {
  createSystem,
  Mesh,
  MeshStandardMaterial,
} from "@iwsdk/core";

import { WarningLight } from "../components/warning-light.js";

export class WarningLightsSystem extends createSystem({
  lights: { required: [WarningLight] },
}) {
  update(_delta: number, time: number) {
    for (const entity of this.queries.lights.entities) {
      const mesh = entity.object3D;
      if (!(mesh instanceof Mesh)) {
        continue;
      }

      const material = mesh.material;
      if (!(material instanceof MeshStandardMaterial)) {
        continue;
      }

      const on = entity.getValue(WarningLight, "emissiveOn") ?? 1.2;
      const off = entity.getValue(WarningLight, "emissiveOff") ?? 0.06;

      // Irregular blink: brief bright flashes with long dim gaps.
      const fast = Math.sin(time * 9.1);
      const slow = Math.sin(time * 2.3);
      const flash = fast > 0.55 && slow > -0.2;
      material.emissiveIntensity = flash ? on : off;
    }
  }
}
