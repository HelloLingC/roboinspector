import Link from "next/link";
import Image from "next/image";

import { detectionSqlitePath, getStreamPersonDetections } from "@/lib/detectionSqliteStore";
import type { StreamPersonDetectionRecord } from "@/types/robot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatBBox(x1: number, y1: number, x2: number, y2: number) {
  return `${x1.toFixed(1)}, ${y1.toFixed(1)} -> ${x2.toFixed(1)}, ${y2.toFixed(1)}`;
}

function getBBoxMetrics(x1: number, y1: number, x2: number, y2: number) {
  const width = Math.max(0, x2 - x1);
  const height = Math.max(0, y2 - y1);
  const area = width * height;

  return { width, height, area };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default async function DetectionPage() {
  let errorMessage = "";
  let detections: StreamPersonDetectionRecord[] = [];

  try {
    detections = getStreamPersonDetections(100);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "未知错误";
  }

  const totalRows = detections.length;
  const uniqueTrackCount = new Set(detections.map((item) => item.trackId).filter((id) => id != null)).size;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">人员检测记录</h1>
            <p className="mt-1 text-sm text-zinc-300">
              SQLite 数据源: <code className="rounded bg-zinc-900 px-2 py-1 text-zinc-200">{detectionSqlitePath}</code>
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900"
          >
            返回控制台
          </Link>
        </header>

        {errorMessage ? (
          <section className="rounded-xl border border-red-900/70 bg-red-950/50 p-4">
            <h2 className="text-base font-medium text-red-200">加载检测记录失败</h2>
            <p className="mt-2 text-sm text-red-100">{errorMessage}</p>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-sm text-zinc-300">已加载条目</p>
            <p className="mt-1 text-3xl font-semibold">{totalRows}</p>
          </article>
          <article className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-sm text-zinc-300">唯一跟踪 ID 数</p>
            <p className="mt-1 text-3xl font-semibold">{uniqueTrackCount}</p>
          </article>
        </section>

        {detections.length === 0 && !errorMessage ? (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-300">
            SQLite 中未找到人员检测记录。
          </section>
        ) : null}

        {detections.map((detection) => {
          const metrics = getBBoxMetrics(detection.bboxX1, detection.bboxY1, detection.bboxX2, detection.bboxY2);
          const confidenceRatio = clamp01(detection.confidence);
          const confidencePercent = confidenceRatio * 100;

          return (
            <section key={detection.id} className="overflow-visible rounded-xl border border-zinc-800 bg-zinc-900/70">
              <div className="grid gap-3 border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  <span className="text-zinc-400">行 ID:</span> {detection.id}
                </p>
                <p>
                  <span className="text-zinc-400">检测时间:</span> {formatDate(detection.detectedAt)}
                </p>
                <p>
                  <span className="text-zinc-400">跟踪 ID:</span> {detection.trackId ?? "-"}
                </p>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-[260px_1fr]">
                <div className="relative z-10 w-full">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950/80">
                    <Image
                      src={detection.cropDataUrl}
                      alt={`检测截图 ${detection.id}`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 260px"
                      className="object-contain p-1"
                    />
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">裁剪尺寸</p>
                      <p className="font-mono text-zinc-200">
                        {Math.round(metrics.width)} x {Math.round(metrics.height)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-700/70 bg-zinc-900/80 px-3 py-2">
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-medium uppercase tracking-wide text-zinc-400">置信度</span>
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-200">
                          {confidencePercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-zinc-700/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 transition-all duration-300"
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">边界框面积</p>
                      <p className="font-mono text-zinc-200">{Math.round(metrics.area).toLocaleString()} px^2</p>
                    </div>
                  </div>
                  <p className="text-zinc-300">
                    <span className="text-zinc-400">边界框:</span>{" "}
                    <span className="font-mono text-xs sm:text-sm">
                      {formatBBox(detection.bboxX1, detection.bboxY1, detection.bboxX2, detection.bboxY2)}
                    </span>
                  </p>
                  <p className="break-all text-zinc-300">
                    <span className="text-zinc-400">流地址:</span> {detection.streamUrl}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
