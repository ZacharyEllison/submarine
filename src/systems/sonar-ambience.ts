import {
  AudioSource,
  AudioUtils,
  createComponent,
  createSystem,
  type Entity,
  Types,
} from "@iwsdk/core";

/** Marks the spatial sonar ping emitter for timed one-shots. */
export const SonarPingSource = createComponent("SonarPingSource", {
  minInterval: { type: Types.Float32, default: 10 },
  maxInterval: { type: Types.Float32, default: 22 },
});

export class SonarAmbienceSystem extends createSystem({
  sonar: { required: [SonarPingSource, AudioSource] },
}) {
  private nextPingAt = 0;
  private sonarEntity: Entity | null = null;

  init() {
    this.queries.sonar.subscribe("qualify", (entity) => {
      if (this.sonarEntity) {
        return;
      }
      this.sonarEntity = entity;
      this.scheduleNextPing(0);
    });
  }

  private scheduleNextPing(time: number): void {
    if (!this.sonarEntity) {
      return;
    }

    const min = this.sonarEntity.getValue(SonarPingSource, "minInterval") ?? 10;
    const max = this.sonarEntity.getValue(SonarPingSource, "maxInterval") ?? 22;
    const interval = min + Math.random() * (max - min);
    this.nextPingAt = time + interval;
  }

  update(_delta: number, time: number) {
    if (!this.sonarEntity || time < this.nextPingAt) {
      return;
    }

    AudioUtils.play(this.sonarEntity, 0.15);
    this.scheduleNextPing(time);
  }
}
