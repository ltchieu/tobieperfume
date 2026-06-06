"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";

interface KamuiVortexProps {
  vortexRef: React.RefObject<THREE.Group | null>;
  shardsRef: React.RefObject<THREE.Group | null>;
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

function createTaperedTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number = 64,
  radiusFn: (t: number) => number,
  radialSegments: number = 8,
  closed: boolean = false
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const frames = curve.computeFrenetFrames(tubularSegments, closed);
  
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const point = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const radius = radiusFn(t);

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const vx = point.x + radius * (cos * N.x + sin * B.x);
      const vy = point.y + radius * (cos * N.y + sin * B.y);
      const vz = point.z + radius * (cos * N.z + sin * B.z);
      vertices.push(vx, vy, vz);

      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;
      const normalVec = new THREE.Vector3(nx, ny, nz).normalize();
      normals.push(normalVec.x, normalVec.y, normalVec.z);

      uvs.push(t, j / radialSegments);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = i * (radialSegments + 1) + j + 1;
      const c = (i + 1) * (radialSegments + 1) + j;
      const d = (i + 1) * (radialSegments + 1) + j + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

export default function KamuiVortex({
  vortexRef,
  shardsRef,
  mousePosition,
  isDragging,
  onAssembleComplete,
  onFreeze,
  introPhase,
  scrollProgressRef,
}: KamuiVortexProps) {
  // Spin group — useFrame writes rotation.z via accumulated angle
  const spinGroupRef = useRef<THREE.Group>(null);
  // Tilt group — decoupled from ScrollTrigger, handles mouse interaction
  const tiltGroupRef = useRef<THREE.Group>(null);
  // Individual arm group refs for staggered scale-up
  const armRefs = useRef<(THREE.Group | null)[]>([]);
  // Shards group alias
  const shardsGroupRef = shardsRef;
  const shardTextMaterials = useRef<THREE.MeshBasicMaterial[]>([]);

  // Spin state: GSAP animates speed, useFrame consumes it — no animation conflict
  const spinState = useRef({ speed: 0.5 });
  const accumulatedZ = useRef(0);

  // Callbacks refs to prevent timeline rebuilds on render
  const onAssembleCompleteRef = useRef(onAssembleComplete);
  const onFreezeRef = useRef(onFreeze);
  const timelineCreated = useRef(false);

  useEffect(() => {
    onAssembleCompleteRef.current = onAssembleComplete;
    onFreezeRef.current = onFreeze;
  }, [onAssembleComplete, onFreeze]);

  const brands = useMemo(
    () => ["CHANEL", "DIOR", "TOM FORD", "CREED", "KILIAN", "TOBI"],
    [],
  );

  // ─── 1. Generate 5 Tapered S-Curve Geometries (Core & Glow) ─────────
  const { coreGeometries, glowGeometries } = useMemo(() => {
    const coreGeos: THREE.BufferGeometry[] = [];
    const glowGeos: THREE.BufferGeometry[] = [];
    const armCount = 5;

    for (let a = 0; a < armCount; a++) {
      const baseAngle = (a / armCount) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      const segments = 80;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // S-curve angle modulation (inflection point: curves twist back and forth)
        const angle = baseAngle + Math.sin(t * Math.PI * 1.5) * 1.8 - t * Math.PI * 0.5;

        // Radius starts near center (0.05) and expands outward to edge (2.4)
        const r = THREE.MathUtils.lerp(0.05, 2.4, t);
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);

        // Deep funnel shape — extremely steep at the center (Z=-1.6), rises to Z=0.4 at edge
        const z = 0.4 - Math.pow(1.0 - t, 2.0) * 2.0;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);

      // Core geometry (tapered ends, max thickness 0.055)
      const coreGeo = createTaperedTubeGeometry(
        curve,
        120,
        (tVal) => Math.max(0.002, 0.055 * Math.sin(tVal * Math.PI)),
        8,
        false
      );
      coreGeos.push(coreGeo);

      // Glow shell geometry (slightly thicker, max thickness 0.07)
      const glowGeo = createTaperedTubeGeometry(
        curve,
        120,
        (tVal) => Math.max(0.003, 0.07 * Math.sin(tVal * Math.PI)),
        8,
        false
      );
      glowGeos.push(glowGeo);
    }

    return { coreGeometries: coreGeos, glowGeometries: glowGeos };
  }, []);

  // Crystal material — transparent refractive glass bending light with interior emissive glow
  const crystalMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      transmission: 0.92,
      roughness: 0.05,
      ior: 1.8,
      thickness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color("#ff2200"),
      emissiveIntensity: 0.85,
    });
  }, []);

  // Fresnel Glow Material for Neon Halo effect without heavy post-processing libraries
  const fresnelGlowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform vec3 glowColor;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
          gl_FragColor = vec4(glowColor, fresnel * 0.42);
        }
      `,
      uniforms: {
        glowColor: { value: new THREE.Color("#ff4400") },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // ─── 2. Shard Geometries & Canvas Textures ─────────────────────────
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

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.02,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.005,
        bevelSegments: 3,
      });
      geo.center();
      geoms.push(geo);

      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 256, 128);
        ctx.fillStyle = "#ffb300"; // Glowing golden brand logos
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 29px serif";
        ctx.letterSpacing = "6px";
        ctx.fillText(brand, 128, 64);
      }
      texs.push(new THREE.CanvasTexture(canvas));
    });

    return { shardGeometries: geoms, shardTextures: texs };
  }, [brands]);

  // Floating coordinates for mirror shards
  const shardCoordinates = useMemo(
    () => [
      { pos: [-1.5, 0.9, 0.7], rot: [0.2, 0.4, -0.1] },
      { pos: [1.4, 0.8, 0.9], rot: [-0.3, -0.2, 0.3] },
      { pos: [-1.2, -0.9, 0.7], rot: [0.4, 0.1, -0.4] },
      { pos: [1.2, -0.9, 0.8], rot: [-0.2, -0.5, 0.2] },
      { pos: [-1.6, 0.0, 1.2], rot: [0.1, 0.3, -0.2] },
      { pos: [1.5, -0.1, 0.6], rot: [-0.1, -0.4, 0.1] },
    ],
    [],
  );

  // ─── 3. GSAP Timeline: Assembly → Eruption → Freeze ───────────────
  useEffect(() => {
    // Only initialize the intro timeline once
    if (timelineCreated.current) return;
    timelineCreated.current = true;

    // Initial states: arms invisible
    armRefs.current.forEach((arm) => {
      if (arm) gsap.set(arm.scale, { x: 0.01, y: 0.01, z: 0.01 });
    });

    // Shards hidden at vortex center
    if (shardsGroupRef.current) {
      shardsGroupRef.current.children.forEach((shard) => {
        gsap.set(shard.position, { x: 0, y: 0, z: 0 });
        gsap.set(shard.scale, { x: 0.001, y: 0.001, z: 0.001 });
      });
    }
    shardTextMaterials.current.forEach((mat) => {
      if (mat) gsap.set(mat, { opacity: 0 });
    });

    // Reset spin
    spinState.current.speed = 0.5;
    accumulatedZ.current = 0;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Phase 1: Staggered arm scale-up (0s – 2.0s)
    armRefs.current.forEach((arm, idx) => {
      if (arm) {
        tl.to(
          arm.scale,
          { x: 1, y: 1, z: 1, duration: 1.5, ease: "back.out(1.2)" },
          idx * 0.15,
        );
      }
    });

    // Phase 2: Spin acceleration (2.0s – 3.5s)
    tl.to(
      spinState.current,
      { speed: 20, duration: 1.5, ease: "power3.in" },
      2.0,
    );

    // At 3.0s: trigger eruption particles
    tl.add(() => {
      onAssembleCompleteRef.current();
    }, 3.0);

    // At 3.5s: time-freeze — decelerate spin, fly out shards
    tl.add(() => {
      // Decelerate to idle spin
      gsap.to(spinState.current, {
        speed: 0.08,
        duration: 0.4,
        ease: "power2.out",
      });

      onFreezeRef.current();

      // Brand shards explode outward from center
      if (shardsGroupRef.current) {
        shardsGroupRef.current.children.forEach((shard, sIdx) => {
          const target = shardCoordinates[sIdx].pos;
          gsap.to(shard.position, {
            x: target[0],
            y: target[1],
            z: target[2],
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

      // Fade in golden brand text
      shardTextMaterials.current.forEach((mat, sIdx) => {
        if (mat) {
          gsap.to(mat, {
            opacity: 0.9,
            duration: 0.6,
            delay: sIdx * 0.06 + 0.2,
          });
        }
      });
    }, 3.5);

    return () => {
      tl.kill();
    };
  }, [shardCoordinates, shardsGroupRef]);

  // ─── 4. useFrame: continuous spin + shard drift + mouse tilt ───────
  useFrame((state, delta) => {
    if (!vortexRef.current || !tiltGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scrollProgress = scrollProgressRef.current;

    // Continuous spin (speed governed by GSAP via spinState ref)
    if (spinGroupRef.current) {
      accumulatedZ.current += spinState.current.speed * delta;
      spinGroupRef.current.rotation.z = accumulatedZ.current;
    }

    // Shard drift during freeze
    if (
      shardsGroupRef.current &&
      (introPhase === "frozen" || introPhase === "explored")
    ) {
      shardsGroupRef.current.children.forEach((shard, idx) => {
        if (idx >= shardCoordinates.length) return;
        const seed = idx * 15;
        shard.position.y =
          shardCoordinates[idx].pos[1] + Math.sin(time * 0.5 + seed) * 0.05;
        shard.rotation.x =
          shardCoordinates[idx].rot[0] + Math.cos(time * 0.4 + seed) * 0.04;
        shard.rotation.y =
          shardCoordinates[idx].rot[1] + Math.sin(time * 0.45 + seed) * 0.04;
      });
    }

    // Mouse tilt (fades out as user scrolls past Hero)
    const active =
      (introPhase === "frozen" || introPhase === "explored") &&
      scrollProgress < 0.25;

    if (!isDragging && active) {
      const tiltFactor = Math.max(0, 1.0 - scrollProgress * 4.0);
      const targetPosY = Math.sin(time * 1.2) * 0.06 * tiltFactor;
      const targetRotX = mousePosition.current.y * 0.15 * tiltFactor;
      const targetRotY = mousePosition.current.x * 0.15 * tiltFactor;

      tiltGroupRef.current.position.y = THREE.MathUtils.lerp(
        tiltGroupRef.current.position.y,
        targetPosY,
        0.08,
      );
      tiltGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        tiltGroupRef.current.rotation.x,
        targetRotX,
        0.08,
      );
      tiltGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        tiltGroupRef.current.rotation.y,
        targetRotY,
        0.08,
      );
    } else {
      // Smoothly return to center
      tiltGroupRef.current.position.y = THREE.MathUtils.lerp(
        tiltGroupRef.current.position.y,
        0,
        0.08,
      );
      tiltGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        tiltGroupRef.current.rotation.x,
        0,
        0.08,
      );
      tiltGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        tiltGroupRef.current.rotation.y,
        0,
        0.08,
      );
    }
  });

  // ─── 5. JSX ────────────────────────────────────────────────────────
  return (
    <group ref={vortexRef}>
      <group ref={tiltGroupRef}>
        {/* Spinning Vortex — 5 crystal spiral arms with Fresnel Neon Glow Shell */}
        <group ref={spinGroupRef}>
          {coreGeometries.map((coreGeo, idx) => {
            const glowGeo = glowGeometries[idx];
            return (
              <group
                key={idx}
                ref={(el) => {
                  armRefs.current[idx] = el;
                }}
              >
                {/* Core Crystal Tapered Arm */}
                <mesh
                  geometry={coreGeo}
                  material={crystalMaterial}
                  castShadow
                  receiveShadow
                />

                {/* Fresnel Neon Glow Shell */}
                <mesh
                  geometry={glowGeo}
                  material={fresnelGlowMaterial}
                />
              </group>
            );
          })}
        </group>

        {/* Brand Mirror Shards — explode outward on freeze */}
        <group ref={shardsGroupRef}>
          {shardCoordinates.map((_, idx) => {
            const geo = shardGeometries[idx];
            const tex = shardTextures[idx];

            return (
              <group key={idx}>
                {/* Golden brand logo text — rendered on top of particles without black background */}
                <mesh
                  position={[0, 0, 0]}
                  renderOrder={999}
                  ref={(el) => {
                    if (el) {
                      shardTextMaterials.current[idx] =
                        el.material as THREE.MeshBasicMaterial;
                    }
                  }}
                >
                  <planeGeometry args={[0.42, 0.21]} />
                  <meshBasicMaterial
                    map={tex}
                    transparent
                    depthTest={false}
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
