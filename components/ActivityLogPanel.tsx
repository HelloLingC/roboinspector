"use client";

import { useRef } from "react";
import { ActivityLogEntry } from "@/types/robot";

type ActivityLogPanelProps = {
  entries: ActivityLogEntry[];
  setEntries: (entries: ActivityLogEntry[]) => void;
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

export function ActivityLogPanel({ entries, setEntries, maxItems = 20 }: ActivityLogPanelProps) {
  const visibleEntries = entries.slice(0, maxItems);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(entries, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== "string") return;
        const data = JSON.parse(result);
        if (Array.isArray(data)) {
          setEntries(data as ActivityLogEntry[]);
        }
      } catch (err) {
        console.error("Failed to parse activity log JSON:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <section className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Automation trail</p>
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <p className="text-xs text-zinc-500">Detections & session status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!entries.length}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-700"
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
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
            Empty activity log...
          </li>
        )}
      </ul>
    </section>
  );
}
