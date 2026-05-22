import {
  BackSide,
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  type Texture,
} from "@iwsdk/core";

export type CockpitBuild = {
  group: Group;
  dashGroup: Group;
  /** Red dashboard indicator — parented separately for WarningLight flicker. */
  warningLight: Mesh;
};

/**
 * Procedural submarine cockpit interior.
 */
export function createCockpit(surfaceTexture?: Texture): CockpitBuild {
  const cockpit = new Group();
  cockpit.name = "Cockpit";

  const hullGeo = new CylinderGeometry(2, 2, 3, 24, 1, true);
  const hullMat = new MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.8,
    metalness: 0.5,
    side: BackSide,
  });
  const hull = new Mesh(hullGeo, hullMat);
  hull.rotation.z = Math.PI / 2;
  hull.position.set(0, 1, -0.5);
  cockpit.add(hull);

  const domeGeo = new SphereGeometry(2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.3,
    side: BackSide,
  });
  const dome = new Mesh(domeGeo, domeMat);
  dome.position.set(0, 1, -0.5);
  dome.rotation.x = Math.PI;
  cockpit.add(dome);

  const floorMat = new MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.2,
  });
  const floor = new Mesh(new CircleGeometry(2, 24), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -0.5);
  cockpit.add(floor);

  const backMat = new MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.4,
  });
  const back = new Mesh(new CircleGeometry(2, 24), backMat);
  back.rotation.y = Math.PI / 2;
  back.position.set(0, 1, 1);
  cockpit.add(back);

  const dashGroup = new Group();
  dashGroup.position.set(0.85, 0.55, -0.35);
  dashGroup.rotation.y = -0.35;

  const panel = new Mesh(
    new BoxGeometry(2.4, 0.6, 0.15),
    new MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.6,
    }),
  );
  panel.position.set(0, 0.75, -1.2);
  panel.rotation.x = -0.2;
  dashGroup.add(panel);

  const top = new Mesh(
    new BoxGeometry(2.2, 0.05, 0.5),
    new MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.5,
    }),
  );
  top.position.set(0, 1.05, -1.1);
  dashGroup.add(top);

  const warningMat = new MeshStandardMaterial({
    color: 0xcc3333,
    roughness: 0.4,
    metalness: 0.3,
    emissive: 0xcc3333,
    emissiveIntensity: 0.06,
  });
  const warningLight = new Mesh(new BoxGeometry(0.15, 0.15, 0.05), warningMat);
  warningLight.name = "WarningLight";
  warningLight.position.set(-0.6, 0.85, -1.05);
  warningLight.rotation.x = -0.2;
  dashGroup.add(warningLight);
  cockpit.add(dashGroup);

  const seatMat = new MeshStandardMaterial({
    color: 0x443322,
    roughness: 0.9,
    metalness: 0,
  });
  const cushion = new Mesh(new BoxGeometry(0.8, 0.1, 0.7), seatMat);
  cushion.position.set(0, 0.45, 0.5);
  cockpit.add(cushion);

  const backrest = new Mesh(new BoxGeometry(0.8, 0.7, 0.1), seatMat);
  backrest.position.set(0, 0.8, 0.85);
  backrest.rotation.x = 0.1;
  cockpit.add(backrest);

  const frame = new Mesh(
    new TorusGeometry(1, 0.12, 12, 24),
    new MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.8,
    }),
  );
  frame.rotation.y = Math.PI / 2;
  frame.position.set(0, 1, -2);
  cockpit.add(frame);

  const glass = new Mesh(
    new CircleGeometry(1, 24),
    new MeshBasicMaterial({
      color: 0x88aacc,
      transparent: true,
      opacity: 0.08,
      side: DoubleSide,
    }),
  );
  glass.rotation.y = Math.PI / 2;
  glass.position.set(0, 1, -2);
  cockpit.add(glass);

  const scopeMat = new MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.5,
    metalness: 0.7,
  });
  const tube = new Mesh(new CylinderGeometry(0.12, 0.12, 1, 12), scopeMat);
  tube.position.set(0.55, 2.6, -0.2);
  cockpit.add(tube);

  const head = new Mesh(new BoxGeometry(0.35, 0.18, 0.22), scopeMat);
  head.position.set(0.55, 3.1, -0.15);
  cockpit.add(head);

  const pWindow = new Mesh(
    new BoxGeometry(0.08, 0.12, 0.18),
    new MeshBasicMaterial({
      map: surfaceTexture,
      color: 0xffffff,
      transparent: true,
      opacity: surfaceTexture ? 1 : 0.5,
    }),
  );
  pWindow.position.set(0.7, 3.1, -0.12);
  cockpit.add(pWindow);

  return { group: cockpit, dashGroup, warningLight };
}
