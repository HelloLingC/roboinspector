import Link from "next/link";

import { detectionSqlitePath, getDetectionsWithPersons } from "@/lib/detectionSqliteStore";
import type { DetectionRecord } from "@/types/robot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatBBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  return `${x1.toFixed(1)}, ${y1.toFixed(1)} -> ${x2.toFixed(1)}, ${y2.toFixed(1)}`;
}

export default async function DetectionPage() {
  let errorMessage = "";
  let detections: DetectionRecord[] = [];

  try {
    detections = getDetectionsWithPersons(100);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  const totalDetections = detections.length;
  const totalPersons = detections.reduce((sum, item) => sum + item.persons.length, 0);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Detection Records</h1>
            <p className="mt-1 text-sm text-zinc-300">
              SQLite source: <code className="rounded bg-zinc-900 px-2 py-1 text-zinc-200">{detectionSqlitePath}</code>
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900"
          >
            Back to Dashboard
          </Link>
        </header>

        {errorMessage ? (
          <section className="rounded-xl border border-red-900/70 bg-red-950/50 p-4">
            <h2 className="text-base font-medium text-red-200">Failed to load detections</h2>
            <p className="mt-2 text-sm text-red-100">{errorMessage}</p>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-sm text-zinc-300">Total detection events</p>
            <p className="mt-1 text-3xl font-semibold">{totalDetections}</p>
          </article>
          <article className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-sm text-zinc-300">Total detected people</p>
            <p className="mt-1 text-3xl font-semibold">{totalPersons}</p>
          </article>
        </section>

        {detections.length === 0 && !errorMessage ? (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-300">
            No detection records found yet.
          </section>
        ) : null}

        {detections.map((detection) => (
          <section key={detection.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
            <div className="grid gap-3 border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <p>
                <span className="text-zinc-400">Detection ID:</span> {detection.id}
              </p>
              <p>
                <span className="text-zinc-400">Timestamp:</span> {formatDate(detection.timestamp)}
              </p>
              <p>
                <span className="text-zinc-400">People in frame:</span> {detection.totalCount}
              </p>
              <p>
                <span className="text-zinc-400">Frame:</span>{" "}
                {detection.frameWidth != null && detection.frameHeight != null
                  ? `${detection.frameWidth} x ${detection.frameHeight}`
                  : "Unknown"}
              </p>
              <p>
                <span className="text-zinc-400">Saved:</span> {formatDate(detection.createdAt)}
              </p>
            </div>

            {detection.persons.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-400">No person rows linked to this detection.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-900/80 text-left text-zinc-300">
                    <tr>
                      <th className="px-4 py-2 font-medium">Person row ID</th>
                      <th className="px-4 py-2 font-medium">Track ID</th>
                      <th className="px-4 py-2 font-medium">Confidence</th>
                      <th className="px-4 py-2 font-medium">Bounding Box (x1, y1 - x2, y2)</th>
                      <th className="px-4 py-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detection.persons.map((person) => (
                      <tr key={person.id} className="border-t border-zinc-800">
                        <td className="px-4 py-2">{person.id}</td>
                        <td className="px-4 py-2">{person.trackId ?? "-"}</td>
                        <td className="px-4 py-2">{person.confidence.toFixed(3)}</td>
                        <td className="px-4 py-2 font-mono text-xs sm:text-sm">
                          {formatBBox(person.bboxX1, person.bboxY1, person.bboxX2, person.bboxY2)}
                        </td>
                        <td className="px-4 py-2">{formatDate(person.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
