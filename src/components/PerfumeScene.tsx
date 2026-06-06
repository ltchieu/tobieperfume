"use client";

import { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import KamuiVortex from "./KamuiVortex";
import StoneDish from "./StoneDish";
import SilkBackground from "./SilkBackground";
import Particles from "./Particles";

gsap.registerPlugin(ScrollTrigger);

interface PerfumeSceneProps {
  isHoveredCTA: boolean;
  introPhase: "assembling" | "spraying" | "frozen" | "explored";
  setIntroPhase: (phase: "assembling" | "spraying" | "frozen" | "explored") => void;
  onAssembleComplete: () => void;
  onFreeze: () => void;
}

export default function PerfumeScene({
  isHoveredCTA,
  introPhase,
  setIntroPhase,
  onAssembleComplete,
  onFreeze,
}: PerfumeSceneProps) {
  const { size } = useThree();
  const isDesktop = size.width >= 768;

  // Refs for 3D groups animated by GSAP ScrollTrigger
  const vortexGroup = useRef<THREE.Group>(null);
  const shardsGroup = useRef<THREE.Group>(null);
  const dishGroup = useRef<THREE.Group>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  // Track scroll progress and dragging state
  const scrollProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const mousePosition = useRef({ x: 0, y: 0 });

  // Mouse Move listener for 3D tilt interaction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) return;
      mousePosition.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDragging]);

  // Dynamic core light intensity based on introPhase
  useEffect(() => {
    const light = coreLightRef.current;
    if (!light) return;

    if (introPhase === "assembling") {
      gsap.set(light, { intensity: 0.8 });
    } else if (introPhase === "spraying") {
      gsap.to(light, {
        intensity: 4.5,
        duration: 0.8,
        ease: "power2.in",
      });
    } else if (introPhase === "frozen") {
      gsap.to(light, {
        intensity: 2.0,
        duration: 0.6,
        ease: "power2.out",
      });
    }
  }, [introPhase]);

  // GSAP ScrollTrigger — Kamui Teleportation Warp
  useEffect(() => {
    const vortex = vortexGroup.current;
    const shards = shardsGroup.current;
    const dish = dishGroup.current;

    if (!vortex || !shards || !dish) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scrollytelling-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
          setScrollProgress(self.progress);

          if (self.progress > 0.02 && introPhase === "frozen") {
            setIntroPhase("explored");
          }
        },
      },
    });

    // Stage 0 → 1 (Hero to Decode Section 1):
    // Vortex slides to the left side of the screen, spinning, rather than disappearing.
    tl.to(vortex.position, {
      x: isDesktop ? -1.45 : 0,
      y: isDesktop ? 0 : 0.65,
      z: 0,
      duration: 1,
      ease: "power2.inOut",
    }, 0)
    .to(vortex.scale, {
      x: isDesktop ? 0.95 : 0.7,
      y: isDesktop ? 0.95 : 0.7,
      z: isDesktop ? 0.95 : 0.7,
      duration: 1,
      ease: "power2.inOut",
    }, 0)
    .to(vortex.rotation, {
      z: -Math.PI * 4,
      duration: 1,
      ease: "power2.inOut",
    }, 0)
    .to(shards.scale, {
      x: 0.5, y: 0.5, z: 0.5,
      duration: 1,
      ease: "power2.inOut",
    }, 0)
    .to(dish.position, {
      y: -3.5,
      duration: 1,
      ease: "power2.inOut",
    }, 0)
    .to(dish.scale, {
      x: 0.01, y: 0.01, z: 0.01,
      duration: 1,
      ease: "power2.inOut",
    }, 0);

    // Stage 1 → 2 (Decode Section 1 to CTA Section 2):
    // Vortex flies from left to right and lands onto the raised stone tray.
    tl.to(vortex.position, {
      x: isDesktop ? 1.4 : 0,
      y: isDesktop ? -0.4 : -0.7,
      z: 0,
      duration: 1,
      ease: "power2.inOut",
    }, 1.2)
    .to(vortex.rotation, {
      z: 0,
      duration: 1,
      ease: "power2.inOut",
    }, 1.2)
    .to(vortex.scale, {
      x: isDesktop ? 0.8 : 0.7,
      y: isDesktop ? 0.8 : 0.7,
      z: isDesktop ? 0.8 : 0.7,
      duration: 1,
      ease: "power2.inOut",
    }, 1.2)
    .to(shards.scale, {
      x: 0.8, y: 0.8, z: 0.8,
      duration: 1,
      ease: "power2.inOut",
    }, 1.2)
    .to(dish.position, {
      x: isDesktop ? 1.4 : 0,
      y: isDesktop ? -1.25 : -1.4,
      z: 0,
      duration: 1,
      ease: "power2.inOut",
    }, 1.2)
    .to(dish.scale, {
      x: isDesktop ? 0.8 : 0.7,
      y: isDesktop ? 0.8 : 0.7,
      z: isDesktop ? 0.8 : 0.7,
      duration: 1,
      ease: "power2.inOut",
    }, 1.2);

    return () => {
      tl.kill();
    };
  }, [isDesktop, introPhase, setIntroPhase]);

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.15} />

      {/* Main directional light */}
      <directionalLight
        position={[6, 10, 5]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={25}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0001}
      />

      {/* Soft fill from left */}
      <directionalLight position={[-5, 3, -2]} intensity={0.5} />

      {/* Kamui core glow — burnt orange */}
      <pointLight ref={coreLightRef} position={[0, 0, 0.25]} intensity={0.8} color="#ff6600" />

      {/* Rim/glint lights */}
      <pointLight position={[0, 3, -4]} intensity={1.8} color="#ffffff" />
      <pointLight position={[0, -1, 4]} intensity={1.2} color="#ffe2cc" />

      {/* Background silk layer */}
      <SilkBackground />

      {/* Stone Dish Tray (scroll-animated) — initialized off-screen and invisible to prevent loading flicker */}
      <group ref={dishGroup} position={[0, -3.5, 0]} scale={[0.01, 0.01, 0.01]}>
        <StoneDish />
      </group>

      {/* Kamui Portal Vortex */}
      <KamuiVortex
        vortexRef={vortexGroup}
        shardsRef={shardsGroup}
        mousePosition={mousePosition}
        isDragging={isDragging}
        onAssembleComplete={onAssembleComplete}
        onFreeze={onFreeze}
        introPhase={introPhase}
        scrollProgressRef={scrollProgressRef}
      />

      {/* GPU Instanced particles */}
      <Particles
        scrollProgress={scrollProgress}
        introPhase={introPhase}
        isHoveredCTA={isHoveredCTA}
      />

      {/* OrbitControls — only in Hero section */}
      {(introPhase === "frozen" || (introPhase === "explored" && scrollProgress < 0.05)) && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          onStart={() => setIsDragging(true)}
          onEnd={() => setIsDragging(false)}
        />
      )}
    </>
  );
}
