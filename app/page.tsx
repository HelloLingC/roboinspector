"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraSection } from "../components/CameraSection";
import { ControlPanel } from "../components/ControlPanel";
import { AuthenticationDialog, AuthCredentials } from "../components/AuthenticationDialog";
import { ActivityLogPanel } from "../components/ActivityLogPanel";
import { SensorsPanel } from "../components/SensorsPanel";
import { ShowcaseSection } from "../components/ShowcaseSection";
import {
  ActivityLogEntry,
  Telemetry,
} from "../types/robot";

const MJPEG_URL =
  process.env.NEXT_PUBLIC_MJPEG_URL ?? "http://pi.local:8080/stream";

console.log("MJPEG_URL", MJPEG_URL);
const DETECT_URL =
  process.env.NEXT_PUBLIC_DETECT_URL ?? "http://localhost:5000/detect";
const AUTH_SESSION_STORAGE_KEY = "roboinspector:dashboard-auth";
const DEMO_ACCESS_CODE =
  process.env.NEXT_PUBLIC_DASHBOARD_PASSCODE ?? "ROBO-ACCESS";

export default function Home() {
  const [telemetry, setTelemetry] = useState<Telemetry>({});
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

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
          title: "仪表盘验证通过",
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
            mjpegUrl={MJPEG_URL}
            canDetect={canDetect}
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
