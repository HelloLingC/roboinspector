"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraSection } from "../components/CameraSection";
import { ControlPanel } from "../components/ControlPanel";
import { AuthenticationDialog, AuthCredentials } from "../components/AuthenticationDialog";
import { IntegrationNotes } from "../components/IntegrationNotes";
import { ActivityLogPanel } from "../components/ActivityLogPanel";
import { SensorsPanel } from "../components/SensorsPanel";
import { ShowcaseSection } from "../components/ShowcaseSection";
import { StatusHeader } from "../components/StatusHeader";
import { RobotWebSocketClient } from "@/lib/robotWebSocketClient";
import {
  DetectionBox,
  DetectionStatus,
  ActivityLogEntry,
  Telemetry,
  WsStatus,
} from "../types/robot";

const MJPEG_URL =
  process.env.NEXT_PUBLIC_MJPEG_URL ?? "http://pi.local:8080/stream";
const WS_URL = process.env.NEXT_PUBLIC_PI_WS ?? "ws://pi.local:9000/ws";

console.log("MJPEG_URL", MJPEG_URL);
const DETECT_URL =
  process.env.NEXT_PUBLIC_DETECT_URL ?? "http://localhost:5000/detect";
const AUTH_SESSION_STORAGE_KEY = "roboinspector:dashboard-auth";
const DEMO_ACCESS_CODE =
  process.env.NEXT_PUBLIC_DASHBOARD_PASSCODE ?? "ROBO-ACCESS";

export default function Home() {
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
  const [wsAlert, setWsAlert] = useState<string>("");
  const [telemetry, setTelemetry] = useState<Telemetry>({});
  const [lastMessage, setLastMessage] = useState<string>("");
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>("idle");
  const [detectionBoxes, setDetectionBoxes] = useState<DetectionBox[]>([]);
  const [controlFeedback, setControlFeedback] = useState<string>("");
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const clientRef = useRef<RobotWebSocketClient | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canDetect = useMemo(() => Boolean(DETECT_URL), []);

  const pushLog = useCallback((entry: Omit<ActivityLogEntry, "id">) => {
    setActivityLog((prev) => {
      const newEntry: ActivityLogEntry = {
        ...entry,
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      };
      return [newEntry, ...prev].slice(0, 40);
    });
  }, []);

  const handleAuthenticate = useCallback(
    async ({ email, accessCode }: AuthCredentials) => {
      setAuthSubmitting(true);
      setAuthError("");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const isMatch =
        accessCode.trim().toUpperCase() === DEMO_ACCESS_CODE.toUpperCase();
      if (isMatch) {
        setIsUnlocked(true);
        try {
          window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, "granted");
        } catch {
          // Ignore storage errors in private mode.
        }
        pushLog({
          ts: Date.now(),
          scope: "session",
          level: "success",
          title: "Dashboard unlocked",
          detail: email ? `Authenticated as ${email}` : "Authenticated as guest",
        });
        setAuthSubmitting(false);
        return;
      }
      setAuthError(`Code mismatch. Use "${DEMO_ACCESS_CODE}" for this demo.`);
      setAuthSubmitting(false);
    },
    [pushLog],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (stored === "granted") {
        setIsUnlocked(true);
      }
    } catch {
      // Ignore storage errors (e.g., disabled cookies).
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;
    const client = new RobotWebSocketClient({
      wsUrl: WS_URL,
      handlers: {
        onStatusChange: (status, alert) => {
          setWsStatus(status);
          setWsAlert(alert ?? "");
        },
        onMessage: (message) => setLastMessage(message),
        onTelemetry: (nextTelemetry) => setTelemetry(nextTelemetry),
        onLog: pushLog,
      },
    });

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [pushLog, isUnlocked]);

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

  const runDetection = async () => {
    if (!isUnlocked) {
      setControlFeedback("Authenticate before running detection.");
      return;
    }
    if (!canDetect) return;
    pushLog({
      ts: Date.now(),
      scope: "detection",
      level: "info",
      title: "Detection requested",
      detail: "Processing the current frame.",
    });
    setDetectionStatus("running");
    try {
      const res = await fetch(DETECT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameUrl: MJPEG_URL }),
      });
      const data = await res.json();
      const boxes: DetectionBox[] = data?.boxes ?? [];
      setDetectionBoxes(boxes);
      setDetectionStatus("idle");
      pushLog({
        ts: Date.now(),
        scope: "detection",
        level: "success",
        title: "Detection complete",
        detail: boxes.length
          ? `${boxes.length} detection${boxes.length === 1 ? "" : "s"} reported.`
          : "No detections reported.",
      });
    } catch (err) {
      setDetectionStatus("error");
      setControlFeedback(`Detection failed: ${(err as Error).message}`);
      pushLog({
        ts: Date.now(),
        scope: "detection",
        level: "error",
        title: "Detection failed",
        detail: (err as Error).message,
      });
    }
  };

  const showAuthGate = !authChecked || !isUnlocked;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* <StatusHeader wsStatus={wsStatus} /> */}

      <main
        className={`mx-auto max-w-7xl space-y-6 px-6 py-6 ${
          showAuthGate ? "pointer-events-none blur-sm" : ""
        }`}
        aria-hidden={showAuthGate}
      >
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
          <ActivityLogPanel entries={activityLog} />
          {/* <IntegrationNotes /> */}
        </section>
        
      </main>
      <AuthenticationDialog
        open={showAuthGate}
        isSubmitting={authSubmitting}
        errorMessage={authError}
        expectedCodeHint={DEMO_ACCESS_CODE}
        onSubmit={handleAuthenticate}
      />
    </div>
  );
}
