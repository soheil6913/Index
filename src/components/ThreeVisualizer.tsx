import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RenderStyle } from '../types';

interface ThreeVisualizerProps {
  gridData: number[];
  phaseData: number[];
  width: number;
  length: number;
  zScale: number;
  renderStyle: RenderStyle;
  colorThreshold: number;
  maxDepthMeters: number;
  selectedNodeIndex: number | null;
  onSelectNode: (idx: number, x: number, y: number, adc: number, phase: number, depth: number) => void;
  sliceX?: number | null; // 0 to width - 1
  sliceY?: number | null; // 0 to length - 1
  autoRotate?: boolean;
}

// Convert ADC value (0 - 1024) to OKM Color Spectrum
export function getOkmSpectrumColor(adc: number, phase: number): THREE.Color {
  // Normalize 0..1024 to 0..1
  const norm = Math.min(Math.max(adc, 0), 1024) / 1024;

  let r = 0;
  let g = 0;
  let b = 0;

  if (norm < 0.28) {
    // Deep Cavity / Void (Blue / Dark Indigo)
    const t = norm / 0.28;
    r = 0.0;
    g = 0.1 + t * 0.4;
    b = 0.8 + t * 0.2;
  } else if (norm < 0.52) {
    // Normal Soil (Green / Turquoise)
    const t = (norm - 0.28) / 0.24;
    r = 0.0 + t * 0.2;
    g = 0.5 + t * 0.5;
    b = 0.6 - t * 0.6;
  } else if (norm < 0.72) {
    // Mineralization / Ferrous (Yellow / Orange)
    const t = (norm - 0.52) / 0.20;
    r = 0.2 + t * 0.8;
    g = 1.0 - t * 0.4;
    b = 0.0;
  } else {
    // High Metal / Gold Peak (Red / Gold)
    const t = (norm - 0.72) / 0.28;
    r = 1.0;
    g = 0.6 - t * 0.5;
    b = t * 0.3;
  }

  // Boost phase shift effect (Gold has high positive phase)
  if (phase > 30) {
    r = Math.min(1.0, r + 0.3);
    g = Math.min(1.0, g + 0.2);
  }

  return new THREE.Color(r, g, b);
}

export const ThreeVisualizer: React.FC<ThreeVisualizerProps> = ({
  gridData,
  phaseData,
  width,
  length,
  zScale,
  renderStyle,
  colorThreshold,
  maxDepthMeters,
  selectedNodeIndex,
  onSelectNode,
  sliceX = null,
  sliceY = null,
  autoRotate = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<{ x: number; y: number; adc: number; phase: number; depth: number } | null>(null);

  // Keep references to scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ yaw: Math.PI / 4, pitch: Math.PI / 6, distance: Math.max(width, length) * 1.8 });

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const rect = container.getBoundingClientRect();

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e14);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffd700, 0.8);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 0.5);
    dirLight2.position.set(-20, 20, -20);
    scene.add(dirLight2);

    // 5. Group for Ground Model
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Grid Floor Bounding Box Helper
    const boxGeo = new THREE.BoxGeometry(width, 0.1, length);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.5 });
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxLine = new THREE.LineSegments(boxEdges, boxMat);
    boxLine.position.set(0, -0.05, 0);
    meshGroup.add(boxLine);

    // Grid Floor Guide Lines
    const gridHelper = new THREE.GridHelper(Math.max(width, length), Math.max(width, length), 0xeab308, 0x1e293b);
    gridHelper.position.y = -0.1;
    meshGroup.add(gridHelper);

    // 6. Camera Positioning
    const updateCamera = () => {
      const { yaw, pitch, distance } = cameraRotationRef.current;
      const x = distance * Math.cos(pitch) * Math.sin(yaw);
      const y = distance * Math.sin(pitch);
      const z = distance * Math.cos(pitch) * Math.cos(yaw);

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    // 7. Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        cameraRotationRef.current.yaw += 0.005;
        updateCamera();
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Mouse / Touch Orbit Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraRotationRef.current.yaw -= deltaX * 0.008;
      cameraRotationRef.current.pitch = Math.max(
        0.05,
        Math.min(Math.PI / 2 - 0.05, cameraRotationRef.current.pitch + deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRotationRef.current.distance = Math.max(
        3,
        Math.min(100, cameraRotationRef.current.distance + e.deltaY * 0.015)
      );
      updateCamera();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newRect = mountRef.current.getBoundingClientRect();
      cameraRef.current.aspect = newRect.width / newRect.height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newRect.width, newRect.height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, length, autoRotate]);

  // Rebuild Ground Geometry when data/style/scales change
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    if (!meshGroup) return;

    // Clear existing mesh objects (keep floor box & grid helper)
    const objectsToRemove: THREE.Object3D[] = [];
    meshGroup.children.forEach((child) => {
      if (child.name === 'groundModel') {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach((obj) => meshGroup.remove(obj));

    const groundGroup = new THREE.Group();
    groundGroup.name = 'groundModel';

    const halfW = width / 2;
    const halfL = length / 2;

    if (renderStyle === '3d-mesh' || renderStyle === 'wireframe' || renderStyle === 'contour') {
      // Create PlaneGeometry with resolution width x length
      const geometry = new THREE.PlaneGeometry(width, length, width - 1, length - 1);
      geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

      const posAttr = geometry.attributes.position;
      const count = posAttr.count;
      const colors: number[] = [];

      for (let i = 0; i < count; i++) {
        const x = i % width;
        const y = Math.floor(i / width);
        const idx = y * width + x;

        const adc = gridData[idx] ?? 380;
        const phase = phaseData[idx] ?? 0;

        // Calculate elevation (z-scale offset)
        // High ADC = Peak up (+Y), Low ADC = Cavity down (-Y)
        const normAdc = (adc - 380) / 400; // -1 to +1 approx
        const yHeight = normAdc * zScale * 1.5;

        // Apply slice filtering
        let isVisible = true;
        if (sliceX !== null && x !== sliceX) isVisible = false;
        if (sliceY !== null && y !== sliceY) isVisible = false;

        posAttr.setY(i, isVisible ? yHeight : -100);

        // Color
        const color = getOkmSpectrumColor(adc, phase);
        colors.push(color.r, color.g, color.b);
      }

      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();

      if (renderStyle === 'wireframe') {
        const wireMat = new THREE.MeshBasicMaterial({
          vertexColors: true,
          wireframe: true
        });
        const mesh = new THREE.Mesh(geometry, wireMat);
        groundGroup.add(mesh);
      } else {
        const meshMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.3,
          metalness: 0.2,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, meshMat);
        groundGroup.add(mesh);

        // Add top wireframe outline overlay for technical feel
        const wireOverlayMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.12
        });
        const wireOverlay = new THREE.Mesh(geometry, wireOverlayMat);
        groundGroup.add(wireOverlay);
      }
    } else if (renderStyle === 'point-cloud') {
      const pointsGeo = new THREE.BufferGeometry();
      const positions: number[] = [];
      const colors: number[] = [];

      for (let y = 0; y < length; y++) {
        for (let x = 0; x < width; x++) {
          if (sliceX !== null && x !== sliceX) continue;
          if (sliceY !== null && y !== sliceY) continue;

          const idx = y * width + x;
          const adc = gridData[idx] ?? 380;
          const phase = phaseData[idx] ?? 0;

          const posX = x - halfW + 0.5;
          const posZ = y - halfL + 0.5;
          const posY = ((adc - 380) / 400) * zScale * 1.5;

          positions.push(posX, posY, posZ);

          const col = getOkmSpectrumColor(adc, phase);
          colors.push(col.r, col.g, col.b);
        }
      }

      pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const pointsMat = new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 0.95
      });

      const pointCloud = new THREE.Points(pointsGeo, pointsMat);
      groundGroup.add(pointCloud);
    } else if (renderStyle === 'voxel') {
      // Voxel blocks
      for (let y = 0; y < length; y++) {
        for (let x = 0; x < width; x++) {
          if (sliceX !== null && x !== sliceX) continue;
          if (sliceY !== null && y !== sliceY) continue;

          const idx = y * width + x;
          const adc = gridData[idx] ?? 380;
          const phase = phaseData[idx] ?? 0;

          const heightFactor = Math.max(0.1, Math.abs((adc - 380) / 300) * zScale + 0.2);
          const voxelGeo = new THREE.BoxGeometry(0.9, heightFactor, 0.9);

          const col = getOkmSpectrumColor(adc, phase);
          const voxelMat = new THREE.MeshStandardMaterial({
            color: col,
            roughness: 0.4,
            metalness: 0.3
          });

          const voxelMesh = new THREE.Mesh(voxelGeo, voxelMat);
          voxelMesh.position.set(
            x - halfW + 0.5,
            heightFactor / 2,
            y - halfL + 0.5
          );

          groundGroup.add(voxelMesh);
        }
      }
    }

    // Add Highlight Pin on Selected Node
    if (selectedNodeIndex !== null && selectedNodeIndex < width * length) {
      const selX = selectedNodeIndex % width;
      const selY = Math.floor(selectedNodeIndex / width);
      const selAdc = gridData[selectedNodeIndex] ?? 380;

      const pinGeo = new THREE.CylinderGeometry(0.05, 0.25, 1.2, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.8
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);

      const posY = ((selAdc - 380) / 400) * zScale * 1.5 + 0.6;
      pinMesh.position.set(selX - halfW + 0.5, posY, selY - halfL + 0.5);

      groundGroup.add(pinMesh);
    }

    meshGroup.add(groundGroup);
  }, [gridData, phaseData, width, length, zScale, renderStyle, colorThreshold, selectedNodeIndex, sliceX, sliceY]);

  // Click & Hover Raycaster to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !meshGroupRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(meshGroupRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0].point;
      const halfW = width / 2;
      const halfL = length / 2;

      const x = Math.min(width - 1, Math.max(0, Math.floor(hit.x + halfW)));
      const y = Math.min(length - 1, Math.max(0, Math.floor(hit.z + halfL)));
      const idx = y * width + x;

      const adc = gridData[idx] ?? 380;
      const phase = phaseData[idx] ?? 0;
      const depth = Math.round((maxDepthMeters * (1 - adc / 1024)) * 10) / 10;

      onSelectNode(idx, x, y, adc, phase, depth);
      setHoveredNodeInfo({ x, y, adc, phase, depth });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top 3D Control Overlay */}
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg p-2.5 text-xs text-white flex items-center gap-3 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-1.5 font-bold text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          موتور ۳بعدی WebGL
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="text-slate-300">
          ابعاد: <span className="font-mono text-cyan-400">{width}×{length}</span>
        </div>
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNodeInfo && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-amber-500/40 rounded-lg p-3 text-xs text-white shadow-xl max-w-xs space-y-1">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 flex justify-between">
            <span>مختصات نقطه (X: {hoveredNodeInfo.x + 1}, Y: {hoveredNodeInfo.y + 1})</span>
            <button onClick={() => setHoveredNodeInfo(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div>سیگنال ADC: <span className="text-cyan-400 font-bold">{hoveredNodeInfo.adc}</span></div>
            <div>اختلاف فاز: <span className="text-emerald-400 font-bold">{hoveredNodeInfo.phase}°</span></div>
            <div className="col-span-2">عمق تخمینی: <span className="text-amber-400 font-bold">{hoveredNodeInfo.depth} متر</span></div>
          </div>
        </div>
      )}

      {/* Compass Badge */}
      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
        <span className="text-amber-400 font-bold">N</span>
        <span className="text-slate-500">|</span>
        <span>چرخش با ماوس</span>
      </div>
    </div>
  );
};
