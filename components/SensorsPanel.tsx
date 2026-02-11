"use client";

import { useEffect, useState } from "react";
import { Telemetry } from "@/types/robot";

type SensorsPanelProps = {
  telemetry: Telemetry;
};

const NO_DATA = "No data";

function hasTelemetrySignal(telemetry: Telemetry) {
  return (
    typeof telemetry.ts === "number" ||
    typeof telemetry.fps === "number" ||
    Boolean(
      telemetry.imu?.accel ||
        telemetry.imu?.gyro ||
        telemetry.imu?.orientation,
    )
  );
}

function buildSimulatedTelemetry(nowMs: number): Telemetry {
  const t = nowMs / 1000;

  return {
    ts: nowMs,
    fps: 30 + Math.sin(t * 0.9) * 2.8,
    imu: {
      accel: {
        x: Math.sin(t * 1.2) * 0.18,
        y: Math.cos(t * 0.8) * 0.14,
        z: 9.72 + Math.sin(t * 0.35) * 0.08,
      },
      gyro: {
        x: Math.sin(t * 0.65) * 0.9,
        y: Math.cos(t * 0.52) * 0.7,
        z: Math.sin(t * 0.78) * 1.1,
      },
      orientation: {
        roll: Math.sin(t * 0.45) * 7,
        pitch: Math.cos(t * 0.4) * 5,
        yaw: (t * 14) % 360,
      },
    },
  };
}

function formatNumber(value: number | undefined, digits: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(digits);
}

function formatVector(
  vector: { x: number; y: number; z: number } | undefined,
  digits = 2,
) {
  if (!vector) return NO_DATA;
  return `X ${formatNumber(vector.x, digits)}  Y ${formatNumber(vector.y, digits)}  Z ${formatNumber(vector.z, digits)}`;
}

function formatOrientation(
  orientation: { roll: number; pitch: number; yaw: number } | undefined,
) {
  if (!orientation) return NO_DATA;
  return `R ${formatNumber(orientation.roll, 1)}°  P ${formatNumber(orientation.pitch, 1)}°  Y ${formatNumber(orientation.yaw, 1)}°`;
}

function getFreshness(seconds: number | null) {
  if (seconds === null) {
    return {
      badge: "border-zinc-700/70 bg-zinc-800/50 text-zinc-300",
      dot: "bg-zinc-500",
      label: "No signal",
    };
  }
  if (seconds <= 2) {
    return {
      badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
      dot: "bg-emerald-400",
      label: "Live",
    };
  }
  if (seconds <= 8) {
    return {
      badge: "border-amber-500/40 bg-amber-500/10 text-amber-200",
      dot: "bg-amber-400",
      label: "Stale",
    };
  }
  return {
    badge: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-400",
    label: "Offline",
  };
}

type DataRowProps = {
  label: string;
  value: string;
};

function DataRow({ label, value }: DataRowProps) {
  const missing = value === NO_DATA;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/45 px-3 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span
        className={`text-right font-mono text-xs ${
          missing ? "text-zinc-500" : "text-zinc-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SensorsPanel({ telemetry }: SensorsPanelProps) {
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const isSimulated = !hasTelemetrySignal(telemetry);
  const displayTelemetry = isSimulated
    ? buildSimulatedTelemetry(nowMs)
    : telemetry;

  const updatedSeconds = displayTelemetry.ts
    ? Math.max(0, Math.round((nowMs - displayTelemetry.ts) / 1000))
    : null;
  const freshness = getFreshness(updatedSeconds);
  const fpsValue =
    typeof displayTelemetry.fps === "number" && Number.isFinite(displayTelemetry.fps)
      ? displayTelemetry.fps.toFixed(1)
      : "--";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/85 p-4 shadow-xl shadow-black/30 backdrop-blur">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
            Sensors
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
            IMU / Status
          </h2>
          <p className="text-xs text-zinc-500">Motion and frame diagnostics</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${freshness.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${freshness.dot}`} />
          <span>{freshness.label}</span>
          {/* {updatedSeconds !== null && (
            <span className="text-[11px] text-zinc-400">
              {updatedSeconds}s ago
            </span>
          )} */}
        </div>
      </div>

      <div className="relative mt-4 space-y-2.5">
        <DataRow
          label="Acceler"
          value={formatVector(displayTelemetry.imu?.accel)}
        />
        <DataRow label="Gyro" value={formatVector(displayTelemetry.imu?.gyro)} />
        <DataRow
          label="Orient"
          value={formatOrientation(displayTelemetry.imu?.orientation)}
        />
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/45 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            FPS
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-zinc-50">
            {fpsValue}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/45 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Update
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-200">
            {isSimulated
              ? "Simulated telemetry"
              : updatedSeconds === null
                ? "Waiting for telemetry"
                : "Telemetry active"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {isSimulated
              ? "Auto-generated demo feed"
              : updatedSeconds === null
                ? "No timestamp yet"
                : `Last packet ${updatedSeconds}s ago`}
          </p>
        </div>
      </div>
    </section>
  );
}
