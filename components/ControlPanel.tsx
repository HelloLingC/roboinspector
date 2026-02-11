"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RobotWebSocketClient } from "@/lib/robotWebSocketClient";
import { ActivityLogEntry, Telemetry } from "@/types/robot";

const WS_URL = process.env.NEXT_PUBLIC_PI_WS ?? "ws://pi.local:9000/ws";

type ControlPanelProps = {
  isUnlocked: boolean;
  onTelemetryChange: (telemetry: Telemetry) => void;
  onLog: (entry: Omit<ActivityLogEntry, "id">) => void;
};

type MovementState =
  | "idle"
  | "forward"
  | "reverse"
  | "left"
  | "right"
  | "stopped"
  | "error";

const movementStateStyles: Record<
  MovementState,
  { label: string; detail: string; badge: string; dot: string }
> = {
  idle: {
    label: "Idle",
    detail: "Awaiting movement command.",
    badge: "border-zinc-700/70 bg-zinc-800/50 text-zinc-300",
    dot: "bg-zinc-500",
  },
  forward: {
    label: "Moving forward",
    detail: "Throttle applied in forward direction.",
    badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  reverse: {
    label: "Reversing",
    detail: "Throttle applied in reverse direction.",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-400",
  },
  left: {
    label: "Turning left",
    detail: "Steering bias is active to the left.",
    badge: "border-sky-500/40 bg-sky-500/10 text-sky-200",
    dot: "bg-sky-400",
  },
  right: {
    label: "Turning right",
    detail: "Steering bias is active to the right.",
    badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
    dot: "bg-cyan-400",
  },
  stopped: {
    label: "Stopped",
    detail: "Motors are commanded to stop.",
    badge: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-400",
  },
  error: {
    label: "Command failed",
    detail: "Last movement command did not send successfully.",
    badge: "border-red-500/40 bg-red-500/10 text-red-200",
    dot: "bg-red-400",
  },
};

export function ControlPanel({
  isUnlocked,
  onTelemetryChange,
  onLog,
}: ControlPanelProps) {
  const [lastMessage, setLastMessage] = useState<string>("");
  const [controlFeedback, setControlFeedback] = useState<string>("");
  const [movementState, setMovementState] = useState<MovementState>("idle");
  const [lastMovementCommandAt, setLastMovementCommandAt] = useState<number | null>(
    null,
  );
  const clientRef = useRef<RobotWebSocketClient | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;
    const client = new RobotWebSocketClient({
      wsUrl: WS_URL,
      handlers: {
        onMessage: (message) => setLastMessage(message),
        onTelemetry: (nextTelemetry) => onTelemetryChange(nextTelemetry),
        onLog,
      },
    });

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [onLog, isUnlocked, onTelemetryChange]);

  const sendCommand = useCallback(
    async (
      payload: Record<string, unknown>,
      nextMovementState?: MovementState,
    ) => {
      if (!isUnlocked) {
        setControlFeedback("Authenticate to control the robot.");
        if (nextMovementState) {
          setMovementState("error");
          setLastMovementCommandAt(Date.now());
        }
        return;
      }
      if (!clientRef.current) {
        setControlFeedback("Send failed: WebSocket client unavailable");
        if (nextMovementState) {
          setMovementState("error");
          setLastMovementCommandAt(Date.now());
        }
        return;
      }
      try {
        const transport = await clientRef.current.send(payload);
        setControlFeedback(
          transport === "ws" ? "Sent via WebSocket" : "Sent via HTTP fallback",
        );
        if (nextMovementState) {
          setMovementState(nextMovementState);
          setLastMovementCommandAt(Date.now());
        }
      } catch (err) {
        setControlFeedback(`Send failed: ${(err as Error).message}`);
        if (nextMovementState) {
          setMovementState("error");
          setLastMovementCommandAt(Date.now());
        }
      }
    },
    [isUnlocked],
  );

  const handleDrive = (throttle: number, steer: number) => {
    let nextState: MovementState = "forward";
    if (throttle < 0) {
      nextState = "reverse";
    } else if (steer < 0) {
      nextState = "left";
    } else if (steer > 0) {
      nextState = "right";
    }
    sendCommand({ type: "drive", throttle, steer }, nextState);
  };

  const handleStop = () => {
    sendCommand({ type: "stop" }, "stopped");
  };

  const handlePing = () => {
    sendCommand({ type: "ping" });
  };

  const movementStyle = movementStateStyles[movementState];

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Control</p>
          <h2 className="text-lg font-semibold">Drive</h2>
        </div>
        <code className="rounded bg-black/40 px-2 py-1 text-xs text-zinc-400">
          {WS_URL}
        </code>
      </div>
      <div className="mt-3 rounded-xl border border-zinc-800/70 bg-zinc-950/55 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          Movement status
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${movementStyle.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${movementStyle.dot}`} />
            <span>{movementStyle.label}</span>
          </div>
          <span className="text-xs text-zinc-500">
            {lastMovementCommandAt
              ? new Date(lastMovementCommandAt).toLocaleTimeString()
              : "No command yet"}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">{movementStyle.detail}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => handleDrive(1, 0)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Forw
        </button>
        <button
          onClick={() => handleDrive(-1, 0)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Back
        </button>
        <button
          onClick={handleStop}
          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-black hover:bg-red-400"
        >
          Stop
        </button>
        <button
          onClick={() => handleDrive(0.5, -1)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Left
        </button>
        <button
          onClick={() => handleDrive(0.5, 1)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          Right
        </button>
        <button
          onClick={handlePing}
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
    </section>
  );
}
