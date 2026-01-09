"use client";

export function IntegrationNotes() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
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
            <li>`NEXT_PUBLIC_MJPEG_URL` бк MJPEG stream URL from Pi.</li>
            <li>`NEXT_PUBLIC_PI_WS` бк WebSocket endpoint for control/telemetry.</li>
            <li>`NEXT_PUBLIC_DETECT_URL` бк Local detector endpoint (optional).</li>
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
  );
}
