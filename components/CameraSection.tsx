"use client";

import { MutableRefObject } from "react";

type CameraSectionProps = {
  mjpegUrl: string;
  canDetect: boolean;
  imgRef: MutableRefObject<HTMLImageElement | null>;
  onImageLoad: () => void;
};

export function CameraSection({
  mjpegUrl,
  canDetect,
  imgRef,
  onImageLoad,
}: CameraSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Live Stream</p>
          <h2 className="text-lg font-semibold">Camera</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>MJPEG:</span>
          <code className="rounded bg-black/40 px-2 py-1">{mjpegUrl}</code>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-black">
          <video autoPlay muted loop playsInline suppressHydrationWarning>
            <source src="demo.mp4" type="video/mp4" />
          </video>
          <img
            ref={imgRef}
            src={mjpegUrl}
            alt="Robot camera feed"
            className="h-full w-full object-contain"
            crossOrigin="anonymous"
            onLoad={onImageLoad}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {!canDetect && (
          <p className="text-xs text-amber-300">
            Set NEXT_PUBLIC_DETECT_URL to enable detection.
          </p>
        )}
      </div>
    </section>
  );
}
