"use client";

import { MutableRefObject } from "react";

export type MjpegSourceOption = {
  id: "ai-detect" | "pi-lan";
  label: string;
  url: string;
};

type CameraSectionProps = {
  activeSourceId: MjpegSourceOption["id"];
  sourceOptions: MjpegSourceOption[];
  onSourceChange: (sourceId: MjpegSourceOption["id"]) => void;
  imgRef: MutableRefObject<HTMLImageElement | null>;
  onImageLoad: () => void;
};

export function CameraSection({
  activeSourceId,
  sourceOptions,
  onSourceChange,
  imgRef,
  onImageLoad,
}: CameraSectionProps) {
  const activeSource =
    sourceOptions.find((option) => option.id === activeSourceId) ?? sourceOptions[0];

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">实时视频流</p>
          <h2 className="text-lg font-semibold">摄像头</h2>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 text-xs text-zinc-400">
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950/80 p-1">
            {sourceOptions.map((option) => {
              const isActive = option.id === activeSourceId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSourceChange(option.id)}
                  className={`rounded-md px-3 py-1.5 transition ${isActive
                    ? "bg-cyan-400/20 text-cyan-100"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">MJPEG:</span>
            <a
              href={activeSource.url}
              target="_blank"
              rel="noreferrer"
              className="block w-56 max-w-full truncate rounded bg-black/40 px-2 py-1 text-cyan-100 transition hover:bg-cyan-400/15 hover:text-cyan-50 sm:w-72"
              title={activeSource.url}
            >
              {activeSource.url}
            </a>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-800 bg-black">
          {/* `next/image` does not support live MJPEG stream rendering. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={activeSource.url}
            alt="机器人摄像头画面"
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
            onLoad={onImageLoad}
          />
        </div>
      </div>
    </section>
  );
}
