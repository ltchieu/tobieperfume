"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticlesProps {
  scrollProgress: number; // 0 to 1
  introPhase: "assembling" | "spraying" | "frozen" | "explored";
  isHoveredCTA: boolean;
}

interface InstancedParticleState {
  startX: number;
  startY: number;
  startZ: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
  seed: number;
  age: number;
  lastX: number;
  lastY: number;
  lastZ: number;
}

export default function Particles({ scrollProgress, introPhase, isHoveredCTA }: ParticlesProps) {
  const count = 200; // Reduced density to keep text readable and clean
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set up instance colors (50% Luxury Gold, 30% Warm Amber, 20% Crimson Sharingan Red)
  useEffect(() => {
    if (!meshRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      if (rand < 0.5) {
        color.set("#ffc83b"); // Luxury Gold
      } else if (rand < 0.8) {
        color.set("#ff7a00"); // Warm Amber
      } else {
        color.set("#ff0033"); // Crimson Sharingan Red
      }
      meshRef.current.setColorAt(i, color);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  // Initialize particle states
  const states = useMemo(() => {
    const list: InstancedParticleState[] = [];
    for (let i = 0; i < count; i++) {
      const startX = 0;
      const startY = 0;
      const startZ = 0; // Vortex center

      // Cone spray velocity towards positive Z (viewer)
      const angle = Math.random() * Math.PI * 2;
      const spread = 0.5 + Math.random() * 0.8;
      
      const vx = Math.cos(angle) * spread;
      const vy = Math.sin(angle) * spread;
      const vz = 2.5 + Math.random() * 4.5; // Fast eruption towards camera

      list.push({
        startX,
        startY,
        startZ,
        vx,
        vy,
        vz,
        scale: 0.015 + Math.random() * 0.025,
        seed: Math.random(),
        age: Math.random(),
        lastX: startX,
        lastY: startY,
        lastZ: startZ,
      });
    }
    return list;
  }, []);

  // Reset and stagger particle ages when entering "spraying" phase, and pre-disperse them when entering "frozen" phase for a grand mist cloud
  const lastPhase = useRef(introPhase);
  useEffect(() => {
    if (introPhase === "spraying" && lastPhase.current !== "spraying") {
      states.forEach((p) => {
        p.age = Math.random() * -0.25; // staggered start times
        p.lastX = p.startX;
        p.lastY = p.startY;
        p.lastZ = p.startZ;
      });
    } else if (
      (introPhase === "frozen" || introPhase === "explored") &&
      lastPhase.current === "spraying"
    ) {
      // Pre-disperse particles along their trajectory when freezing to prevent clumping at the center
      states.forEach((p) => {
        const age = 0.25 + Math.random() * 0.7; // random age between 0.25 and 0.95
        p.age = age;
        p.lastX = p.startX + p.vx * age;
        p.lastY = p.startY + p.vy * age;
        p.lastZ = p.startZ + p.vz * age;
      });
    }
    lastPhase.current = introPhase;
  }, [introPhase, states]);

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.7, 0), []);

  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      roughness: 0.1,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const p = states[i];

      if (introPhase === "assembling") {
        // 1. Swirling Vortex Assembly
        // Particles swirl in spiral paths towards the vortex center [0, 0, 0]
        const lifetime = 2.5;
        const progress = ((time * 0.45 + p.seed * lifetime) % lifetime) / lifetime;
        
        // Radius shrinks from outer ring to eye hole
        const startRad = 3.2;
        const endRad = 0.22;
        const r = THREE.MathUtils.lerp(startRad, endRad, progress);

        // Twisting spiral angle
        const spiralTwist = Math.PI * 5.0;
        const angle = p.seed * Math.PI * 2 + progress * spiralTwist;

        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        const pz = THREE.MathUtils.lerp(1.5, 0, progress);

        p.lastX = px;
        p.lastY = py;
        p.lastZ = pz;

        dummy.position.set(px, py, pz);

        // Glow and scale up
        const scaleVal = p.scale * Math.sin(progress * Math.PI) * 0.85;
        dummy.scale.setScalar(scaleVal);
        dummy.rotation.set(time * 3 + p.seed, time * 2, 0);

      } else if (introPhase === "spraying") {
        // 2. Kamui Eruption: spraying forward towards camera
        p.age += delta * 1.8;
        if (p.age > 1.0) {
          p.age = 0; // Loop back for continuous spray
        }

        let px = p.startX;
        let py = p.startY;
        let pz = p.startZ;
        let scaleVal = 0;

        if (p.age > 0) {
          px = p.startX + p.vx * p.age;
          py = p.startY + p.vy * p.age;
          pz = p.startZ + p.vz * p.age;
          scaleVal = p.scale * Math.sin(p.age * Math.PI) * 1.5;
        }

        p.lastX = px;
        p.lastY = py;
        p.lastZ = pz;

        dummy.position.set(px, py, pz);
        dummy.scale.setScalar(scaleVal);
        dummy.rotation.set(time * 2.5 + p.seed * 5, time * 3.5, 0);

      } else {
        // 3. Frozen / Explored (Time-freeze)
        const floatAmp = 0.04;
        let px = p.lastX + Math.sin(time * 0.8 + p.seed * 50) * floatAmp;
        let py = p.lastY + Math.cos(time * 0.6 + p.seed * 50) * floatAmp;
        let pz = p.lastZ + Math.sin(time * 0.5 + p.seed * 50) * floatAmp;

        // Instagram CTA Hover Pull: pull particles to the left
        if (isHoveredCTA && scrollProgress > 0.7) {
          const targetX = -3.8 + Math.sin(time * 4 + p.seed * 10) * 0.25;
          const targetY = -0.5 + Math.cos(time * 3 + p.seed * 10) * 0.25;
          
          const pullSpeed = 0.05 + p.seed * 0.05;
          p.lastX = THREE.MathUtils.lerp(p.lastX, targetX, pullSpeed);
          p.lastY = THREE.MathUtils.lerp(p.lastY, targetY, pullSpeed);
          p.lastZ = THREE.MathUtils.lerp(p.lastZ, 0, pullSpeed);
        }

        dummy.position.set(px, py, pz);

        // Fade on scroll progress
        let scaleVal = p.scale;
        if (scrollProgress > 0) {
          scaleVal *= Math.max(0, 1.0 - scrollProgress * 2.2);
        }
        dummy.scale.setScalar(scaleVal);

        dummy.rotation.set(time * 0.15 + p.seed, time * 0.2 + p.seed, 0);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
    />
  );
}

