import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Spot } from '../data/spotsData';
import { createCategoryModel } from './models3D';
import { Compass, Eye, Maximize2, Minimize2, MoveDown, MoveUp, RotateCcw, Sparkles, Sun, Sunset, Moon, MapPin, CheckCircle2 } from 'lucide-react';
import { playUiClick } from '../utils/audio';

export type AtmosphereMode = 'day' | 'sunset' | 'night';

interface TaiwanMap3DProps {
  spots: Spot[];
  collectedIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  selectedRegion: string;
  onSelectRegion: (reg: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

// Coordinate mapping from Taiwan GPS to 3D world space
export function gpsToWorld(lng: number, lat: number): { x: number; z: number } {
  const centerLng = 120.95;
  const centerLat = 23.75;
  const scale = 11.2;
  const x = (lng - centerLng) * scale;
  const z = -(lat - centerLat) * scale;
  return { x, z };
}

export const TaiwanMap3D: React.FC<TaiwanMap3DProps> = ({
  spots,
  collectedIds,
  onSelectSpot,
  selectedRegion,
  onSelectRegion,
  selectedCategory,
  onSelectCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [is2DView, setIs2DView] = useState(false);
  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('day');
  const [hoveredSpot, setHoveredSpot] = useState<Spot | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // References to keep Three.js state consistent across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const spotMarkersMapRef = useRef<Map<string, { group: THREE.Group; beacon: THREE.Mesh; update?: (t: number) => void }>>(new Map());
  const raycastTargetsRef = useRef<THREE.Object3D[]>([]);

  // Lighting references for atmosphere transitions
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const oceanMeshRef = useRef<THREE.Mesh | null>(null);
  const starsGroupRef = useRef<THREE.Points | null>(null);

  // Target camera state for smooth transitions
  const targetCamPos = useRef(new THREE.Vector3(0, 26, 30));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioningCam = useRef(false);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Detect software GL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(0, 26, 30);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent dipping beneath ocean plane
    controls.minDistance = 6;
    controls.maxDistance = 85;
    controls.target.set(0, 0, 0);

    controls.addEventListener('start', () => {
      isTransitioningCam.current = false;
    });

    // 1. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x38bdf8, 1.2);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    dirLight.position.set(18, 32, 22);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 5;
      dirLight.shadow.camera.far = 100;
      dirLight.shadow.camera.left = -28;
      dirLight.shadow.camera.right = 28;
      dirLight.shadow.camera.top = 28;
      dirLight.shadow.camera.bottom = -28;
      dirLight.shadow.bias = -0.0004;
    }
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 2. Ocean Floor & Water Surface
    const oceanGeo = new THREE.PlaneGeometry(240, 240, 48, 48);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -0.15;
    oceanMesh.receiveShadow = !isSoftwareGl;
    scene.add(oceanMesh);
    oceanMeshRef.current = oceanMesh;

    // Soft Bathymetry / Coastal Shelf Glow Plane
    const shelfGeo = new THREE.PlaneGeometry(55, 75);
    shelfGeo.rotateX(-Math.PI / 2);
    const shelfMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.position.set(0, -0.14, 0);
    scene.add(shelfMesh);

    // 3. Procedural Starfield for Night mode
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 90 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9); // upper hemisphere
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsGroupRef.current = stars;

    // 4. Taiwan Main Island Polygon & Central Mountain Range Elevation
    buildTaiwanTerrain(scene);

    // 5. Build Outer Islands (Penghu, Green Island, Orchid Island, Kinmen, Matsu)
    buildOutlyingIslands(scene);

    // 6. Build Spot Markers
    buildSpotMarkers(scene, spots);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const renderTick = () => {
      animId = requestAnimationFrame(renderTick);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera transition if active
      if (isTransitioningCam.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.08);
        controlsRef.current.target.lerp(targetLookAt.current, 0.08);
        controlsRef.current.update();

        if (
          cameraRef.current.position.distanceTo(targetCamPos.current) < 0.1 &&
          controlsRef.current.target.distanceTo(targetLookAt.current) < 0.1
        ) {
          isTransitioningCam.current = false;
        }
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Update spot 3D models (e.g. rotating ferris wheels & hovering)
      spotMarkersMapRef.current.forEach((item, _) => {
        if (item.update) item.update(elapsed);
        // Beacon pulse
        const scale = 1 + Math.sin(elapsed * 3.5) * 0.15;
        item.beacon.scale.set(scale, 1, scale);
      });

      // Ocean subtle wave ripple effect
      if (oceanMeshRef.current) {
        oceanMeshRef.current.position.y = -0.15 + Math.sin(elapsed * 1.2) * 0.03;
      }

      renderer.render(scene, camera);
    };

    renderTick();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update atmosphere mode (Day / Sunset / Night)
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current || !oceanMeshRef.current) return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const hemi = hemiLightRef.current;
    const ocean = oceanMeshRef.current;
    const oceanMat = ocean.material as THREE.MeshStandardMaterial;
    const stars = starsGroupRef.current;

    if (atmosphere === 'day') {
      scene.background = new THREE.Color(0xdbeafe); // Soft sky blue
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.012);
      dir.color.set(0xfffbeb);
      dir.intensity = 2.2;
      dir.position.set(18, 32, 22);
      hemi.color.set(0xffffff);
      hemi.groundColor.set(0x38bdf8);
      hemi.intensity = 1.2;
      oceanMat.color.set(0x0284c7);
      oceanMat.roughness = 0.22;
      if (stars) (stars.material as THREE.PointsMaterial).opacity = 0;
    } else if (atmosphere === 'sunset') {
      scene.background = new THREE.Color(0xfdba74); // Golden orange amber
      scene.fog = new THREE.FogExp2(0xfdba74, 0.014);
      dir.color.set(0xfb923c); // Warm amber
      dir.intensity = 2.6;
      dir.position.set(-30, 14, 18); // Low angle sunset
      hemi.color.set(0xfef08a);
      hemi.groundColor.set(0x7c2d12);
      hemi.intensity = 1.0;
      oceanMat.color.set(0xb45309);
      oceanMat.roughness = 0.15;
      if (stars) (stars.material as THREE.PointsMaterial).opacity = 0;
    } else if (atmosphere === 'night') {
      scene.background = new THREE.Color(0x030712); // Deep midnight
      scene.fog = new THREE.FogExp2(0x030712, 0.015);
      dir.color.set(0x38bdf8); // Moonlight blue
      dir.intensity = 0.7;
      dir.position.set(12, 28, -20);
      hemi.color.set(0x1e1b4b);
      hemi.groundColor.set(0x09090b);
      hemi.intensity = 0.6;
      oceanMat.color.set(0x021727);
      oceanMat.roughness = 0.1;
      if (stars) (stars.material as THREE.PointsMaterial).opacity = 0.95;
    }
  }, [atmosphere]);

  // Update spot markers visibility & styling based on filters and collection status
  useEffect(() => {
    spotMarkersMapRef.current.forEach((item, spotId) => {
      const spot = spots.find((s) => s.id === spotId);
      if (!spot) return;

      const matchRegion = selectedRegion === 'all' || spot.region === selectedRegion;
      const matchCat = selectedCategory === 'all' || spot.category === selectedCategory;
      const visible = matchRegion && matchCat;

      item.group.visible = visible;

      // Check collection state
      const isCollected = collectedIds.has(spotId);
      const beaconMat = item.beacon.material as THREE.MeshBasicMaterial;
      if (isCollected) {
        beaconMat.color.set(0xef4444); // Vermilion red for collected
      } else {
        beaconMat.color.set(0x38bdf8); // Cyan for uncollected
      }
    });
  }, [spots, selectedRegion, selectedCategory, collectedIds]);

  // Handle 3D / 2D Camera View Toggle
  const toggleViewMode = () => {
    playUiClick();
    if (!cameraRef.current || !controlsRef.current) return;
    const newIs2D = !is2DView;
    setIs2DView(newIs2D);

    isTransitioningCam.current = true;
    if (newIs2D) {
      // 2D Top-down view straight from above
      targetCamPos.current.set(0, 48, 0.01);
      targetLookAt.current.set(0, 0, 0);
    } else {
      // 3D Perspective isometric angled view
      targetCamPos.current.set(0, 26, 30);
      targetLookAt.current.set(0, 0, 0);
    }
  };

  // Nav controls: shift North or South
  const shiftCenter = (direction: 'north' | 'south') => {
    playUiClick();
    if (!controlsRef.current || !cameraRef.current) return;
    const deltaZ = direction === 'north' ? -6 : 6;
    isTransitioningCam.current = true;
    targetLookAt.current.copy(controlsRef.current.target).add(new THREE.Vector3(0, 0, deltaZ));
    targetCamPos.current.copy(cameraRef.current.position).add(new THREE.Vector3(0, 0, deltaZ));
  };

  // Zoom In / Zoom Out
  const zoomMap = (inOrOut: 'in' | 'out') => {
    playUiClick();
    if (!cameraRef.current || !controlsRef.current) return;
    const dir = new THREE.Vector3().subVectors(controlsRef.current.target, cameraRef.current.position).normalize();
    const factor = inOrOut === 'in' ? 7 : -7;
    isTransitioningCam.current = true;
    targetCamPos.current.copy(cameraRef.current.position).addScaledVector(dir, factor);
    targetLookAt.current.copy(controlsRef.current.target);
  };

  // Reset View
  const resetView = () => {
    playUiClick();
    setIs2DView(false);
    isTransitioningCam.current = true;
    targetCamPos.current.set(0, 26, 30);
    targetLookAt.current.set(0, 0, 0);
  };

  // Raycasting for Mouse / Touch interaction on Spot Markers
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const visibleTargets = raycastTargetsRef.current.filter((o) => o.parent?.visible);
    const intersects = raycaster.intersectObjects(visibleTargets, false);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const spotId = hitObj.userData.spotId;
      const foundSpot = spots.find((s) => s.id === spotId);
      if (foundSpot) {
        setHoveredSpot(foundSpot);
        setHoverPos({ x: e.clientX, y: e.clientY });
        containerRef.current.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredSpot(null);
    setHoverPos(null);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // only left click
    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const visibleTargets = raycastTargetsRef.current.filter((o) => o.parent?.visible);
    const intersects = raycaster.intersectObjects(visibleTargets, false);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const spotId = hitObj.userData.spotId;
      const foundSpot = spots.find((s) => s.id === spotId);
      if (foundSpot) {
        playUiClick();
        onSelectSpot(foundSpot);
      }
    }
  };

  /**
   * Helper: Build Taiwan Main Island Polygon with procedural mountain topography
   */
  function buildTaiwanTerrain(scene: THREE.Scene) {
    // Taiwan coastline polygon coordinates (GPS Lng/Lat) in counter-clockwise order
    const rawOutline: [number, number][] = [
      // North
      [121.50, 25.30], // Shimen / Cape Fugui
      [121.68, 25.22], // Yehliu
      [121.75, 25.14], // Keelung
      [121.92, 25.01], // Cape San Diego (Fugui/Sandiao)
      // East Coast (Rocky & precipitous)
      [121.84, 24.84], // Yilan Toucheng
      [121.86, 24.62], // Suao
      [121.70, 24.30], // Heping / Qingshui
      [121.62, 23.98], // Hualien City
      [121.56, 23.60], // Fengbin
      [121.42, 23.15], // Chenggong / Sanxiantai
      [121.16, 22.75], // Taitung City
      [120.98, 22.40], // Dawu
      // South (Hengchun Peninsula)
      [120.85, 21.90], // Eluanbi
      [120.73, 21.94], // Maobitou / Kenting
      [120.70, 22.10], // Checheng
      [120.62, 22.38], // Fangliao
      // West Coast (Gentle alluvial plains)
      [120.44, 22.50], // Donggang
      [120.27, 22.62], // Kaohsiung
      [120.17, 23.00], // Tainan Anping
      [120.10, 23.20], // Beimen
      [120.14, 23.60], // Chiayi Dongshi
      [120.25, 23.85], // Yunlin Mailiao
      [120.40, 24.10], // Changhua Lukang
      [120.55, 24.32], // Taichung Qingshui
      [120.70, 24.60], // Miaoli Houlong
      [120.92, 24.84], // Hsinchu Nanliao
      [121.15, 25.08], // Taoyuan Guanyin
      [121.36, 25.18], // Bali / Tamsui River
    ];

    // Convert GPS polygon to 2D Shape in Three.js
    const shape = new THREE.Shape();
    rawOutline.forEach(([lng, lat], i) => {
      const { x, z } = gpsToWorld(lng, lat);
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    });

    // Extrude geometry to create 3D landmass block
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 1.4,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.35,
      bevelThickness: 0.35,
    };

    const terrainGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    terrainGeo.rotateX(Math.PI / 2); // align to X-Z plane

    // Procedural Elevation for Central Mountain Range (中央山脈脊線)
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      if (vy > 0.1) {
        // Taiwan spine is approximately x between -1.5 and 2.5, z between -14 and 14
        const distFromSpine = Math.abs(vx - 0.4);
        const spineInfluence = Math.max(0, 1 - distFromSpine / 3.8);

        // Ridge altitude drops towards north and south tips
        const lengthFactor = Math.cos((vz / 20) * (Math.PI / 2));
        if (lengthFactor > 0) {
          const mountainHeight = spineInfluence * lengthFactor * 2.2;
          pos.setY(i, vy + mountainHeight);
        }
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Rich Taiwanese Emerald Island Green
      roughness: 0.75,
      metalness: 0.08,
      flatShading: true,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.y = 0;
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Island Coast Edge Foam / Shore highlight
    const coastEdgeMat = new THREE.LineBasicMaterial({ color: 0x93c5fd, linewidth: 2 });
    const edgeGeo = new THREE.EdgesGeometry(terrainGeo, 40);
    const edgeLines = new THREE.LineSegments(edgeGeo, coastEdgeMat);
    edgeLines.position.copy(terrainMesh.position);
    edgeLines.position.y += 0.02;
    scene.add(edgeLines);
  }

  /**
   * Helper: Build Outlying Islands (Penghu, Green Island, Orchid Island, Kinmen, Matsu)
   */
  function buildOutlyingIslands(scene: THREE.Scene) {
    const islands = [
      { name: 'Penghu', lng: 119.55, lat: 23.57, rx: 1.2, rz: 1.8 },
      { name: 'GreenIsland', lng: 121.49, lat: 22.66, rx: 0.45, rz: 0.5 },
      { name: 'OrchidIsland', lng: 121.55, lat: 22.04, rx: 0.6, rz: 0.75 },
      { name: 'Kinmen', lng: 118.35, lat: 24.44, rx: 1.1, rz: 0.8 },
      { name: 'Matsu', lng: 119.93, lat: 26.15, rx: 0.7, rz: 0.6 },
    ];

    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
    });

    islands.forEach((isl) => {
      const { x, z } = gpsToWorld(isl.lng, isl.lat);
      const geo = new THREE.CylinderGeometry(isl.rx, isl.rx * 1.2, 0.9, 8);
      const mesh = new THREE.Mesh(geo, islandMat);
      mesh.position.set(x, 0.4, z);
      mesh.scale.set(1, 1, isl.rz / isl.rx);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    });
  }

  /**
   * Helper: Build 3D Spot Markers with Thematic Models
   */
  function buildSpotMarkers(scene: THREE.Scene, spotsList: Spot[]) {
    spotMarkersMapRef.current.clear();
    raycastTargetsRef.current = [];

    const hitGeo = new THREE.SphereGeometry(0.9, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    spotsList.forEach((spot) => {
      const { x, z } = gpsToWorld(spot.lng, spot.lat);
      const markerGroup = new THREE.Group();
      markerGroup.position.set(x, 1.2, z);

      // 1. Beacon ring on ground
      const beaconGeo = new THREE.RingGeometry(0.2, 0.55, 16);
      beaconGeo.rotateX(-Math.PI / 2);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 0.05;
      markerGroup.add(beacon);

      // 2. Thematic 3D category model (scaled appropriately for map)
      const modelObj = createCategoryModel(spot.category);
      modelObj.group.scale.set(0.72, 0.72, 0.72);
      modelObj.group.position.y = 0.2;
      markerGroup.add(modelObj.group);

      // 3. Invisible sphere for effortless raycasting hit testing
      const hitSphere = new THREE.Mesh(hitGeo, hitMat);
      hitSphere.position.y = 0.6;
      hitSphere.userData = { spotId: spot.id };
      markerGroup.add(hitSphere);
      raycastTargetsRef.current.push(hitSphere);

      scene.add(markerGroup);
      spotMarkersMapRef.current.set(spot.id, {
        group: markerGroup,
        beacon,
        update: modelObj.update,
      });
    });
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-900">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      />

      {/* Top Floating Glass Bar: Mode, Stats & Perspective Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Brand / Logo Pill */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-wide">台灣 3D 旅遊導覽</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                100 景點
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Taiwan 3D Travel Guide &amp; Stamp Passport</p>
          </div>
        </div>

        {/* Middle: Atmosphere Switcher (Day / Sunset / Night) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl pointer-events-auto">
          <button
            onClick={() => {
              playUiClick();
              setAtmosphere('day');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              atmosphere === 'day'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>日間清朗</span>
          </button>

          <button
            onClick={() => {
              playUiClick();
              setAtmosphere('sunset');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              atmosphere === 'sunset'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md scale-105'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sunset className="w-3.5 h-3.5" />
            <span>金黃夕陽</span>
          </button>

          <button
            onClick={() => {
              playUiClick();
              setAtmosphere('night');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              atmosphere === 'night'
                ? 'bg-indigo-600 text-white shadow-md scale-105'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
            <span>璀璨夜景</span>
          </button>
        </div>

        {/* Right: Perspective 3D/2D switch & Progress chip */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/85 hover:bg-slate-800 text-slate-200 rounded-2xl border border-slate-700/80 shadow-xl text-xs font-semibold transition-all active:scale-95"
            title="切換 3D 透視與 2D 俯視視角"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>{is2DView ? '2D 俯視中' : '3D 透視中'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/85 rounded-2xl border border-slate-700/80 shadow-xl text-xs">
            <CheckCircle2 className="w-4 h-4 text-rose-500" />
            <span className="text-slate-300">集章進度</span>
            <span className="font-bold text-rose-400">{collectedIds.size} / 100</span>
          </div>
        </div>
      </div>

      {/* Floating Hover Card Tooltip when hovering over a spot */}
      {hoveredSpot && hoverPos && (
        <div
          className="fixed z-40 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-3 shadow-2xl max-w-xs text-left min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {hoveredSpot.id}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  collectedIds.has(hoveredSpot.id)
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {collectedIds.has(hoveredSpot.id) ? '已收集此章' : '未收集'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1">{hoveredSpot.name}</h3>

            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{hoveredSpot.categoryName}</span>
              <span className="text-slate-400">{hoveredSpot.regionName}</span>
              <span className="text-amber-400 font-semibold">★ {hoveredSpot.rating}</span>
            </div>

            <p className="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 點擊進入景點並蓋上紀念章
            </p>
          </div>
        </div>
      )}

      {/* Screen Navigation Control Buttons (Floating on Right Edge) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => shiftCenter('north')}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="將地圖中心往北移動"
        >
          <MoveUp className="w-5 h-5 text-emerald-400" />
        </button>

        <button
          onClick={() => shiftCenter('south')}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="將地圖中心往南移動"
        >
          <MoveDown className="w-5 h-5 text-emerald-400" />
        </button>

        <div className="h-px bg-slate-700/50 my-0.5" />

        <button
          onClick={() => zoomMap('in')}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-base font-bold"
          title="放大地圖"
        >
          <Maximize2 className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={() => zoomMap('out')}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-base font-bold"
          title="縮小地圖"
        >
          <Minimize2 className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={resetView}
          className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-xs font-bold"
          title="重設視角"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Ergonomic Collapsible Bottom Filter Dock (Zero Viewport Occlusion) */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 ${
          dockCollapsed ? 'translate-y-[calc(100%-32px)]' : 'translate-y-0'
        }`}
      >
        {/* Toggle Collapse Pill Button */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => {
              playUiClick();
              setDockCollapsed(!dockCollapsed);
            }}
            className="px-4 py-1 bg-slate-900/95 hover:bg-slate-800 text-slate-300 rounded-full border border-slate-700/80 shadow-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
          >
            {dockCollapsed ? '▴ 展開地圖篩選與分類' : '▾ 收起控制面版 (全螢幕漫遊)'}
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-3.5 space-y-2.5">
          {/* Row 1: Region Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> 區域：
            </span>
            {[
              { id: 'all', name: '全部全台' },
              { id: 'north', name: '北部地區' },
              { id: 'central', name: '中部地區' },
              { id: 'south', name: '南部地區' },
              { id: 'east', name: '東部地區' },
              { id: 'islands', name: '離島群島' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  playUiClick();
                  onSelectRegion(reg.id);
                }}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all font-medium ${
                  selectedRegion === reg.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {reg.name}
              </button>
            ))}
          </div>

          {/* Row 2: Category Filters with 3D Symbol Guides */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 造型分類：
            </span>
            {[
              { id: 'all', name: '全部分類', badge: '全部' },
              { id: 'Landmark', name: '休閒樂園', badge: '🎡 彩色摩天輪' },
              { id: 'Nature', name: '壯麗自然', badge: '⛰️ 雙色三角錐山' },
              { id: 'Culture', name: '人文古蹟', badge: '🏮 美濃油紙傘' },
              { id: 'Food', name: '夜市美食', badge: '🌽 碳烤黃金玉米' },
              { id: 'Coast', name: '海岸海島', badge: '🌴 熱帶椰子樹' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playUiClick();
                  onSelectCategory(cat.id);
                }}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cat.badge}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
