"use client";

import { Suspense } from "react";
import { Bounds, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

const MODEL_PATH = "/Meshy_AI_Mobile_Robotic_Camera_0305013059_texture.glb";
const ENV_HDR_PATH = "/hdr/potsdamer_platz_1k.hdr";

type RobotModelCanvasProps = {
  className?: string;
  fullscreen?: boolean;
};

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

export function RobotModelCanvas({ className, fullscreen = false }: RobotModelCanvasProps) {
  const rootClassName = className ?? (fullscreen ? "h-screen w-screen" : "h-full w-full");
  const cameraPosition: [number, number, number] = fullscreen ? [2.6, 1.8, 3.3] : [3, 2, 4];

  return (
    <div className={rootClassName}>
      <Canvas dpr={[1, fullscreen ? 2 : 1.5]} camera={{ fov: 45, position: cameraPosition }}>
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
          autoRotateSpeed={fullscreen ? 1 : 0.8}
          enablePan={false}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
