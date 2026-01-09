"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CameraSection } from "../components/CameraSection";
import { ControlPanel } from "../components/ControlPanel";
import { IntegrationNotes } from "../components/IntegrationNotes";
import { SensorsPanel } from "../components/SensorsPanel";
import { ShowcaseSection } from "../components/ShowcaseSection";
import { StatusHeader } from "../components/StatusHeader";
import {
  DetectionBox,
  DetectionStatus,
  Telemetry,
  WsStatus,
} from "../types/robot";

const MJPEG_URL =
  process.env.NEXT_PUBLIC_MJPEG_URL ?? "http://pi.local:8080/stream";
const WS_URL = process.env.NEXT_PUBLIC_PI_WS ?? "ws://pi.local:9000/ws";

console.log("MJPEG_URL", MJPEG_URL);
const DETECT_URL =
  process.env.NEXT_PUBLIC_DETECT_URL ?? "http://localhost:5000/detect";

export default function Home() {
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
  const [wsAlert, setWsAlert] = useState<string>("");
  const [telemetry, setTelemetry] = useState<Telemetry>({});
  const [lastMessage, setLastMessage] = useState<string>("");
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>("idle");
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
      <StatusHeader wsStatus={wsStatus} />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_minmax(0,1fr)]">
          <ControlPanel
            wsUrl={WS_URL}
            wsAlert={wsAlert}
            controlFeedback={controlFeedback}
            lastMessage={lastMessage}
            onDrive={handleDrive}
            onStop={handleStop}
            onPing={() => sendCommand({ type: "ping" })}
          />
          <CameraSection
            mjpegUrl={MJPEG_URL}
            detectionStatus={detectionStatus}
            canDetect={canDetect}
            imgRef={imgRef}
            canvasRef={canvasRef}
            onRunDetection={runDetection}
            onImageLoad={() => {
              // Trigger overlay redraw after dimensions settle.
              setDetectionBoxes((prev) => [...prev]);
            }}
          />
          <SensorsPanel telemetry={telemetry} />
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <ShowcaseSection />
          <IntegrationNotes />
        </section>
      </main>
    </div>
  );
}
