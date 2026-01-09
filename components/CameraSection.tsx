"use client";

import { MutableRefObject } from "react";
import { DetectionStatus } from "../types/robot";

type CameraSectionProps = {
  mjpegUrl: string;
  detectionStatus: DetectionStatus;
  canDetect: boolean;
  imgRef: MutableRefObject<HTMLImageElement | null>;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  onRunDetection: () => void;
  onImageLoad: () => void;
};

export function CameraSection({
  mjpegUrl,
  detectionStatus,
  canDetect,
  imgRef,
  canvasRef,
  onRunDetection,
  onImageLoad,
}: CameraSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Live Video (MJPEG)</p>
          <h2 className="text-lg font-semibold">Camera</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>MJPEG:</span>
          <code className="rounded bg-black/40 px-2 py-1">{mjpegUrl}</code>
        </div>
      </div>
      <div className="relative mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-black">
        <img
          ref={imgRef}
          src={mjpegUrl}
          alt="Robot camera feed"
          className="block w-full"
          crossOrigin="anonymous"
          onLoad={onImageLoad}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={onRunDetection}
          disabled={!canDetect || detectionStatus === "running"}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-emerald-500/50"
        >
          {detectionStatus === "running" ? "Detecting..." : "Run People Detection"}
        </button>
        {!canDetect && (
          <p className="text-xs text-amber-300">
            Set NEXT_PUBLIC_DETECT_URL to enable detection.
          </p>
        )}
        {detectionStatus === "error" && (
          <p className="text-xs text-red-400">Detection errored. Check detector service.</p>
        )}
      </div>
    </section>
  );
}
