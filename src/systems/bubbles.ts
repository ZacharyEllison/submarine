import {
  BufferAttribute,
  BufferGeometry,
  createSystem,
  Points,
  PointsMaterial,
} from "@iwsdk/core";

import { SubRoot } from "../components/sub-state.js";

const BUBBLE_COUNT = 48;

export class BubbleParticleSystem extends createSystem({
  sub: { required: [SubRoot] },
}) {
  private points!: Points;
  private positions!: Float32Array;
  private speeds!: Float32Array;
  private ready = false;

  init() {
    this.queries.sub.subscribe("qualify", (entity) => {
      if (this.ready) {
        return;
      }
      this.ready = true;

      this.positions = new Float32Array(BUBBLE_COUNT * 3);
      this.speeds = new Float32Array(BUBBLE_COUNT);

      for (let i = 0; i < BUBBLE_COUNT; i++) {
        this.resetBubble(i);
      }

      const geometry = new BufferGeometry();
      geometry.setAttribute(
        "position",
        new BufferAttribute(this.positions, 3),
      );

      this.points = new Points(
        geometry,
        new PointsMaterial({
          color: 0xaaddff,
          size: 0.08,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      );
      this.points.name = "ViewportBubbles";
      entity.object3D!.add(this.points);
    });
  }

  private resetBubble(i: number): void {
    const i3 = i * 3;
    this.positions[i3] = (Math.random() - 0.5) * 1.6;
    this.positions[i3 + 1] = -0.5 + Math.random() * 0.4;
    this.positions[i3 + 2] = -1.8 - Math.random() * 0.8;
    this.speeds[i] = 0.25 + Math.random() * 0.35;
  }

  update(delta: number) {
    if (!this.ready) {
      return;
    }

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const i3 = i * 3;
      this.positions[i3 + 1] += this.speeds[i] * delta;
      if (this.positions[i3 + 1] > 1.8) {
        this.resetBubble(i);
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
