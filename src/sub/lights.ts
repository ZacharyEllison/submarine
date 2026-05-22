import { createSystem, SpotLight } from "@iwsdk/core";

import { SubRoot, SubState } from "../components/sub-state.js";

export class SpotlightSystem extends createSystem({
  sub: { required: [SubRoot, SubState] },
}) {
  update() {
    const spotlight = this.globals.subSpotlight as SpotLight | undefined;
    if (!spotlight) {
      return;
    }

    for (const entity of this.queries.sub.entities) {
      const on = entity.getValue(SubState, "spotlightOn") ?? false;
      spotlight.intensity = on ? 2.5 : 0;
    }
  }
}
