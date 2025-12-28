
import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { TreeState, HandData, PhotoItem } from '../types';

interface ThreeSceneProps {
  treeState: TreeState;
  handData: HandData;
  photos: PhotoItem[];
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ treeState, handData, photos }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    composer: EffectComposer;
    instancedMeshes: THREE.InstancedMesh[];
    photoMeshes: THREE.Mesh[];
  } | null>(null);

  const PARTICLE_COUNT = 3000;
  const colors = {
    matteGreen: new THREE.Color('#1B4D3E'),
    metallicGold: new THREE.Color('#D4AF37'),
    christmasRed: new THREE.Color('#D42426'),
  };

  // Precompute positions
  const positions = useMemo(() => {
    const tree = new Float32Array(PARTICLE_COUNT * 3);
    const scattered = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Tree Shape (Cone-ish)
      const ratio = i / PARTICLE_COUNT;
      const height = ratio * 12;
      const radius = (1 - ratio) * 5;
      const angle = ratio * Math.PI * 40 + (i % 3) * (Math.PI / 1.5);
      
      tree[i * 3] = Math.cos(angle) * radius;
      tree[i * 3 + 1] = height - 6;
      tree[i * 3 + 2] = Math.sin(angle) * radius;

      // Scattered
      scattered[i * 3] = (Math.random() - 0.5) * 40;
      scattered[i * 3 + 1] = (Math.random() - 0.5) * 40;
      scattered[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return { tree, scattered };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Basic Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.015);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    mountRef.current.appendChild(renderer.domElement);

    // 2. Post-processing
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    );
    bloomPass.threshold = 0.21;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.55;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffd700, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 4. Instanced Meshes (Spheres, Cubes, Tubes)
    const geometries = [
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.BoxGeometry(0.15, 0.15, 0.15),
      new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8)
    ];

    const materials = [
      new THREE.MeshPhysicalMaterial({ color: colors.matteGreen, roughness: 0.8, metalness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ color: colors.metallicGold, roughness: 0.2, metalness: 0.9 }),
      new THREE.MeshPhysicalMaterial({ color: colors.christmasRed, roughness: 0.5, metalness: 0.3 })
    ];

    const instancedMeshes: THREE.InstancedMesh[] = [];
    geometries.forEach((geo, idx) => {
      const mesh = new THREE.InstancedMesh(geo, materials[idx], PARTICLE_COUNT / 3);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);
      instancedMeshes.push(mesh);
    });

    sceneRef.current = { renderer, scene, camera, composer, instancedMeshes, photoMeshes: [] };

    // 5. Animation Loop
    let lerpFactor = 0;
    const dummy = new THREE.Object3D();

    const animate = () => {
      requestAnimationFrame(animate);

      // Camera influence from hand
      if (handData.isDetected) {
        const targetX = (handData.position.x - 0.5) * 20;
        const targetY = -(handData.position.y - 0.5) * 20;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
      }

      // Smooth state transition
      const targetLerp = treeState === TreeState.CLOSED ? 0 : 1;
      lerpFactor += (targetLerp - lerpFactor) * 0.05;

      const time = Date.now() * 0.001;

      instancedMeshes.forEach((mesh, mIdx) => {
        for (let i = 0; i < mesh.count; i++) {
          const globalIdx = i * instancedMeshes.length + mIdx;
          const tx = positions.tree[globalIdx * 3];
          const ty = positions.tree[globalIdx * 3 + 1];
          const tz = positions.tree[globalIdx * 3 + 2];

          const sx = positions.scattered[globalIdx * 3];
          const sy = positions.scattered[globalIdx * 3 + 1];
          const sz = positions.scattered[globalIdx * 3 + 2];

          // Interpolate
          let px = THREE.MathUtils.lerp(tx, sx, lerpFactor);
          let py = THREE.MathUtils.lerp(ty, sy, lerpFactor);
          let pz = THREE.MathUtils.lerp(tz, sz, lerpFactor);

          // Add some noise when scattered
          if (lerpFactor > 0.1) {
             px += Math.sin(time + i) * 0.2 * lerpFactor;
             py += Math.cos(time + i * 1.5) * 0.2 * lerpFactor;
             pz += Math.sin(time + i * 2) * 0.2 * lerpFactor;
          }

          dummy.position.set(px, py, pz);
          dummy.rotation.set(time * 0.5 + i, time * 0.3 + i, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });

      // Update Photo Cloud
      if (sceneRef.current) {
        sceneRef.current.photoMeshes.forEach((mesh, idx) => {
           // Basic floating animation
           if (treeState === TreeState.CLOSED) {
             const angle = (idx / photos.length) * Math.PI * 2 + time * 0.2;
             const r = 4;
             mesh.position.lerp(new THREE.Vector3(Math.cos(angle) * r, (idx / photos.length) * 10 - 5, Math.sin(angle) * r), 0.05);
             mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
           } else if (treeState === TreeState.SCATTERED) {
             const seed = idx * 100;
             mesh.position.lerp(new THREE.Vector3(Math.sin(time * 0.5 + seed) * 10, Math.cos(time * 0.3 + seed) * 10, Math.sin(time * 0.2 + seed) * 10), 0.02);
             mesh.scale.lerp(new THREE.Vector3(1.5, 1.5, 1.5), 0.1);
           } else if (treeState === TreeState.ZOOMED) {
              // Highlight first photo or tracked photo
              if (idx === 0) {
                 mesh.position.lerp(new THREE.Vector3(0, 0, 10), 0.1);
                 mesh.scale.lerp(new THREE.Vector3(4, 4, 4), 0.1);
              } else {
                 mesh.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1);
              }
           }
           mesh.lookAt(camera.position);
        });
      }

      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [positions]);

  // Sync Photos
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, photoMeshes } = sceneRef.current;

    // Clear old photos
    photoMeshes.forEach(m => scene.remove(m));
    sceneRef.current.photoMeshes = [];

    const loader = new THREE.TextureLoader();
    photos.forEach(photo => {
      const texture = loader.load(photo.url);
      const geometry = new THREE.PlaneGeometry(1.5, 1.5);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true, 
        side: THREE.DoubleSide,
        opacity: 0.9 
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Random initial position
      mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      
      scene.add(mesh);
      sceneRef.current?.photoMeshes.push(mesh);
    });
  }, [photos]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ThreeScene;
