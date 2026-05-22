import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Interactable,
  Mesh,
  MeshStandardMaterial,
  OneHandGrabbable,
  TorusGeometry,
  type Entity,
  type World,
} from "@iwsdk/core";

import {
  DashboardControl,
  DashboardControlType,
} from "../components/dashboard-control.js";

type GrabbableProps = {
  rotate?: boolean;
  translate?: boolean;
  rotateMin?: [number, number, number];
  rotateMax?: [number, number, number];
  translateMin?: [number, number, number];
  translateMax?: [number, number, number];
};

type ControlSpec = {
  type: (typeof DashboardControlType)[keyof typeof DashboardControlType];
  position: [number, number, number];
  rotation?: [number, number, number];
  createMesh: () => Group;
  grabbable: GrabbableProps;
};

function leverMesh(
  color: number,
  height = 0.22,
): Group {
  const group = new Group();
  group.name = "Lever";

  const slot = new Mesh(
    new BoxGeometry(0.06, 0.28, 0.1),
    new MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
      metalness: 0.4,
    }),
  );
  group.add(slot);

  const handle = new Mesh(
    new BoxGeometry(0.04, height, 0.04),
    new MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.5,
      emissive: color,
      emissiveIntensity: 0.15,
    }),
  );
  handle.position.y = height * 0.35;
  handle.name = "Handle";
  group.add(handle);

  return group;
}

function wheelMesh(): Group {
  const group = new Group();
  group.name = "Wheel";

  const rim = new Mesh(
    new TorusGeometry(0.14, 0.018, 12, 24),
    new MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.35,
      metalness: 0.75,
    }),
  );
  group.add(rim);

  for (let i = 0; i < 4; i++) {
    const spoke = new Mesh(
      new BoxGeometry(0.02, 0.22, 0.02),
      new MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.4,
        metalness: 0.7,
      }),
    );
    spoke.rotation.z = (i * Math.PI) / 2;
    group.add(spoke);
  }

  return group;
}

function buttonMesh(color: number, label: string): Group {
  const group = new Group();
  group.name = label;

  const body = new Mesh(
    new CylinderGeometry(0.045, 0.045, 0.04, 16),
    new MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.35,
      emissive: color,
      emissiveIntensity: 0.2,
    }),
  );
  body.rotation.x = Math.PI / 2;
  body.name = "ButtonCap";
  group.add(body);

  return group;
}

const CONTROL_SPECS: ControlSpec[] = [
  {
    type: DashboardControlType.Throttle,
    position: [-0.55, 0.88, -1.02],
    rotation: [-0.2, 0, 0],
    createMesh: () => leverMesh(0xcc8833),
    grabbable: {
      rotate: false,
      translate: true,
      translateMin: [0, 0, -0.12],
      translateMax: [0, 0, 0.12],
    },
  },
  {
    type: DashboardControlType.Wheel,
    position: [0, 0.82, -1.08],
    rotation: [-0.2, 0, 0],
    createMesh: wheelMesh,
    grabbable: {
      rotate: true,
      translate: false,
      rotateMin: [0, -1.4, 0],
      rotateMax: [0, 1.4, 0],
    },
  },
  {
    type: DashboardControlType.Depth,
    position: [0.55, 0.88, -1.02],
    rotation: [-0.2, 0, 0],
    createMesh: () => leverMesh(0x3388cc),
    grabbable: {
      rotate: false,
      translate: true,
      translateMin: [0, -0.1, 0],
      translateMax: [0, 0.1, 0],
    },
  },
  {
    type: DashboardControlType.Spotlight,
    position: [-0.25, 0.95, -1.0],
    rotation: [-0.2, 0, 0],
    createMesh: () => buttonMesh(0xcccc33, "Spotlight"),
    grabbable: {
      rotate: false,
      translate: true,
      translateMin: [0, 0, -0.035],
      translateMax: [0, 0, 0],
    },
  },
  {
    type: DashboardControlType.Autopilot,
    position: [0.15, 0.95, -1.0],
    rotation: [-0.2, 0, 0],
    createMesh: () => buttonMesh(0x33cc66, "Autopilot"),
    grabbable: {
      rotate: false,
      translate: true,
      translateMin: [0, 0, -0.035],
      translateMax: [0, 0, 0],
    },
  },
  {
    type: DashboardControlType.Hailer,
    position: [0.55, 0.95, -1.0],
    rotation: [-0.2, 0, 0],
    createMesh: () => buttonMesh(0xcc4444, "Hailer"),
    grabbable: {
      rotate: false,
      translate: true,
      translateMin: [0, 0, -0.035],
      translateMax: [0, 0, 0],
    },
  },
];

/** Dashboard levers, wheel, and buttons parented under the cockpit dash. */
export function createDashboardControls(
  world: World,
  cockpitEntity: Entity,
  dashGroup: Group,
): void {
  for (const spec of CONTROL_SPECS) {
    const mesh = spec.createMesh();
    mesh.position.set(...spec.position);
    if (spec.rotation) {
      mesh.rotation.set(...spec.rotation);
    }
    dashGroup.add(mesh);

    const entity = world.createTransformEntity(mesh, { parent: cockpitEntity });
    entity.addComponent(Interactable);
    entity.addComponent(OneHandGrabbable, spec.grabbable);
    entity.addComponent(DashboardControl, { type: spec.type });
  }
}
