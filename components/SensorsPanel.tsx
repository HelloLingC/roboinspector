"use client";

import { Telemetry } from "../types/robot";

type SensorsPanelProps = {
  telemetry: Telemetry;
};

export function SensorsPanel({ telemetry }: SensorsPanelProps) {
  return (
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
              : "бк"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Gyro</span>
          <span className="text-zinc-400">
            {telemetry.imu?.gyro
              ? `${telemetry.imu.gyro.x?.toFixed(2)}, ${telemetry.imu.gyro.y?.toFixed(2)}, ${telemetry.imu.gyro.z?.toFixed(2)}`
              : "бк"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Orientation</span>
          <span className="text-zinc-400">
            {telemetry.imu?.orientation
              ? `${telemetry.imu.orientation.roll?.toFixed(1)} / ${telemetry.imu.orientation.pitch?.toFixed(1)} / ${telemetry.imu.orientation.yaw?.toFixed(1)}`
              : "бк"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>FPS</span>
          <span className="text-zinc-400">{telemetry.fps ?? "бк"}</span>
        </div>
      </div>
    </section>
  );
}
