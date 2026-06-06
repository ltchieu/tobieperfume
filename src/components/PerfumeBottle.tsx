"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";

interface PerfumeBottleProps {
  bottleRef: React.RefObject<THREE.Group | null>; // main outer container
  capRef: React.RefObject<THREE.Group | null>;    // reused for shards group
  mousePosition: React.RefObject<{ x: number; y: number }>;
  isDragging: boolean;
  onAssembleComplete: () => void;
  onFreeze: () => void;
  introPhase: "assembling" | "spraying" | "frozen" | "explored";
  scrollProgressRef: React.RefObject<number>;
}

const shardShapes = [
  [[0, 0], [0.4, -0.1], [0.5, 0.3], [0.1, 0.5]],
  [[0, 0], [0.3, 0.2], [0.4, 0.5], [-0.1, 0.4]],
  [[0, 0], [0.5, -0.1], [0.3, 0.4], [0, 0.3]],
  [[0, 0], [0.4, 0.1], [0.5, 0.5], [0.1, 0.4]],
  [[0, 0], [0.3, -0.2], [0.5, 0.2], [0.2, 0.5]],
  [[0, 0], [0.4, 0.2], [0.3, 0.6], [-0.1, 0.3]],
];

export default function PerfumeBottle({
  bottleRef,
  capRef,
  mousePosition,
  isDragging,
  onAssembleComplete,
  onFreeze,
  introPhase,
  scrollProgressRef,
}: PerfumeBottleProps) {
  // Main Mangekyou Group Ref
  const mangekyouGroupRef = useRef<THREE.Group>(null);
  
  // Independent Tilt/Float container to decouple interactive tilt from ScrollTrigger
  const tiltGroupRef = useRef<THREE.Group>(null);

  // Mesh/Group refs
  const blade0Ref = useRef<THREE.Group>(null);
  const blade1Ref = useRef<THREE.Group>(null);
  const blade2Ref = useRef<THREE.Group>(null);
  const redBaseRef = useRef<THREE.Mesh>(null);
  const nozzleRef = useRef<THREE.Mesh>(null);
  const shardsRef = capRef; // link capRef to shards
  const shardTextMaterials = useRef<THREE.MeshBasicMaterial[]>([]);

  const brands = useMemo(() => ["CHANEL", "DIOR", "TOM FORD", "CREED", "KILIAN", "TOBI"], []);

  // 1. Math generation for Mangekyou Obsidian Blade Shape (Sickle-shaped curved crescent)
  const bladeGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Start near inner circle
    shape.moveTo(0.24, 0.05);
    // Outer crescent sweep
    shape.bezierCurveTo(0.3, 0.6, 0.8, 1.05, 1.25, 0.0);
    // Curve back inwards, tapering to a sharp point wrapping the center circle
    shape.bezierCurveTo(0.7, -0.4, 0.45, -0.45, 0.24, -0.12);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.12, // thick profile
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.018,
      bevelSegments: 4,
    };
    // Do not center geometry so it spins symmetrically around 0,0,0
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // 2. Generate 3D geometries and canvas textures for Mirror Shards
  const { shardGeometries, shardTextures } = useMemo(() => {
    const geoms: THREE.ExtrudeGeometry[] = [];
    const texs: THREE.CanvasTexture[] = [];

    brands.forEach((brand, idx) => {
      const shape = new THREE.Shape();
      const verts = shardShapes[idx % shardShapes.length];
      shape.moveTo(verts[0][0], verts[0][1]);
      for (let v = 1; v < verts.length; v++) {
        shape.lineTo(verts[v][0], verts[v][1]);
      }
      shape.closePath();

      const extrudeSettings = {
        depth: 0.02,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.005,
        bevelSegments: 3,
      };
      
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      geoms.push(geo);

      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 256, 128);
        ctx.fillStyle = "#ffb300"; // Glowing Golden brand logos
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 26px serif";
        ctx.letterSpacing = "6px";
        ctx.fillText(brand, 128, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texs.push(texture);
    });

    return { shardGeometries: geoms, shardTextures: texs };
  }, [brands]);

  // Floating coordinates for the mirror shards
  const shardCoordinates = useMemo(() => {
    return [
      { pos: [-1.5, 0.9, 0.7], rot: [0.2, 0.4, -0.1] },
      { pos: [1.4, 0.8, 0.9], rot: [-0.3, -0.2, 0.3] },
      { pos: [-1.2, -0.9, 0.7], rot: [0.4, 0.1, -0.4] },
      { pos: [1.2, -0.9, 0.8], rot: [-0.2, -0.5, 0.2] },
      { pos: [-1.6, 0.0, 1.2], rot: [0.1, 0.3, -0.2] },
      { pos: [1.5, -0.1, 0.6], rot: [-0.1, -0.4, 0.1] },
    ];
  }, []);

  // Materials setup
  const materials = useMemo(() => {
    const obsidian = new THREE.MeshPhysicalMaterial({
      color: "#080808", // Obsidian Black
      roughness: 0.05,
      metalness: 0.9,
      clearcoat: 1.0,   // glossy polish
    });

    const ruby = new THREE.MeshPhysicalMaterial({
      color: "#e60000", // Ruby Red
      emissive: "#4a0000",
      emissiveIntensity: 0.5,
      transmission: 0.6, // Transparent glass refraction
      ior: 1.7,          // High diamond index of refraction
      roughness: 0.1,
      transparent: true,
    });

    return { obsidian, ruby };
  }, []);

  // Reset interactive tilt container smoothly when OrbitControls drag interaction ends
  useEffect(() => {
    if (!isDragging && (introPhase === "frozen" || introPhase === "explored")) {
      if (tiltGroupRef.current) {
        gsap.to(tiltGroupRef.current.rotation, {
          x: mousePosition.current.y * 0.15,
          y: mousePosition.current.x * 0.15,
          duration: 0.8,
          ease: "power2.out",
        });
        gsap.to(tiltGroupRef.current.position, {
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      }
    }
  }, [isDragging, introPhase, mousePosition]);

  // Assemble, spin, and freeze timeline
  useEffect(() => {
    const blade0 = blade0Ref.current;
    const blade1 = blade1Ref.current;
    const blade2 = blade2Ref.current;
    const redBase = redBaseRef.current;
    const nozzle = nozzleRef.current;

    if (!blade0 || !blade1 || !blade2 || !redBase || !nozzle) return;

    // 1. Initial exploded positions for blades
    const startOffsets = [
      { x: -3.5, y: 2.5, z: 1.8, rx: 1.5, ry: -1.0 },
      { x: 3.5, y: -2.5, z: 2.0, rx: -1.0, ry: 1.5 },
      { x: 0.0, y: -4.0, z: -1.5, rx: 2.0, ry: 2.0 },
    ];

    [blade0, blade1, blade2].forEach((blade, idx) => {
      gsap.set(blade.position, {
        x: startOffsets[idx].x,
        y: startOffsets[idx].y,
        z: startOffsets[idx].z,
      });
      gsap.set(blade.rotation, {
        x: startOffsets[idx].rx,
        y: startOffsets[idx].ry,
        z: (idx / 3) * Math.PI * 2,
      });
      gsap.set(blade.scale, { x: 0.01, y: 0.01, z: 0.01 });
    });

    // Initial base and nozzle positions to fly in from off-screen corners (aligned on Z-axis with X-rotation Math.PI/2)
    gsap.set(redBase.position, { x: 2.5, y: 3.5, z: -4.0 });
    gsap.set(redBase.rotation, { x: Math.PI / 2 - 0.8, y: 1.2, z: -Math.PI });
    gsap.set(redBase.scale, { x: 0.01, y: 0.01, z: 0.01 });

    gsap.set(nozzle.position, { x: -1.5, y: -2.5, z: 4.0 });
    gsap.set(nozzle.rotation, { x: Math.PI / 2 + 0.6, y: -0.8, z: Math.PI });
    gsap.set(nozzle.scale, { x: 0.01, y: 0.01, z: 0.01 });

    // Hide shards - set them in the center of the medallion to explode out later
    if (shardsRef.current) {
      gsap.set(shardsRef.current.position, { z: 0 });
      shardsRef.current.children.forEach((shard) => {
        gsap.set(shard.position, { x: 0, y: 0, z: 0.24 });
        gsap.set(shard.scale, { x: 0.001, y: 0.001, z: 0.001 });
      });
    }
    shardTextMaterials.current.forEach((mat) => {
      if (mat) gsap.set(mat, { opacity: 0 });
    });

    // --- GSAP TIMELINE SEQUENCE ---
    const tl = gsap.timeline({
      defaults: { ease: "power4.out" },
    });

    // Phase 1: Assembly
    // Ruby Base and Center Nozzle fly in and snap (End rotation has X: Math.PI/2 to align with blades on XY plane)
    tl.to(redBase.position, { x: 0, y: 0, z: -0.05, duration: 1.8 }, 0)
      .to(redBase.rotation, { x: Math.PI / 2, y: 0, z: 0, duration: 1.8 }, 0)
      .to(redBase.scale, { x: 1, y: 1, z: 1, duration: 1.8 }, 0)
      .to(nozzle.position, { x: 0, y: 0, z: 0.08, duration: 1.8 }, 0.05)
      .to(nozzle.rotation, { x: Math.PI / 2, y: 0, z: 0, duration: 1.8 }, 0.05)
      .to(nozzle.scale, { x: 1, y: 1, z: 1, duration: 1.8 }, 0.05);

    // Blades fly in and snap on top
    [blade0, blade1, blade2].forEach((blade, idx) => {
      tl.to(blade.position, { x: 0, y: 0, z: 0.08, duration: 2.0 }, 0.1)
        .to(blade.rotation, { x: 0, y: 0, z: (idx / 3) * Math.PI * 2, duration: 2.0 }, 0.1)
        .to(blade.scale, { x: 1, y: 1, z: 1, duration: 1.8 }, 0.1);
    });

    // Phase 2: Kamui Spin & Spray (Triggered right after snaps)
    // 2.0s - 3.8s: Medallion spins and accelerates, and base plate glows intensely
    if (mangekyouGroupRef.current) {
      tl.to(mangekyouGroupRef.current.rotation, {
        z: Math.PI * 8, // 4 full rotations
        duration: 1.8,
        ease: "power3.in", // accelerates up to peak velocity
      }, 2.0);
    }

    tl.to(materials.ruby, {
      emissiveIntensity: 3.5, // maximum emissive glow at peak spin speed
      duration: 1.8,
      ease: "power3.in",
    }, 2.0);

    // At t = 3.2s: The eye is spinning rapidly, depress nozzle and trigger the golden perfume spray burst
    tl.add(() => {
      onAssembleComplete(); // switches particles to "spraying"

      // Depress nozzle spray action
      gsap.timeline()
        .to(nozzle.position, { z: 0.02, duration: 0.08, ease: "power2.in" })
        .to(nozzle.position, { z: 0.08, duration: 0.25, ease: "power2.out" });
    }, 3.2);

    // At t = 3.8s: Peak speed reached. Spin halts instantly. Trigger time-freeze!
    tl.add(() => {
      onFreeze(); // switches particles to "frozen"

      // Blades push/separate along Z to reveal ruby base
      gsap.to([blade0.position, blade1.position, blade2.position], {
        z: 0.24, // push forward on Z
        duration: 0.8,
        ease: "back.out(1.5)",
      });

      // Scale up and fly out floating brand shards from the center gap
      if (shardsRef.current) {
        shardsRef.current.children.forEach((shard, sIdx) => {
          const targetPos = shardCoordinates[sIdx].pos;
          gsap.to(shard.position, {
            x: targetPos[0],
            y: targetPos[1],
            z: targetPos[2],
            duration: 1.2,
            delay: sIdx * 0.06,
            ease: "power2.out",
          });
          gsap.to(shard.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.8,
            delay: sIdx * 0.06,
            ease: "back.out(1.8)",
          });
        });
      }

      // Fade in glowing brand text logo
      shardTextMaterials.current.forEach((mat, sIdx) => {
        if (mat) {
          gsap.to(mat, {
            opacity: 0.9,
            duration: 0.6,
            delay: sIdx * 0.06 + 0.2,
          });
        }
      });
    }, 3.8);

    return () => {
      tl.kill();
    };
  }, [onAssembleComplete, onFreeze, materials.ruby, shardCoordinates, shardsRef]);

  // Float drift in Stage 3 (Time-freeze explore)
  useFrame((state) => {
    if (!bottleRef.current || !tiltGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scrollProgress = scrollProgressRef.current;

    // Shards drift
    if (shardsRef.current && (introPhase === "frozen" || introPhase === "explored")) {
      shardsRef.current.children.forEach((shard, idx) => {
        const seed = idx * 15;
        shard.position.y = shardCoordinates[idx].pos[1] + Math.sin(time * 0.5 + seed) * 0.05;
        shard.rotation.x = shardCoordinates[idx].rot[0] + Math.cos(time * 0.4 + seed) * 0.04;
        shard.rotation.y = shardCoordinates[idx].rot[1] + Math.sin(time * 0.45 + seed) * 0.04;
      });
    }

    // Mouse tilt lerp during exploration phase (only active in Hero Section to avoid ScrollTrigger conflicts)
    const active = (introPhase === "frozen" || introPhase === "explored") && scrollProgress < 0.25;

    if (!isDragging && active) {
      // Fade out tilt/float smoothly as user scrolls down
      const tiltFactor = Math.max(0, 1.0 - scrollProgress * 4.0);
      const targetPosY = Math.sin(time * 1.2) * 0.06 * tiltFactor;
      const targetRotX = mousePosition.current.y * 0.15 * tiltFactor;
      const targetRotY = mousePosition.current.x * 0.15 * tiltFactor;

      tiltGroupRef.current.position.y = THREE.MathUtils.lerp(tiltGroupRef.current.position.y, targetPosY, 0.08);
      tiltGroupRef.current.rotation.x = THREE.MathUtils.lerp(tiltGroupRef.current.rotation.x, targetRotX, 0.08);
      tiltGroupRef.current.rotation.y = THREE.MathUtils.lerp(tiltGroupRef.current.rotation.y, targetRotY, 0.08);
    } else if (tiltGroupRef.current) {
      // Smoothly return to center when scrolled past 25% or when dragging
      tiltGroupRef.current.position.y = THREE.MathUtils.lerp(tiltGroupRef.current.position.y, 0, 0.08);
      tiltGroupRef.current.rotation.x = THREE.MathUtils.lerp(tiltGroupRef.current.rotation.x, 0, 0.08);
      tiltGroupRef.current.rotation.y = THREE.MathUtils.lerp(tiltGroupRef.current.rotation.y, 0, 0.08);
    }
  });

  return (
    <group ref={bottleRef}>
      <group ref={tiltGroupRef}>
        {/* Mangekyou Sharingan Group (animated as one piece during spin) */}
        <group ref={mangekyouGroupRef}>
          {/* A. Red Crystal Ruby Base Plate (lies flat on XY plane by rotating on X by Math.PI/2) */}
          <mesh ref={redBaseRef} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.22, 1.22, 0.06, 64]} />
            <primitive object={materials.ruby} attach="material" />
          </mesh>

          {/* B. 3 Obsidian Black Blades rotated by 120deg */}
          <group ref={blade0Ref} rotation={[0, 0, 0]}>
            <mesh geometry={bladeGeometry} material={materials.obsidian} castShadow />
          </group>
          
          <group ref={blade1Ref} rotation={[0, 0, (Math.PI * 2) / 3]}>
            <mesh geometry={bladeGeometry} material={materials.obsidian} castShadow />
          </group>

          <group ref={blade2Ref} rotation={[0, 0, (Math.PI * 4) / 3]}>
            <mesh geometry={bladeGeometry} material={materials.obsidian} castShadow />
          </group>

          {/* C. Center Red Cylinder Spray Nozzle (lies flat on XY plane) */}
          <mesh ref={nozzleRef} position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 32]} />
            <primitive object={materials.ruby} attach="material" />
          </mesh>

          {/* Small black center orifice/nozzle dot (lies flat on XY plane) */}
          <mesh position={[0, 0, 0.145]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
            <meshStandardMaterial color="#000000" roughness={0.9} />
          </mesh>
        </group>

        {/* D. Mirror brand shards (reused capRef, sits outside spin group so it doesn't rotate with eye) */}
        <group ref={shardsRef}>
          {shardCoordinates.map((coord, idx) => {
            const geo = shardGeometries[idx];
            const tex = shardTextures[idx];

            return (
              <group
                key={idx}
                position={[0, 0, 0.24]} // Start at medallion center and fly out
              >
                <mesh geometry={geo} castShadow receiveShadow>
                  <meshPhysicalMaterial
                    color="#111111" // obsidian glass mirror
                    metalness={0.9}
                    roughness={0.05}
                    clearcoat={1.0}
                    clearcoatRoughness={0.02}
                    transmission={0.3}
                    thickness={0.08}
                    ior={1.6}
                  />
                </mesh>

                <mesh
                  position={[0, 0, 0.021]} // Slight offset to prevent z-fighting
                  ref={(el) => {
                    if (el) {
                      shardTextMaterials.current[idx] = el.material as THREE.MeshBasicMaterial;
                    }
                  }}
                >
                  <planeGeometry args={[0.42, 0.21]} />
                  <meshBasicMaterial
                    map={tex}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}
