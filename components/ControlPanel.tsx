"use client";

type ControlPanelProps = {
  wsUrl: string;
  wsAlert: string;
  controlFeedback: string;
  lastMessage: string;
  onDrive: (throttle: number, steer: number) => void;
  onStop: () => void;
  onPing: () => void;
};

export function ControlPanel({
  wsUrl,
  wsAlert,
  controlFeedback,
  lastMessage,
  onDrive,
  onStop,
  onPing,
}: ControlPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Control</p>
          <h2 className="text-lg font-semibold">Drive</h2>
        </div>
        <code className="rounded bg-black/40 px-2 py-1 text-xs text-zinc-400">
          {wsUrl}
        </code>
      </div>
      {wsAlert && (
        <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {wsAlert}
        </p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => onDrive(1, 0)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Forw
        </button>
        <button
          onClick={() => onDrive(-1, 0)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Back
        </button>
        <button
          onClick={onStop}
          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-black hover:bg-red-400"
        >
          Stop
        </button>
        <button
          onClick={() => onDrive(0.5, -1)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Left
        </button>
        <button
          onClick={() => onDrive(0.5, 1)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Right
        </button>
        <button
          onClick={onPing}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Ping
        </button>
      </div>
      {controlFeedback && (
        <p className="mt-3 text-xs text-zinc-400">Status: {controlFeedback}</p>
      )}
      {lastMessage && (
        <p className="mt-1 text-xs text-zinc-500">Last message: {lastMessage}</p>
      )}

      <button
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-emerald-500/50"
        >
          IDK
        </button>
    </section>
  );
}
