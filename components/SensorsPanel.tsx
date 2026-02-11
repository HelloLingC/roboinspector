"use client";

import { useEffect, useMemo, useState } from "react";
import { Telemetry } from "@/types/robot";

type SensorsPanelProps = {
  telemetry: Telemetry;
};

const NO_DATA = "No data";
const LOAD_HISTORY_POINTS = 32;
const LOAD_CHART_WIDTH = 420;
const LOAD_CHART_HEIGHT = 120;

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTelemetryMotionLoad(telemetry: Telemetry) {
  const gyro = telemetry.imu?.gyro;
  const accel = telemetry.imu?.accel;
  const gyroMagnitude = gyro ? Math.hypot(gyro.x, gyro.y, gyro.z) : 0;
  const accelMagnitude = accel ? Math.hypot(accel.x, accel.y, accel.z) : 9.81;
  const accelDelta = Math.abs(accelMagnitude - 9.81);
  return clamp(gyroMagnitude * 3.3 + accelDelta * 20, 0, 24);
}

function buildSimulatedLoad(nowMs: number, telemetry: Telemetry) {
  const t = nowMs / 1000;
  const wave =
    Math.sin(t * 0.58) * 10 +
    Math.sin(t * 1.35 + 0.9) * 7 +
    Math.cos(t * 0.2 + 1.4) * 8;
  const jitter = Math.sin(t * 3.2) * 1.8;
  const motion = getTelemetryMotionLoad(telemetry);
  const fpsPressure =
    typeof telemetry.fps === "number" && Number.isFinite(telemetry.fps)
      ? clamp((33 - telemetry.fps) * 2.1, -6, 14)
      : 0;
  return clamp(48 + wave + jitter + motion + fpsPressure, 9, 97);
}

function buildLinePath(
  points: number[],
  width: number,
  height: number,
  inset = 8,
) {
  if (!points.length) return "";
  const innerWidth = width - inset * 2;
  const innerHeight = height - inset * 2;
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const x = inset + index * stepX;
      const y = inset + ((100 - point) / 100) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(
  points: number[],
  width: number,
  height: number,
  inset = 8,
) {
  if (!points.length) return "";
  const linePath = buildLinePath(points, width, height, inset);
  const innerWidth = width - inset * 2;
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;
  const lastX = inset + stepX * (points.length - 1);
  const baseY = height - inset;
  return `${linePath} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${inset.toFixed(2)} ${baseY.toFixed(2)} Z`;
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
    }, 800);

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
  const loadHistory = useMemo(() => {
    return Array.from({ length: LOAD_HISTORY_POINTS }, (_, index) => {
      const offset = (LOAD_HISTORY_POINTS - 1 - index) * 850;
      return buildSimulatedLoad(nowMs - offset, displayTelemetry);
    });
  }, [displayTelemetry, nowMs]);
  const currentLoad = Math.round(loadHistory[loadHistory.length - 1] ?? 0);
  const avgLoad =
    loadHistory.length > 0
      ? Math.round(
          loadHistory.reduce((total, point) => total + point, 0) /
            loadHistory.length,
        )
      : 0;
  const peakLoad =
    loadHistory.length > 0 ? Math.round(Math.max(...loadHistory)) : 0;
  const loadLinePath = buildLinePath(
    loadHistory,
    LOAD_CHART_WIDTH,
    LOAD_CHART_HEIGHT,
  );
  const loadAreaPath = buildAreaPath(
    loadHistory,
    LOAD_CHART_WIDTH,
    LOAD_CHART_HEIGHT,
  );

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
        </div>
      </div>

      <div className="relative mt-3 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-zinc-950/50 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-200/80">
            System load simulation
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
            <span className="font-mono text-[11px] text-cyan-100">
              {currentLoad}%
            </span>
          </div>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/50">
          <svg
            viewBox={`0 0 ${LOAD_CHART_WIDTH} ${LOAD_CHART_HEIGHT}`}
            className="h-28 w-full"
            role="img"
            aria-label="Simulated system load trend"
          >
            <defs>
              <linearGradient id="loadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34, 211, 238, 0.55)" />
                <stop offset="70%" stopColor="rgba(34, 211, 238, 0.14)" />
                <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
              </linearGradient>
              <linearGradient id="loadLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.8)" />
                <stop offset="50%" stopColor="rgba(103, 232, 249, 1)" />
                <stop offset="100%" stopColor="rgba(34, 197, 94, 0.9)" />
              </linearGradient>
            </defs>

            {[20, 40, 60, 80].map((level) => {
              const y = 8 + ((100 - level) / 100) * (LOAD_CHART_HEIGHT - 16);
              return (
                <line
                  key={level}
                  x1="8"
                  x2={LOAD_CHART_WIDTH - 8}
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.14)"
                  strokeDasharray="3 5"
                />
              );
            })}

            <path d={loadAreaPath} fill="url(#loadAreaGradient)" />
            <path
              d={loadLinePath}
              fill="none"
              stroke="url(#loadLineGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Current
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-100">
              {currentLoad}%
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Average
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-100">
              {avgLoad}%
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Peak
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-100">
              {peakLoad}%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
