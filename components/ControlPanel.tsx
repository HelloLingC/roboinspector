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

export function ControlPanel({
  isUnlocked,
  onTelemetryChange,
  onLog,
}: ControlPanelProps) {
  const [wsAlert, setWsAlert] = useState<string>("");
  const [lastMessage, setLastMessage] = useState<string>("");
  const [controlFeedback, setControlFeedback] = useState<string>("");
  const clientRef = useRef<RobotWebSocketClient | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;
    const client = new RobotWebSocketClient({
      wsUrl: WS_URL,
      handlers: {
        onStatusChange: (_status, alert) => {
          setWsAlert(alert ?? "");
        },
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
    async (payload: Record<string, unknown>) => {
      if (!isUnlocked) {
        setControlFeedback("Authenticate to control the robot.");
        return;
      }
      if (!clientRef.current) {
        setControlFeedback("Send failed: WebSocket client unavailable");
        return;
      }
      try {
        const transport = await clientRef.current.send(payload);
        setControlFeedback(
          transport === "ws" ? "Sent via WebSocket" : "Sent via HTTP fallback",
        );
      } catch (err) {
        setControlFeedback(`Send failed: ${(err as Error).message}`);
      }
    },
    [isUnlocked],
  );

  const handleDrive = (throttle: number, steer: number) => {
    sendCommand({ type: "drive", throttle, steer });
  };

  const handleStop = () => {
    sendCommand({ type: "stop" });
  };

  const handlePing = () => {
    sendCommand({ type: "ping" });
  };

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
      {wsAlert && (
        <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {wsAlert}
        </p>
      )}
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
