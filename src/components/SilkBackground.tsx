"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function SilkBackground() {
  const meshRef1 = useRef<THREE.Mesh>(null);
  const meshRef2 = useRef<THREE.Mesh>(null);

  // Generate a displaced wavy geometry once
  const wavyGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(18, 14, 64, 64);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Beautiful complex organic waves
      const z = Math.sin(x * 0.3) * Math.cos(y * 0.25) * 1.2 + Math.sin(y * 0.15) * 0.5;
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Set up dark silk materials (smoke, charcoal, reflective, translucent)
  const materials = useMemo(() => {
    const silk1 = new THREE.MeshPhysicalMaterial({
      color: "#18181b", // Zinc 900 / dark obsidian charcoal
      roughness: 0.35,
      metalness: 0.2,
      transmission: 0.3, // Low transmission for moody dark atmosphere
      thickness: 1.0,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    const silk2 = new THREE.MeshPhysicalMaterial({
      color: "#09090b", // Zinc 950 / near black
      roughness: 0.4,
      metalness: 0.15,
      transmission: 0.25,
      thickness: 0.8,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });

    return { silk1, silk2 };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Slow organic movements simulating light wind in the void
    if (meshRef1.current) {
      meshRef1.current.rotation.z = Math.sin(time * 0.05) * 0.03;
      meshRef1.current.rotation.y = Math.cos(time * 0.08) * 0.05;
      meshRef1.current.position.z = -3.8 + Math.sin(time * 0.12) * 0.15;
    }

    if (meshRef2.current) {
      meshRef2.current.rotation.z = Math.cos(time * 0.04) * 0.04 - 0.2;
      meshRef2.current.rotation.y = Math.sin(time * 0.06) * 0.06;
      meshRef2.current.position.z = -5.0 + Math.cos(time * 0.1) * 0.2;
    }
  });

  return (
    <group>
      {/* Primary silk layer closer to the vortex */}
      <mesh ref={meshRef1} geometry={wavyGeometry} position={[0, 0, -3.8]} castShadow receiveShadow>
        <primitive object={materials.silk1} attach="material" />
      </mesh>

      {/* Secondary background layer for depth */}
      <mesh ref={meshRef2} geometry={wavyGeometry} position={[-2, -1, -5.0]} scale={[1.1, 1.1, 1]} receiveShadow>
        <primitive object={materials.silk2} attach="material" />
      </mesh>
    </group>
  );
}
