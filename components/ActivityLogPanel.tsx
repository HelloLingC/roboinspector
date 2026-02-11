"use client";

import Link from "next/link";
import { ActivityLogEntry } from "@/types/robot";
import { useActivityLogSSE } from "@/lib/useActivityLogSSE";

type ActivityLogPanelProps = {
  entries: ActivityLogEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>;
  maxItems?: number;
  sseUrl?: string;
};

const levelToColor: Record<ActivityLogEntry["level"], string> = {
  success: "bg-emerald-500/30 text-emerald-200 border-emerald-500/30",
  info: "bg-sky-500/20 text-sky-200 border-sky-500/30",
  error: "bg-rose-500/20 text-rose-200 border-rose-500/30",
};

function formatTime(ts: number) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ActivityLogPanel({ entries, setEntries, maxItems = 20, sseUrl }: ActivityLogPanelProps) {
  const visibleEntries = entries.slice(0, maxItems);

  useActivityLogSSE(entries, setEntries, { url: sseUrl, maxItems });

  return (
    <section className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Automation trail</p>
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <p className="text-xs text-zinc-500">Detections & session status</p>
        </div>
        <Link
          href="/detection"
          className="rounded-lg border border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-indigo-500/20 px-3 py-2 text-sm font-medium text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_8px_24px_-12px_rgba(59,130,246,0.65)] transition hover:from-cyan-400/30 hover:via-sky-400/30 hover:to-indigo-400/30 hover:text-white"
        >
          View detection records
        </Link>
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
              <span className="text-xs text-zinc-500">{formatTime(entry.ts)}</span>
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-zinc-800/60 bg-zinc-950/20 p-6 text-center text-sm text-zinc-500">
            Empty activity log...
          </li>
        )}
      </ul>
    </section>
  );
}
