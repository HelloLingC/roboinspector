import Link from "next/link";
import { RobotModelCanvas } from "@/components/RobotModelCanvas";

export default function ModelViewerPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_82%_88%,rgba(14,165,233,0.2),transparent_40%),linear-gradient(180deg,rgba(6,14,24,0.45)_0%,rgba(4,10,18,0.3)_60%,rgba(3,8,15,0.5)_100%)]" />
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md border border-cyan-500/40 bg-slate-900/75 px-3 py-2 text-sm font-medium text-cyan-100 backdrop-blur-sm transition hover:border-cyan-300/70 hover:bg-slate-800/80"
        >
          返回仪表盘
        </Link>
        <h1 className="rounded-md border border-cyan-500/25 bg-slate-950/60 px-3 py-2 text-sm font-semibold tracking-wide text-cyan-100 backdrop-blur-sm sm:text-base">
          3D 模型全屏预览
        </h1>
      </header>
      <RobotModelCanvas fullscreen />
    </main>
  );
}
