import {
  AudioSource,
  AudioUtils,
  Object3D,
  PlaybackMode,
  type Entity,
  type World,
} from "@iwsdk/core";

import { SonarPingSource } from "../systems/sonar-ambience.js";

export type AmbienceAudioEntities = {
  engineHum: Entity;
  underwaterBed: Entity;
  sonarPing: Entity;
};

const ENGINE_HUM_KEY = "engineHum";
const UNDERWATER_BED_KEY = "underwaterBed";
const SONAR_PING_KEY = "sonarPing";

/**
 * Spatial engine hum (cockpit), non-positional underwater bed, and sonar emitter.
 * Sonar one-shots are triggered by SonarAmbienceSystem.
 */
export function setupAmbienceAudio(
  world: World,
  cockpitEntity: Entity,
  subRootEntity: Entity,
): AmbienceAudioEntities {
  world.registerComponent(SonarPingSource);

  const engineAnchor = new Object3D();
  engineAnchor.name = "EngineHumAnchor";
  engineAnchor.position.set(0, 0.55, 0.75);
  cockpitEntity.object3D!.add(engineAnchor);

  const engineHum = world.createTransformEntity(engineAnchor, {
    parent: cockpitEntity,
  });
  engineHum.addComponent(AudioSource, {
    src: ENGINE_HUM_KEY,
    positional: true,
    loop: true,
    autoplay: true,
    volume: 0.22,
    refDistance: 1.5,
    rolloffFactor: 1.2,
    playbackMode: PlaybackMode.Restart,
  });

  const bedAnchor = new Object3D();
  bedAnchor.name = "UnderwaterBedAnchor";
  subRootEntity.object3D!.add(bedAnchor);

  const underwaterBed = world.createTransformEntity(bedAnchor, {
    parent: subRootEntity,
  });
  underwaterBed.addComponent(AudioSource, {
    src: UNDERWATER_BED_KEY,
    positional: false,
    loop: true,
    autoplay: true,
    volume: 0.35,
    playbackMode: PlaybackMode.Restart,
  });

  const sonarAnchor = new Object3D();
  sonarAnchor.name = "SonarPingAnchor";
  sonarAnchor.position.set(0, 1.05, -1.4);
  cockpitEntity.object3D!.add(sonarAnchor);

  const sonarPing = world.createTransformEntity(sonarAnchor, {
    parent: cockpitEntity,
  });
  sonarPing.addComponent(SonarPingSource);
  sonarPing.addComponent(AudioSource, {
    src: SONAR_PING_KEY,
    positional: true,
    loop: false,
    autoplay: false,
    volume: 0.45,
    refDistance: 2,
    rolloffFactor: 1,
    playbackMode: PlaybackMode.Overlap,
    maxInstances: 2,
  });

  void AudioUtils.preload(engineHum);
  void AudioUtils.preload(underwaterBed);
  void AudioUtils.preload(sonarPing);

  return { engineHum, underwaterBed, sonarPing };
}
