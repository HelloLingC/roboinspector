"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";

type RobotShowcaseProps = {
  // Reserved for future extensions (e.g., swapping models)
  className?: string;
};

type PlaceholderRobotProps = {
  wireframe: boolean;
  cinematicMode: boolean;
  sensorPulse: boolean;
};

export function PlaceholderRobot({ wireframe, cinematicMode, sensorPulse }: PlaceholderRobotProps) {
  const base: [number, number, number] = [0, 0.3, 0];
  const showWireframe = wireframe ?? true;
  const groupRef = useRef<THREE.Group | null>(null);
  const sensorLightRef = useRef<THREE.Mesh | null>(null);

  // Idle hover + subtle rocking animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();
    const hover = Math.sin(t * 1.2) * 0.03; // small vertical bob
    const rock = Math.sin(t * 0.8) * 0.03; // small pitch rocking

    groupRef.current.position.y = base[1] + hover;
    groupRef.current.rotation.z = rock;
  });

  // Pulsing sensor light
  useFrame(({ clock }) => {
    if (!sensorLightRef.current || !sensorPulse) return;

    const t = clock.getElapsedTime();
    const intensity = 0.25 + (Math.sin(t * 3) + 1) * 0.35; // 0.25 - 0.95
    const material = sensorLightRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = intensity;
  });

  return (
    <group ref={groupRef} position={base as [number, number, number]}>
      {/* Main chassis outline */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.35, 2.8]} />
        <meshStandardMaterial
          color={cinematicMode ? "#a5b4fc" : "#ffffff"}
          wireframe={showWireframe}
          metalness={cinematicMode ? 0.4 : 0.15}
          roughness={cinematicMode ? 0.25 : 0.45}
        />
      </mesh>

      {/* Wheel outlines with details */}
      {[[-0.7, -0.2, 1.1], [0.7, -0.2, 1.1], [-0.7, -0.2, -1.1], [0.7, -0.2, -1.1]].map(
        (pos, idx) => (
          <group key={idx} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            {/* Main tire - black (thinner) */}
            <mesh castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.2, 24]} />
              <meshStandardMaterial
                color="#000000"
                // wireframe={showWireframe}
                metalness={0.0}
                roughness={0.85}
              />
            </mesh>
            {/* Rim detail - inner cylinder */}
            <mesh castShadow>
              <cylinderGeometry args={[0.18, 0.18, 0.21, 16]} />
              <meshStandardMaterial
                color={cinematicMode ? "#9ca3af" : "#6b7280"}
                wireframe={showWireframe}
                metalness={cinematicMode ? 0.6 : 0.4}
                roughness={cinematicMode ? 0.3 : 0.4}
              />
            </mesh>
            {/* Hub detail - small central disc */}
            <mesh castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.22, 12]} />
              <meshStandardMaterial
                color={cinematicMode ? "#d1d5db" : "#9ca3af"}
                wireframe={showWireframe}
                metalness={cinematicMode ? 0.7 : 0.5}
                roughness={cinematicMode ? 0.25 : 0.35}
              />
            </mesh>
          </group>
        ),
      )}

      {/* Sensor mast / upper body outline */}
      <mesh castShadow position={[0, 0.55, 0.6]}>
        <boxGeometry args={[0.5, 0.45, 0.9]} />
        <meshStandardMaterial
          color={cinematicMode ? "#c7d2fe" : "#ffffff"}
          wireframe={showWireframe}
          metalness={cinematicMode ? 0.45 : 0.2}
          roughness={cinematicMode ? 0.25 : 0.45}
        />
      </mesh>

      {/* Front bumper line */}
      <mesh castShadow position={[0, 0.1, 1.45]}>
        <boxGeometry args={[1.4, 0.08, 0.1]} />
        <meshStandardMaterial
          color={cinematicMode ? "#e5e7eb" : "#ffffff"}
          wireframe={showWireframe}
          metalness={cinematicMode ? 0.35 : 0.15}
          roughness={cinematicMode ? 0.3 : 0.5}
        />
      </mesh>

      {/* Side rail lines */}
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[0.8 * side, 0.35, 0]}>
          <boxGeometry args={[0.06, 0.2, 2.5]} />
          <meshStandardMaterial
            color={cinematicMode ? "#818cf8" : "#ffffff"}
            wireframe={showWireframe}
            metalness={cinematicMode ? 0.5 : 0.2}
            roughness={cinematicMode ? 0.25 : 0.45}
          />
        </mesh>
      ))}

      {/* Top sensor bar */}
      <mesh castShadow position={[0, 0.9, 0.4]}>
        <boxGeometry args={[0.9, 0.06, 0.3]} />
        <meshStandardMaterial
          color={cinematicMode ? "#e5e7eb" : "#ffffff"}
          wireframe={showWireframe}
          metalness={cinematicMode ? 0.4 : 0.2}
          roughness={cinematicMode ? 0.25 : 0.45}
        />
      </mesh>

      {/* Glowing sensor "eye" */}
      <mesh ref={sensorLightRef} castShadow position={[0, 0.9, 0.7]}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshStandardMaterial
          color={sensorPulse ? "#22c55e" : "#4ade80"}
          emissive={sensorPulse ? "#22c55e" : "#4ade80"}
          emissiveIntensity={sensorPulse ? 0.9 : 0.4}
          metalness={0.3}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

export function RobotShowcase({ className }: RobotShowcaseProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(true);
  const [envPreset, setEnvPreset] = useState<"city" | "sunset" | "studio">("city");
  const [cinematicMode, setCinematicMode] = useState(true);
  const [sensorPulse, setSensorPulse] = useState(true);

  const key = useMemo(
    () => `${autoRotate}-${wireframe}-${envPreset}-${cinematicMode}-${sensorPulse}`,
    [autoRotate, wireframe, envPreset, cinematicMode, sensorPulse],
  );

  return (
    <div className={className ?? "space-y-3"}>
      <div className="relative h-[340px] overflow-hidden rounded-xl border border-zinc-800 bg-black">
        <div className="absolute inset-0">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                Loading 3D scene...
              </div>
            }
          >
            <Canvas
              key={key}
              camera={{ position: [4, 2.4, 4], fov: 45 }}
              shadows
              dpr={[1, 2]}
              className="h-full w-full"
            >
              <Environment preset={envPreset} background={false} />
              <spotLight position={[6, 8, 4]} angle={0.4} penumbra={0.5} intensity={1.2} castShadow />
              <ambientLight intensity={0.3} />

              {/* Cinematic rim / accent lights */}
              {cinematicMode && (
                <group>
                  <spotLight
                    position={[-4, 3, 0]}
                    angle={0.45}
                    penumbra={0.7}
                    intensity={0.7}
                    color="#6366f1"
                  />
                  <spotLight
                    position={[4, 2.5, -3]}
                    angle={0.5}
                    penumbra={0.6}
                    intensity={0.6}
                    color="#22c55e"
                  />
                </group>
              )}

              <RobotScene wireframe={wireframe} cinematicMode={cinematicMode} sensorPulse={sensorPulse} />
              <ContactShadows position={[0, -0.25, 0]} opacity={0.35} scale={10} blur={2.5} />
              <OrbitControls enablePan enableZoom enableRotate autoRotate={autoRotate} />
            </Canvas>
          </Suspense>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
        <button
          onClick={() => setAutoRotate((v) => !v)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-medium hover:bg-zinc-800"
        >
          {autoRotate ? "Stop Auto-Rotate" : "Auto-Rotate"}
        </button>
        <button
          onClick={() => setWireframe((v) => !v)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-medium hover:bg-zinc-800"
        >
          {wireframe ? "Hide Wireframe" : "Show Wireframe"}
        </button>
        <button
          onClick={() => setCinematicMode((v) => !v)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-medium hover:bg-zinc-800"
        >
          {cinematicMode ? "Disable Cinematic Mode" : "Enable Cinematic Mode"}
        </button>
        <button
          onClick={() => setSensorPulse((v) => !v)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-medium hover:bg-zinc-800"
        >
          {sensorPulse ? "Disable Sensor Pulse" : "Enable Sensor Pulse"}
        </button>
        <button
          onClick={() => setEnvPreset("city")}
          className={`rounded-lg border px-3 py-2 font-medium ${envPreset === "city" ? "border-emerald-500 text-emerald-400" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
            }`}
        >
          City
        </button>
        <button
          onClick={() => setEnvPreset("sunset")}
          className={`rounded-lg border px-3 py-2 font-medium ${envPreset === "sunset" ? "border-emerald-500 text-emerald-400" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
            }`}
        >
          Sunset
        </button>
        <button
          onClick={() => setEnvPreset("studio")}
          className={`rounded-lg border px-3 py-2 font-medium ${envPreset === "studio" ? "border-emerald-500 text-emerald-400" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
            }`}
        >
          Studio
        </button>
      </div>
    </div>
  );
}

type RobotSceneProps = {
  wireframe: boolean;
  cinematicMode: boolean;
  sensorPulse: boolean;
};

function RobotScene({ wireframe, cinematicMode, sensorPulse }: RobotSceneProps) {
  return (
    <group>
      <PlaceholderRobot wireframe={wireframe} cinematicMode={cinematicMode} sensorPulse={sensorPulse} />
    </group>
  );
}

