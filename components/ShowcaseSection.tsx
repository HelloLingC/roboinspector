"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

const MODEL_PATH = "/models/meshy-mobile-robotic-camera.glb";
const ENV_HDR_PATH = "/hdr/potsdamer_platz_1k.hdr";
const HUD_METRICS = [
  { label: "SERVO LOAD", value: "63%", level: 63 },
  { label: "LINK LAT", value: "22ms", level: 82 },
  { label: "TRACK CONF", value: "98.4%", level: 98 },
];

function RobotModel() {
  const gltf = useGLTF(MODEL_PATH);
  return <primitive object={gltf.scene} />;
}

function ModelFallback() {
  return (
    <Html center>
      <div className="w-max rounded-md border border-zinc-700 bg-zinc-950/85 px-3 py-2 text-center text-xs text-zinc-300 [word-break:keep-all]">
        <p className="whitespace-nowrap">模型加载中...</p>
        <p className="mt-1 whitespace-nowrap text-zinc-400">大文件首次加载可能较慢</p>
      </div>
    </Html>
  );
}

export function ShowcaseSection() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">3D 展示</p>
          <h2 className="text-lg font-semibold">机器人小车可视化</h2>
        </div>
      </div>
      <div className="mt-3">
        <div className="relative h-[340px] overflow-hidden rounded-xl border border-cyan-900/60 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_78%_88%,rgba(14,165,233,0.2),transparent_38%),linear-gradient(180deg,rgba(9,19,31,1)_0%,rgba(6,14,24,1)_55%,rgba(4,10,18,1)_100%)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-50" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(6,182,212,0.08)_62%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="scanline absolute left-0 right-0 h-20 bg-[linear-gradient(180deg,transparent_0%,rgba(34,211,238,0.24)_45%,rgba(56,189,248,0.08)_75%,transparent_100%)]" />
          </div>
          <div className="pointer-events-none absolute -left-10 top-1/4 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-52 w-52 rounded-full bg-sky-500/25 blur-3xl" />
          <div className="pointer-events-none absolute right-3 top-3 z-20 w-[190px] rounded-lg border border-cyan-400/35 bg-slate-950/65 p-2 text-[10px] text-cyan-100 backdrop-blur-sm">
            <div className="space-y-1.5">
              {HUD_METRICS.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-0.5 flex items-center justify-between text-[9px]">
                    <span className="text-cyan-100/75">{metric.label}</span>
                    <span className="font-semibold text-cyan-100">{metric.value}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-cyan-950/80">
                    <div
                      className="hud-bar h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95)_0%,rgba(125,211,252,0.95)_100%)]"
                      style={{ width: `${metric.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 h-full w-full">
            <Canvas dpr={[1, 1.5]} camera={{ fov: 45, position: [3, 2, 4] }}>
              <ambientLight intensity={0.55} />
              <directionalLight position={[6, 10, 5]} intensity={1.1} />
              <Suspense fallback={<ModelFallback />}>
                <Bounds fit clip observe margin={1.2}>
                  <RobotModel />
                </Bounds>
                <Environment files={ENV_HDR_PATH} />
              </Suspense>
              <OrbitControls
                autoRotate
                autoRotateSpeed={0.8}
                enablePan={false}
                minDistance={1}
                maxDistance={20}
              />
            </Canvas>
          </div>
        </div>
      </div>
      <style jsx>{`
        .scanline {
          animation: scanline-sweep 4.8s linear infinite;
          will-change: transform;
        }

        .hud-bar {
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.45);
          animation: hud-bar-breathe 2.6s ease-in-out infinite;
        }

        @keyframes scanline-sweep {
          0% {
            transform: translateY(-28%);
            opacity: 0;
          }
          12% {
            opacity: 0.8;
          }
          88% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(430%);
            opacity: 0;
          }
        }

        @keyframes hud-bar-breathe {
          0%,
          100% {
            filter: brightness(0.92);
          }
          50% {
            filter: brightness(1.15);
          }
        }
      `}</style>
    </section>
  );
}

useGLTF.preload(MODEL_PATH);
