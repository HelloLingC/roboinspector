"use client";

export function IntegrationNotes() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">集成说明</p>
          <h2 className="text-lg font-semibold">连接你的接口端点</h2>
        </div>
      </div>
      <div className="mt-3 grid gap-3 text-sm text-zinc-200 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="font-medium text-zinc-100">环境变量</p>
          <ul className="mt-2 space-y-1 text-zinc-400">
            <li>`NEXT_PUBLIC_MJPEG_URL` 用于树莓派 MJPEG 视频流地址。</li>
            <li>`NEXT_PUBLIC_PI_WS` 用于控制与遥测的 WebSocket 端点。</li>
            <li>`NEXT_PUBLIC_DETECT_URL` 用于本地检测服务端点（可选）。</li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="font-medium text-zinc-100">期望消息格式</p>
          <ul className="mt-2 space-y-1 text-zinc-400">
            <li>驱动：{"{ type: \"drive\", throttle: -1..1, steer: -1..1 }"}</li>
            <li>停止：{"{ type: \"stop\" }"}</li>
            <li>遥测消息应包含 `telemetry`，并带有 IMU/FPS 字段。</li>
            <li>检测服务返回 {"{ boxes: [{x1,y1,x2,y2,label?,confidence?}] }"}，坐标已归一化到 0-1。</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
