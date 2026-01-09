"use client";

import { WsStatus } from "../types/robot";

type StatusHeaderProps = {
  wsStatus: WsStatus;
};

const statusToColor: Record<WsStatus, string> = {
  connected: "bg-emerald-400",
  connecting: "bg-amber-400",
  disconnected: "bg-red-500",
};

export function StatusHeader({ wsStatus }: StatusHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">RoboInspector</p>
          <h1 className="text-2xl font-semibold">Inspection Robot Control</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`h-2 w-2 rounded-full ${statusToColor[wsStatus]}`} />
          <span className="text-zinc-300">WS: {wsStatus}</span>
        </div>
      </div>
    </header>
  );
}
