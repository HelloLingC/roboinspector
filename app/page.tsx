"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraSection, type MjpegSourceOption } from "../components/CameraSection";
import { ControlPanel } from "../components/ControlPanel";
import { AuthenticationDialog, AuthCredentials } from "../components/AuthenticationDialog";
import { ActivityLogPanel } from "../components/ActivityLogPanel";
import { SensorsPanel } from "../components/SensorsPanel";
import { ShowcaseSection } from "../components/ShowcaseSection";
import {
  ActivityLogEntry,
  Telemetry,
} from "../types/robot";

const AI_DETECT_MJPEG_URL =
  process.env.NEXT_PUBLIC_MJPEG_URL ??
  "http://127.0.0.1:9000/predict/stream/annotated?conf=0.25&quality=75&device=0";
const AUTH_SESSION_STORAGE_KEY = "roboinspector:dashboard-auth";
const DEMO_ACCESS_CODE =
  process.env.NEXT_PUBLIC_DASHBOARD_PASSCODE ?? "123456";
const DEFAULT_MJPEG_SOURCE_ID: MjpegSourceOption["id"] = "pi-lan";
const MJPEG_SOURCE_OPTIONS: MjpegSourceOption[] = [
  { id: "pi-lan", label: "pi.lan", url: "http://pi.lan:8080/stream.mjpg" },
  { id: "ai-detect", label: "AI Detect", url: AI_DETECT_MJPEG_URL },
];

export default function Home() {
  const [telemetry, setTelemetry] = useState<Telemetry>({});
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [activeMjpegSourceId, setActiveMjpegSourceId] =
    useState<MjpegSourceOption["id"]>(DEFAULT_MJPEG_SOURCE_ID);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const activeMjpegSource = useMemo(
    () =>
      MJPEG_SOURCE_OPTIONS.find((option) => option.id === activeMjpegSourceId) ??
      MJPEG_SOURCE_OPTIONS.find((option) => option.id === DEFAULT_MJPEG_SOURCE_ID) ??
      MJPEG_SOURCE_OPTIONS[0],
    [activeMjpegSourceId],
  );

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
          title: "仪表盘验证通过",
          detail: email ? `已认证账号：${email}` : "已以访客身份认证",
        });
        setAuthSubmitting(false);
        return;
      }
      setAuthError(`访问码不匹配。演示环境请使用“${DEMO_ACCESS_CODE}”。`);
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

  const showAuthGate = !authChecked || !isUnlocked;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* <StatusHeader wsStatus={wsStatus} /> */}

      <main
        className={`mx-auto max-w-7xl space-y-6 px-6 py-6 ${showAuthGate ? "pointer-events-none blur-sm" : ""
          }`}
        aria-hidden={showAuthGate}
      >
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_minmax(0,1fr)]">
          <ControlPanel
            isUnlocked={isUnlocked}
            onTelemetryChange={setTelemetry}
            onLog={pushLog}
          />
          <CameraSection
            activeSourceId={activeMjpegSource.id}
            sourceOptions={MJPEG_SOURCE_OPTIONS}
            onSourceChange={setActiveMjpegSourceId}
            imgRef={imgRef}
            onImageLoad={() => {
            }}
          />
          <SensorsPanel telemetry={telemetry} />
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <ShowcaseSection />
          <ActivityLogPanel entries={activityLog} setEntries={setActivityLog} />
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
