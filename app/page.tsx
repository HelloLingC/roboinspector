"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlaceholderRobot, RobotShowcase } from "../components/RobotShowcase";

type Telemetry = {
  imu?: {
    accel?: { x: number; y: number; z: number };
    gyro?: { x: number; y: number; z: number };
    orientation?: { roll: number; pitch: number; yaw: number };
  };
  ts?: number;
  fps?: number;
};

type DetectionBox = {
  id?: string | number;
  label?: string;
  confidence?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const MJPEG_URL =
  process.env.NEXT_PUBLIC_MJPEG_URL ?? "http://pi.local:8080/stream";
const WS_URL = process.env.NEXT_PUBLIC_PI_WS ?? "ws://pi.local:9000/ws";

console.log("MJPEG_URL", MJPEG_URL);
const DETECT_URL =
  process.env.NEXT_PUBLIC_DETECT_URL ?? "http://localhost:5000/detect";

export default function Home() {
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">(
    "disconnected",
  );
  const [wsAlert, setWsAlert] = useState<string>("");
  const [telemetry, setTelemetry] = useState<Telemetry>({});
  const [lastMessage, setLastMessage] = useState<string>("");
  const [detectionStatus, setDetectionStatus] = useState<
    "idle" | "running" | "error"
  >("idle");
  const [detectionBoxes, setDetectionBoxes] = useState<DetectionBox[]>([]);
  const [controlFeedback, setControlFeedback] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canDetect = useMemo(() => Boolean(DETECT_URL), []);

  useEffect(() => {
    if (!WS_URL) {
      setWsStatus("disconnected");
      setWsAlert(
        "WebSocket URL is missing. Commands will attempt HTTP fallback if available.",
      );
      return;
    }
    setWsStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      setWsAlert("");
    };
    ws.onclose = () => {
      setWsStatus("disconnected");
      setWsAlert(
        "WebSocket disconnected. Commands will use HTTP fallback; check the WS server.",
      );
    };
    ws.onerror = () => {
      setWsStatus("disconnected");
      setWsAlert(
        "WebSocket connection failed. Using HTTP fallback; verify NEXT_PUBLIC_PI_WS.",
      );
      console.warn("WebSocket connection error, falling back to HTTP if possible.");
    };
    ws.onmessage = (event) => {
      setLastMessage(event.data);
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.telemetry) {
          setTelemetry({
            ...parsed.telemetry,
            ts: Date.now(),
          });
        }
      } catch {
        // Non-JSON message; keep lastMessage only.
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { naturalWidth, naturalHeight } = img;
      if (!naturalWidth || !naturalHeight) return;
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;
      ctx.clearRect(0, 0, naturalWidth, naturalHeight);
      detectionBoxes.forEach((box) => {
        const { x1, y1, x2, y2, label, confidence } = box;
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x1 * naturalWidth,
          y1 * naturalHeight,
          (x2 - x1) * naturalWidth,
          (y2 - y1) * naturalHeight,
        );
        if (label) {
          const text = `${label}${confidence ? ` ${(confidence * 100).toFixed(0)}%` : ""}`;
          ctx.fillStyle = "rgba(34, 197, 94, 0.85)";
          ctx.font = "14px sans-serif";
          const textWidth = ctx.measureText(text).width + 8;
          const boxHeight = 20;
          ctx.fillRect(x1 * naturalWidth, y1 * naturalHeight - boxHeight, textWidth, boxHeight);
          ctx.fillStyle = "#fff";
          ctx.fillText(text, x1 * naturalWidth + 4, y1 * naturalHeight - 5);
        }
      });
    };

    draw();
  }, [detectionBoxes]);

  const sendCommand = async (payload: Record<string, unknown>) => {
    const json = JSON.stringify(payload);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(json);
      setControlFeedback("Sent via WebSocket");
      return;
    }
    try {
      await fetch(WS_URL.replace("ws", "http"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      setControlFeedback("Sent via HTTP fallback");
    } catch (err) {
      setControlFeedback(`Send failed: ${(err as Error).message}`);
    }
  };

  const handleDrive = (throttle: number, steer: number) => {
    sendCommand({ type: "drive", throttle, steer });
  };

  const handleStop = () => {
    sendCommand({ type: "stop" });
  };

  const runDetection = async () => {
    if (!canDetect) return;
    setDetectionStatus("running");
    try {
      const res = await fetch(DETECT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameUrl: MJPEG_URL }),
      });
      const data = await res.json();
      setDetectionBoxes(data?.boxes ?? []);
      setDetectionStatus("idle");
    } catch (err) {
      setDetectionStatus("error");
      setControlFeedback(`Detection failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">RoboInspector</p>
            <h1 className="text-2xl font-semibold">Inspection Robot Control</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                wsStatus === "connected"
                  ? "bg-emerald-400"
                  : wsStatus === "connecting"
                    ? "bg-amber-400"
                    : "bg-red-500"
              }`}
            />
            <span className="text-zinc-300">WS: {wsStatus}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Live Video (MJPEG)</p>
              <h2 className="text-lg font-semibold">Camera</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>MJPEG:</span>
              <code className="rounded bg-black/40 px-2 py-1">{MJPEG_URL}</code>
            </div>
          </div>
          <div className="relative mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-black">
            <img
              ref={imgRef}
              src={MJPEG_URL}
              alt="Robot camera feed"
              className="block w-full"
              crossOrigin="anonymous"
              onLoad={() => {
                // Trigger overlay redraw after dimensions settle.
                setDetectionBoxes((prev) => [...prev]);
              }}
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={runDetection}
              disabled={!canDetect || detectionStatus === "running"}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-emerald-500/50"
            >
              {detectionStatus === "running" ? "Detecting..." : "Run People Detection"}
            </button>
            {!canDetect && (
              <p className="text-xs text-amber-300">
                Set NEXT_PUBLIC_DETECT_URL to enable detection.
              </p>
            )}
            {detectionStatus === "error" && (
              <p className="text-xs text-red-400">Detection errored. Check detector service.</p>
            )}
          </div>
        </section>

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
              Forward
            </button>
            <button
              onClick={() => handleDrive(-1, 0)}
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            >
              Reverse
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
              onClick={() => sendCommand({ type: "ping" })}
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

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Sensors</p>
              <h2 className="text-lg font-semibold">IMU / Status</h2>
            </div>
            {telemetry.ts && (
              <p className="text-xs text-zinc-500">
                Updated {Math.round((Date.now() - telemetry.ts) / 1000)}s ago
              </p>
            )}
          </div>
          <div className="mt-3 space-y-2 text-sm text-zinc-200">
            <div className="flex justify-between">
              <span>Accel</span>
              <span className="text-zinc-400">
                {telemetry.imu?.accel
                  ? `${telemetry.imu.accel.x?.toFixed(2)}, ${telemetry.imu.accel.y?.toFixed(2)}, ${telemetry.imu.accel.z?.toFixed(2)}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gyro</span>
              <span className="text-zinc-400">
                {telemetry.imu?.gyro
                  ? `${telemetry.imu.gyro.x?.toFixed(2)}, ${telemetry.imu.gyro.y?.toFixed(2)}, ${telemetry.imu.gyro.z?.toFixed(2)}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Orientation</span>
              <span className="text-zinc-400">
                {telemetry.imu?.orientation
                  ? `${telemetry.imu.orientation.roll?.toFixed(1)} / ${telemetry.imu.orientation.pitch?.toFixed(1)} / ${telemetry.imu.orientation.yaw?.toFixed(1)}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>FPS</span>
              <span className="text-zinc-400">{telemetry.fps ?? "—"}</span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Integration Notes</p>
              <h2 className="text-lg font-semibold">Wire up your endpoints</h2>
            </div>
          </div>
          <div className="mt-3 grid gap-3 text-sm text-zinc-200 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="font-medium text-zinc-100">Env variables</p>
              <ul className="mt-2 space-y-1 text-zinc-400">
                <li>`NEXT_PUBLIC_MJPEG_URL` — MJPEG stream URL from Pi.</li>
                <li>`NEXT_PUBLIC_PI_WS` — WebSocket endpoint for control/telemetry.</li>
                <li>`NEXT_PUBLIC_DETECT_URL` — Local detector endpoint (optional).</li>
              </ul>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="font-medium text-zinc-100">Expected payloads</p>
              <ul className="mt-2 space-y-1 text-zinc-400">
                <li>Drive: {"{ type: \"drive\", throttle: -1..1, steer: -1..1 }"}</li>
                <li>Stop: {"{ type: \"stop\" }"}</li>
                <li>Telemetry message should include `telemetry` with IMU/FPS fields.</li>
                <li>Detector returns {"{ boxes: [{x1,y1,x2,y2,label?,confidence?}] }"} normalized 0-1.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <section className="mx-auto mb-8 mt-2 grid max-w-6xl gap-6 px-6 lg:grid-cols-3">
        <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">3D Model Showcase</p>
              <h2 className="text-lg font-semibold">Robot Car Visualization</h2>
              <p className="text-xs text-zinc-500">Inspect the robot in 3D.</p>
            </div>
          </div>
          <div className="mt-3">
            <RobotShowcase />
          </div>
        </div>
      </section>
    </div>
  );
}
