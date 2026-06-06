"use client";

import * as THREE from "three";

export default function StoneDish() {
  return (
    <group>
      {/* Base of the tray (Dark Obsidian/Charcoal Stone) */}
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 1.75, 0.1, 64]} />
        <meshStandardMaterial
          color="#18181b" // Dark zinc/obsidian grey
          roughness={0.95}
          metalness={0.1}
        />
      </mesh>

      {/* Raised rim */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[1.65, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#18181b"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
