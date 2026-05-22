import {
  createSystem,
  eq,
  PanelDocument,
  PanelUI,
} from "@iwsdk/core";

import { SubRoot, SubState } from "../components/sub-state.js";

const HUD_CONFIG = "./ui/hud.json";

type HudLabel = {
  setProperties(props: { text: string }): void;
};

/** Binds depth gauge PanelUI to SubState.depthMeters. */
export class DepthHudSystem extends createSystem({
  hud: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, "config", HUD_CONFIG)],
  },
  sub: { required: [SubRoot, SubState] },
}) {
  private depthLabel?: HudLabel;

  init() {
    this.queries.hud.subscribe("qualify", (entity) => {
      const doc = PanelDocument.data.document[entity.index] as
        | { getElementById(id: string): HudLabel | null }
        | undefined;
      this.depthLabel = doc?.getElementById("depth-value") ?? undefined;
    });
  }

  update() {
    if (!this.depthLabel) {
      return;
    }

    let sub;
    for (const entity of this.queries.sub.entities) {
      sub = entity;
      break;
    }
    if (!sub) {
      return;
    }

    const depthMeters = sub.getValue(SubState, "depthMeters") ?? 0;
    this.depthLabel.setProperties({
      text: `${depthMeters.toFixed(1)} m`,
    });
  }
}
