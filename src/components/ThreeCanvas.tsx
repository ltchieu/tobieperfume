"use client";

import { Canvas } from "@react-three/fiber";
import PerfumeScene from "./PerfumeScene";

// Suppress Three.js deprecation warnings generated internally by react-three-fiber (R3F v9)
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].includes("THREE.Clock") || args[0].includes("PCFSoftShadowMap"))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

interface ThreeCanvasProps {
  isHoveredCTA: boolean;
  introPhase: "assembling" | "spraying" | "frozen" | "explored";
  setIntroPhase: (phase: "assembling" | "spraying" | "frozen" | "explored") => void;
  onAssembleComplete: () => void;
  onFreeze: () => void;
}

export default function ThreeCanvas({
  isHoveredCTA,
  introPhase,
  setIntroPhase,
  onAssembleComplete,
  onFreeze,
}: ThreeCanvasProps) {
  return (
    <div className="fixed inset-0 w-full h-full z-10 pointer-events-none select-none">
      <Canvas
        shadows="percentage"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        style={{ pointerEvents: "auto" }} // Capture pointer events for drag exploration
      >
        <PerfumeScene
          isHoveredCTA={isHoveredCTA}
          introPhase={introPhase}
          setIntroPhase={setIntroPhase}
          onAssembleComplete={onAssembleComplete}
          onFreeze={onFreeze}
        />
      </Canvas>
    </div>
  );
}
