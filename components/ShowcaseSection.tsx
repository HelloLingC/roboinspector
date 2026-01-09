"use client";

import { RobotShowcase } from "./RobotShowcase";

export function ShowcaseSection() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
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
    </section>
  );
}
