"use client";

import { ActivityLogEntry } from "@/types/robot";

type ActivityLogPanelProps = {
  entries: ActivityLogEntry[];
  maxItems?: number;
};

const levelToColor: Record<ActivityLogEntry["level"], string> = {
  success: "bg-emerald-500/30 text-emerald-200 border-emerald-500/30",
  info: "bg-sky-500/20 text-sky-200 border-sky-500/30",
  error: "bg-rose-500/20 text-rose-200 border-rose-500/30",
};

function relativeTime(ts: number) {
  const diffMs = Date.now() - ts;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 1) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityLogPanel({ entries, maxItems = 20 }: ActivityLogPanelProps) {
  const visibleEntries = entries.slice(0, maxItems);

  return (
    <section className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Automation trail</p>
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <p className="text-xs text-zinc-500">Detections & session status</p>
        </div>
        <span className="text-xs text-zinc-500">
          {visibleEntries.length ? "Live" : "No entries yet"}
        </span>
      </div>
      <ul className="mt-4 space-y-3 text-sm">
        {visibleEntries.length ? (
          visibleEntries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${levelToColor[entry.level]}`}
                  >
                    {entry.scope}
                  </span>
                  <p className="font-medium text-zinc-50">{entry.title}</p>
                </div>
                {entry.detail && (
                  <p className="text-xs text-zinc-400">{entry.detail}</p>
                )}
              </div>
              <span className="text-xs text-zinc-500">{relativeTime(entry.ts)}</span>
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-zinc-800/60 bg-zinc-950/20 p-6 text-center text-sm text-zinc-500">
            Start a detection run or reconnect the robot to see entries here.
          </li>
        )}
      </ul>
    </section>
  );
}
