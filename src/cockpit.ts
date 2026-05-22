import * as THREE from "three";

/**
 * Build a procedural submarine cockpit interior.
 * Returns a THREE.Group ready to be added to the scene.
 */
export function createCockpit(): THREE.Group {
  const cockpit = new THREE.Group();

  // --- Hull (cylinder, backside rendering so we see the inside) ---
  const hullGeo = new THREE.CylinderGeometry(2, 2, 3, 24, 1, true);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.8,
    metalness: 0.5,
    side: THREE.BackSide,
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.rotation.z = Math.PI / 2;
  hull.position.set(0, 1, -0.5);
  cockpit.add(hull);

  // --- Ceiling dome ---
  const domeGeo = new THREE.SphereGeometry(
    2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2
  );
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.3,
    side: THREE.BackSide,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.set(0, 1, -0.5);
  dome.rotation.x = Math.PI;
  cockpit.add(dome);

  // --- Floor ---
  const floorGeo = new THREE.CircleGeometry(2, 24);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -0.5);
  cockpit.add(floor);

  // --- Back wall (solid, behind the player) ---
  const backGeo = new THREE.CircleGeometry(2, 24);
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.4,
    side: THREE.FrontSide,
  });
  const back = new THREE.Mesh(backGeo, backMat);
  back.rotation.y = Math.PI / 2;
  back.position.set(0, 1, 1);
  cockpit.add(back);

  // --- Dashboard console ---
  const dashGroup = new THREE.Group();

  const panelGeo = new THREE.BoxGeometry(2.4, 0.6, 0.15);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.6,
    metalness: 0.6,
  });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 0.75, -1.2);
  panel.rotation.x = -0.2;
  dashGroup.add(panel);

  // Top surface
  const topGeo = new THREE.BoxGeometry(2.2, 0.05, 0.5);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.5,
    metalness: 0.5,
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(0, 1.05, -1.1);
  dashGroup.add(top);

  // Indicator buttons
  const colors = [0xcc3333, 0x33cc33, 0x3366cc, 0xcccc33];
  colors.forEach((col, i) => {
    const geo = new THREE.BoxGeometry(0.15, 0.15, 0.05);
    const mat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.4,
      metalness: 0.3,
      emissive: col,
      emissiveIntensity: 0.3,
    });
    const btn = new THREE.Mesh(geo, mat);
    btn.position.set(-0.6 + i * 0.4, 0.85, -1.05);
    btn.rotation.x = -0.2;
    dashGroup.add(btn);
  });

  cockpit.add(dashGroup);

  // --- Seat ---
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x443322,
    roughness: 0.9,
    metalness: 0,
  });

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.7), seatMat);
  cushion.position.set(0, 0.45, 0.5);
  cockpit.add(cushion);

  const backrest = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.7, 0.1),
    seatMat
  );
  backrest.position.set(0, 0.8, 0.85);
  backrest.rotation.x = 0.1;
  cockpit.add(backrest);

  // --- Viewport window frame ---
  const frameGeo = new THREE.TorusGeometry(1, 0.12, 12, 24);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.4,
    metalness: 0.8,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.rotation.y = Math.PI / 2;
  frame.position.set(0, 1, -2);
  cockpit.add(frame);

  // --- Viewport glass (tinted, transparent) ---
  const glassGeo = new THREE.CircleGeometry(1, 24);
  const glassMat = new THREE.MeshBasicMaterial({
    color: 0x88aacc,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(0, 1, -2);
  cockpit.add(glass);

  // --- Periscope tube ---
  const scopeMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.5,
    metalness: 0.7,
  });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12), scopeMat);
  tube.position.set(0, 2.8, -0.5);
  cockpit.add(tube);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.25), scopeMat);
  head.position.set(0, 3.4, -0.3);
  cockpit.add(head);

  // Periscope window
  const pWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.12, 0.18),
    new THREE.MeshBasicMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.5 })
  );
  pWindow.position.set(0.22, 3.4, -0.28);
  cockpit.add(pWindow);

  return cockpit;
}
