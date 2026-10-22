import * as THREE from 'three';

/**
 * 3D Low-Poly Procedural Models for 5 Tourist Spot Categories
 * Built according to Three.js quality standard: 3–12 part THREE.Group compositions.
 */

// Materials cache
const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.6 });
const matRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.1 });
const matCyan = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4, metalness: 0.2 });
const matPink = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.4, metalness: 0.1 });
const matWhite = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6, metalness: 0.1 });
const matDarkGreen = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.8, metalness: 0.05, flatShading: true });
const matBrightGreen = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7, metalness: 0.05, flatShading: true });
const matBrown = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85, metalness: 0.05 });
const matBamboo = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7, metalness: 0.1 });
const matCornYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5, metalness: 0.1, flatShading: true });
const matCornHusk = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.7, metalness: 0.05 });
const matMetalFrame = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.8 });

/**
 * 1. 休閒樂園 (Landmark): 彩色摩天輪
 * A-frame stand, central rotating hub, circular spoke rim, 8 colored gondolas
 */
export function createFerrisWheel(): { group: THREE.Group; update: (time: number) => void } {
  const root = new THREE.Group();

  // A-frame stands (left and right)
  const legGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.3, 6);
  const leftLeg = new THREE.Mesh(legGeo, matMetalFrame);
  leftLeg.position.set(-0.25, 0.6, 0);
  leftLeg.rotation.z = -0.22;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, matMetalFrame);
  rightLeg.position.set(0.25, 0.6, 0);
  rightLeg.rotation.z = 0.22;
  root.add(rightLeg);

  // Wheel Rotating Assembly
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 1.15, 0);

  // Hub
  const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, matGold);
  wheelGroup.add(hub);

  // Outer rim
  const rimGeo = new THREE.TorusGeometry(0.65, 0.035, 8, 24);
  const rim = new THREE.Mesh(rimGeo, matMetalFrame);
  wheelGroup.add(rim);

  // Inner rim
  const innerRimGeo = new THREE.TorusGeometry(0.35, 0.025, 8, 20);
  const innerRim = new THREE.Mesh(innerRimGeo, matMetalFrame);
  wheelGroup.add(innerRim);

  // Spokes & Gondolas
  const gondolaColors = [matRed, matCyan, matGold, matPink, matBrightGreen, matWhite, matRed, matCyan];
  const gondolaMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    // Spoke spoke line
    const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 4);
    const spoke = new THREE.Mesh(spokeGeo, matMetalFrame);
    spoke.position.set(Math.cos(angle) * 0.325, Math.sin(angle) * 0.325, 0);
    spoke.rotation.z = angle - Math.PI / 2;
    wheelGroup.add(spoke);

    // Gondola
    const gondolaGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const gondola = new THREE.Mesh(gondolaGeo, gondolaColors[i % gondolaColors.length]);
    gondola.position.set(Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0);
    wheelGroup.add(gondola);
    gondolaMeshes.push(gondola);
  }

  root.add(wheelGroup);

  return {
    group: root,
    update: (time: number) => {
      wheelGroup.rotation.z = time * 0.8;
      // Counter-rotate gondolas so passengers stay upright
      for (const g of gondolaMeshes) {
        g.rotation.z = -wheelGroup.rotation.z;
      }
    },
  };
}

/**
 * 2. 壯麗自然 (Nature): 三角錐山
 * Triangular pyramid mountain: left side bright green, right side dark green, white snow peak cap
 */
export function createNatureMountain(): { group: THREE.Group; update?: (time: number) => void } {
  const root = new THREE.Group();

  // Create custom dual-tone mountain geometry with left/right distinct faces
  const mountainGeo = new THREE.BufferGeometry();
  // Vertices for a 4-sided pyramid: Peak, Front, Right, Back, Left
  // We explicitly create triangles with distinct normal & material indices or vertex colors
  const peak = [0, 1.35, 0];
  const front = [0, 0, 0.7];
  const right = [0.65, 0, 0];
  const back = [0, 0, -0.6];
  const left = [-0.65, 0, 0];

  // Triangles: Left side (Bright green), Right side (Dark green), Front & Back
  const positions = new Float32Array([
    // Front face
    ...peak, ...left, ...front,
    ...peak, ...front, ...right,
    // Back face
    ...peak, ...right, ...back,
    ...peak, ...back, ...left,
    // Bottom
    ...left, ...back, ...right,
    ...left, ...right, ...front,
  ]);

  const colors = new Float32Array([
    // Front-left: Bright Green
    0.06, 0.82, 0.52,  0.06, 0.82, 0.52,  0.06, 0.82, 0.52,
    // Front-right: Deep Forest Green
    0.02, 0.42, 0.30,  0.02, 0.42, 0.30,  0.02, 0.42, 0.30,
    // Back-right: Dark Green
    0.02, 0.38, 0.25,  0.02, 0.38, 0.25,  0.02, 0.38, 0.25,
    // Back-left: Medium Green
    0.08, 0.70, 0.45,  0.08, 0.70, 0.45,  0.08, 0.70, 0.45,
    // Bottom: earthy dark
    0.1, 0.2, 0.1,  0.1, 0.2, 0.1,  0.1, 0.2, 0.1,
    0.1, 0.2, 0.1,  0.1, 0.2, 0.1,  0.1, 0.2, 0.1,
  ]);

  mountainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mountainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  mountainGeo.computeVertexNormals();

  const mountainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.8,
    metalness: 0.05,
  });
  const mountainMesh = new THREE.Mesh(mountainGeo, mountainMat);
  root.add(mountainMesh);

  // Snow Cap on Top
  const snowGeo = new THREE.ConeGeometry(0.24, 0.38, 5);
  snowGeo.translate(0, 1.18, 0);
  const snowMesh = new THREE.Mesh(snowGeo, matWhite);
  root.add(snowMesh);

  // Secondary foothill ridge
  const subCone = new THREE.ConeGeometry(0.38, 0.65, 4);
  subCone.rotateY(0.4);
  const subMountain = new THREE.Mesh(subCone, matDarkGreen);
  subMountain.position.set(0.42, 0.32, 0.2);
  root.add(subMountain);

  return { group: root };
}

/**
 * 3. 人文古蹟 (Culture): 美濃紙傘
 * Oil-paper umbrella: bamboo handle/spokes, white canopy with traditional red/gold plum painted motifs
 */
export function createOilPaperUmbrella(): { group: THREE.Group; update?: (time: number) => void } {
  const root = new THREE.Group();

  // Umbrella Shaft / Bamboo Cane
  const shaftGeo = new THREE.CylinderGeometry(0.025, 0.028, 1.1, 8);
  const shaft = new THREE.Mesh(shaftGeo, matBamboo);
  shaft.position.set(0, 0.55, 0);
  root.add(shaft);

  // Bamboo Handle Curve at base
  const handleGeo = new THREE.TorusGeometry(0.06, 0.025, 6, 12, Math.PI);
  handleGeo.rotateZ(Math.PI);
  const handle = new THREE.Mesh(handleGeo, matBamboo);
  handle.position.set(0.06, 0.05, 0);
  root.add(handle);

  // Top Ferrule (Golden spire)
  const tipGeo = new THREE.ConeGeometry(0.04, 0.15, 8);
  tipGeo.translate(0, 1.18, 0);
  const tip = new THREE.Mesh(tipGeo, matGold);
  root.add(tip);

  // Canopy (White with conical slight curve)
  const canopyGeo = new THREE.ConeGeometry(0.68, 0.32, 16, 1, true);
  canopyGeo.translate(0, 0.98, 0);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf0,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  root.add(canopy);

  // Traditional Red Floral Ring (Painted motif on white umbrella)
  const decorRingGeo = new THREE.TorusGeometry(0.42, 0.03, 6, 16);
  decorRingGeo.rotateX(Math.PI / 2);
  decorRingGeo.translate(0, 0.92, 0);
  const decorRing = new THREE.Mesh(decorRingGeo, matRed);
  root.add(decorRing);

  // Umbrella Ribs (Visible underneath)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const ribGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.45, 4);
    const rib = new THREE.Mesh(ribGeo, matBamboo);
    rib.position.set(Math.cos(angle) * 0.22, 0.9, Math.sin(angle) * 0.22);
    rib.rotation.y = angle;
    rib.rotation.z = 0.5;
    root.add(rib);
  }

  // Tilt slightly for graceful posture
  root.rotation.z = -0.25;
  root.rotation.x = 0.15;

  return { group: root };
}

/**
 * 4. 夜市美食 (Food): 黃色玉米
 * Roasted golden corn: textured yellow kernels, green husk leaves peeled open, wooden skewer
 */
export function createNightMarketCorn(): { group: THREE.Group; update?: (time: number) => void } {
  const root = new THREE.Group();

  // Skewer stick
  const stickGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6);
  const stick = new THREE.Mesh(stickGeo, matBamboo);
  stick.position.set(0, 0.18, 0);
  root.add(stick);

  // Corn Cob Main Body (Golden Yellow)
  const cobGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.82, 10);
  cobGeo.translate(0, 0.72, 0);
  const cob = new THREE.Mesh(cobGeo, matCornYellow);
  root.add(cob);

  // Rounded tip
  const topGeo = new THREE.SphereGeometry(0.18, 8, 6);
  topGeo.translate(0, 1.13, 0);
  const top = new THREE.Mesh(topGeo, matCornYellow);
  root.add(top);

  // 3-4 Leafy green husk pieces curled outward at the base
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const huskGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
    const husk = new THREE.Mesh(huskGeo, matCornHusk);
    husk.position.set(Math.cos(angle) * 0.2, 0.42, Math.sin(angle) * 0.2);
    husk.rotation.y = angle;
    husk.rotation.z = 0.45;
    root.add(husk);
  }

  // Slight tilt for tasty casual presentation
  root.rotation.z = 0.15;
  root.rotation.y = 0.3;

  return { group: root };
}

/**
 * 5. 海岸海島 (Coast): 椰子樹
 * Segmented curved brown trunk, 6 green arching palm fronds, 3 coconuts
 */
export function createPalmTree(): { group: THREE.Group; update?: (time: number) => void } {
  const root = new THREE.Group();

  // Trunk: curved segmented cylinders
  const trunkGroup = new THREE.Group();
  const segmentCount = 5;
  let currentY = 0;
  let currentX = 0;

  for (let i = 0; i < segmentCount; i++) {
    const segHeight = 0.24;
    const rBottom = 0.1 - i * 0.012;
    const rTop = 0.088 - i * 0.012;
    const segGeo = new THREE.CylinderGeometry(rTop, rBottom, segHeight, 7);
    const seg = new THREE.Mesh(segGeo, matBrown);
    seg.position.set(currentX, currentY + segHeight / 2, 0);
    seg.rotation.z = -0.06;
    trunkGroup.add(seg);

    currentY += segHeight * 0.95;
    currentX += 0.045;
  }
  root.add(trunkGroup);

  // Crown of 6 Palm Fronds arching outward
  const crown = new THREE.Group();
  crown.position.set(currentX, currentY, 0);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const frondGeo = new THREE.ConeGeometry(0.16, 0.65, 4);
    frondGeo.translate(0, 0.32, 0);
    const frond = new THREE.Mesh(frondGeo, matBrightGreen);
    frond.position.set(0, 0, 0);
    frond.rotation.y = angle;
    frond.rotation.x = 1.15; // Arch downward like real palm leaves
    crown.add(frond);
  }

  // 3 Coconuts at crown center
  for (let i = 0; i < 3; i++) {
    const cAngle = (i / 3) * Math.PI * 2 + 0.3;
    const coconutGeo = new THREE.SphereGeometry(0.065, 6, 6);
    const coconut = new THREE.Mesh(coconutGeo, matBrown);
    coconut.position.set(Math.cos(cAngle) * 0.08, -0.04, Math.sin(cAngle) * 0.08);
    crown.add(coconut);
  }

  root.add(crown);

  return { group: root };
}

/**
 * Factory dispatcher to build category model
 */
export function createCategoryModel(category: 'Landmark' | 'Nature' | 'Culture' | 'Food' | 'Coast'): {
  group: THREE.Group;
  update?: (time: number) => void;
} {
  switch (category) {
    case 'Landmark':
      return createFerrisWheel();
    case 'Nature':
      return createNatureMountain();
    case 'Culture':
      return createOilPaperUmbrella();
    case 'Food':
      return createNightMarketCorn();
    case 'Coast':
      return createPalmTree();
  }
}
