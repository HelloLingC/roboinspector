"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RobotWebSocketClient } from "@/lib/robotWebSocketClient";
import { ActivityLogEntry, Telemetry } from "@/types/robot";

const WS_URL = process.env.NEXT_PUBLIC_PI_WS ?? "ws://192.168.1.223:5000";
const DEFAULT_MOVE_SPEED = 50;
const DEFAULT_TURN_ANGLE = 30;
const REVERSE_MOVE_SPEED = -40;
const DIRECTION_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
] as const;

type DirectionKey = (typeof DIRECTION_KEYS)[number];

type ControlPanelProps = {
  isUnlocked: boolean;
  onTelemetryChange: (telemetry: Telemetry) => void;
  onLog: (entry: Omit<ActivityLogEntry, "id">) => void;
};

type MovementState =
  | "idle"
  | "forward"
  | "reverse"
  | "left"
  | "right"
  | "stopped"
  | "error";

const movementStateStyles: Record<
  MovementState,
  { label: string; detail: string; badge: string; dot: string }
> = {
  idle: {
    label: "空闲",
    detail: "等待移动指令。",
    badge: "border-zinc-700/70 bg-zinc-800/50 text-zinc-300",
    dot: "bg-zinc-500",
  },
  forward: {
    label: "前进中",
    detail: "已施加前进方向油门。",
    badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  reverse: {
    label: "后退中",
    detail: "已施加后退方向油门。",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-400",
  },
  left: {
    label: "左转中",
    detail: "转向偏置已切换到左侧。",
    badge: "border-sky-500/40 bg-sky-500/10 text-sky-200",
    dot: "bg-sky-400",
  },
  right: {
    label: "右转中",
    detail: "转向偏置已切换到右侧。",
    badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
    dot: "bg-cyan-400",
  },
  stopped: {
    label: "已停止",
    detail: "电机已收到停止指令。",
    badge: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-400",
  },
  error: {
    label: "指令失败",
    detail: "上一条移动指令发送失败。",
    badge: "border-red-500/40 bg-red-500/10 text-red-200",
    dot: "bg-red-400",
  },
};

function isDirectionKey(key: string): key is DirectionKey {
  return DIRECTION_KEYS.includes(key as DirectionKey);
}

function isSpaceKey(event: KeyboardEvent) {
  return event.code === "Space" || event.key === " " || event.key === "Spacebar";
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function ControlPanel({
  isUnlocked,
  onTelemetryChange,
  onLog,
}: ControlPanelProps) {
  const [lastMessage, setLastMessage] = useState<string>("");
  const [controlFeedback, setControlFeedback] = useState<string>("");
  const [movementState, setMovementState] = useState<MovementState>("idle");
  const [lastMovementCommandAt, setLastMovementCommandAt] = useState<number | null>(
    null,
  );
  const clientRef = useRef<RobotWebSocketClient | null>(null);
  const pressedDirectionsRef = useRef<DirectionKey[]>([]);
  const activeDirectionRef = useRef<DirectionKey | null>(null);
  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    if (!isUnlocked) return;
    const client = new RobotWebSocketClient({
      wsUrl: WS_URL,
      handlers: {
        onMessage: (message) => {
          setLastMessage(message);
          try {
            const parsed = JSON.parse(message) as {
              type?: string;
              message?: string;
              status?: string;
            };
            if (parsed.type === "connected") {
              setControlFeedback(parsed.message ?? "WebSocket 连接成功");
              return;
            }
            if (parsed.type === "move_ack" && parsed.status === "success") {
              setControlFeedback("移动指令已确认");
              return;
            }
            if (parsed.type === "start_ack" && parsed.status === "success") {
              setControlFeedback("启动指令已确认");
              return;
            }
            if (parsed.type === "stop_ack" && parsed.status === "success") {
              setControlFeedback("停止指令已确认");
              setMovementState("stopped");
              setLastMovementCommandAt(Date.now());
              return;
            }
            if (parsed.type === "error") {
              const errorMessage = parsed.message ?? "未知控制错误";
              setControlFeedback(`控制错误：${errorMessage}`);
              setMovementState("error");
              setLastMovementCommandAt(Date.now());
            }
          } catch {
            // Ignore non-JSON server messages.
          }
        },
        onTelemetry: (nextTelemetry) => onTelemetryChange(nextTelemetry),
        onLog,
      },
    });

    client.connect();
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [onLog, isUnlocked, onTelemetryChange]);

  const sendCommand = useCallback(
    async (
      payload: Record<string, unknown>,
      nextMovementState?: MovementState,
    ) => {
      if (!isUnlocked) {
        setControlFeedback("请先完成身份验证后再控制机器人。");
        if (nextMovementState) {
          setMovementState("error");
          setLastMovementCommandAt(Date.now());
        }
        return;
      }
      if (!clientRef.current) {
        setControlFeedback("发送失败：WebSocket 客户端不可用");
        if (nextMovementState) {
          setMovementState("error");
          setLastMovementCommandAt(Date.now());
        }
        return;
      }
      try {
        const transport = await clientRef.current.send(payload);
        setControlFeedback(
          transport === "ws" ? "已通过 WebSocket 发送" : "已通过 HTTP 回退通道发送",
        );
        if (nextMovementState) {
          setMovementState(nextMovementState);
          setLastMovementCommandAt(Date.now());
        }
      } catch (err) {
        setControlFeedback(`发送失败：${(err as Error).message}`);
        if (nextMovementState) {
          setMovementState("error");
          setLastMovementCommandAt(Date.now());
        }
      }
    },
    [isUnlocked],
  );

  const handleDrive = useCallback(
    (throttle: number, steer: number) => {
      let nextState: MovementState = "forward";
      let moveSpeed = DEFAULT_MOVE_SPEED;
      let turnAngle = 0;

      if (throttle < 0) {
        nextState = "reverse";
        moveSpeed = REVERSE_MOVE_SPEED;
      } else if (steer < 0) {
        nextState = "left";
        turnAngle = -DEFAULT_TURN_ANGLE;
      } else if (steer > 0) {
        nextState = "right";
        turnAngle = DEFAULT_TURN_ANGLE;
      }

      void (async () => {
        await sendCommand({ type: "start" });
        await sendCommand(
          {
            type: "move",
            turn_angle: turnAngle,
            left_speed: moveSpeed,
            right_speed: moveSpeed,
          },
          nextState,
        );
      })();
    },
    [sendCommand],
  );

  const handleStop = useCallback(() => {
    sendCommand({ type: "stop" }, "stopped");
  }, [sendCommand]);

  const handleStart = useCallback(() => {
    sendCommand({ type: "start" }, "idle");
  }, [sendCommand]);

  const applyDirectionFromKeyboard = useCallback(
    (nextDirection: DirectionKey | null) => {
      if (nextDirection === activeDirectionRef.current) {
        return;
      }
      activeDirectionRef.current = nextDirection;
      if (!nextDirection) {
        handleStop();
        return;
      }

      if (nextDirection === "ArrowUp") {
        handleDrive(1, 0);
        return;
      }
      if (nextDirection === "ArrowDown") {
        handleDrive(-1, 0);
        return;
      }
      if (nextDirection === "ArrowLeft") {
        handleDrive(0.5, -1);
        return;
      }
      handleDrive(0.5, 1);
    },
    [handleDrive, handleStop],
  );

  useEffect(() => {
    if (!isUnlocked) return;

    const clearKeyboardState = () => {
      pressedDirectionsRef.current = [];
      activeDirectionRef.current = null;
      isSpacePressedRef.current = false;
    };

    const forceStopAndClear = () => {
      const wasDriving =
        activeDirectionRef.current !== null || pressedDirectionsRef.current.length > 0;
      clearKeyboardState();
      if (wasDriving) {
        handleStop();
      }
    };

    const resolveDirection = () => {
      const nextDirection =
        pressedDirectionsRef.current[pressedDirectionsRef.current.length - 1] ?? null;
      applyDirectionFromKeyboard(nextDirection);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const directionKey = isDirectionKey(event.key) ? event.key : null;
      const spaceKey = isSpaceKey(event);
      if (!directionKey && !spaceKey) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      if (event.repeat) return;

      if (spaceKey) {
        if (isSpacePressedRef.current) return;
        isSpacePressedRef.current = true;
        pressedDirectionsRef.current = [];
        activeDirectionRef.current = null;
        handleStop();
        return;
      }
      if (!directionKey) return;

      isSpacePressedRef.current = false;
      pressedDirectionsRef.current = [
        ...pressedDirectionsRef.current.filter((key) => key !== directionKey),
        directionKey,
      ];
      resolveDirection();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const directionKey = isDirectionKey(event.key) ? event.key : null;
      const spaceKey = isSpaceKey(event);
      if (!directionKey && !spaceKey) return;

      if (spaceKey) {
        isSpacePressedRef.current = false;
        return;
      }
      if (!directionKey) return;

      pressedDirectionsRef.current = pressedDirectionsRef.current.filter(
        (key) => key !== directionKey,
      );
      resolveDirection();
    };

    const onWindowBlur = () => {
      forceStopAndClear();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        forceStopAndClear();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      forceStopAndClear();
    };
  }, [applyDirectionFromKeyboard, handleStop, isUnlocked]);

  const movementStyle = movementStateStyles[movementState];

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">控制</p>
          <h2 className="text-lg font-semibold">运动控制</h2>
          <code className="mt-1 inline-block rounded bg-black/40 px-2 py-1 text-xs text-zinc-400">
            {WS_URL}
          </code>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-zinc-800/70 bg-zinc-950/55 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          运动状态
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${movementStyle.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${movementStyle.dot}`} />
            <span>{movementStyle.label}</span>
          </div>
          <span className="text-xs text-zinc-500">
            {lastMovementCommandAt
              ? new Date(lastMovementCommandAt).toLocaleTimeString()
              : "暂无指令"}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">{movementStyle.detail}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => handleDrive(1, 0)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          前进
        </button>
        <button
          onClick={() => handleDrive(-1, 0)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          后退
        </button>
        <button
          onClick={handleStop}
          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-black hover:bg-red-400"
        >
          停止
        </button>
        <button
          onClick={() => handleDrive(0.5, -1)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          左转
        </button>
        <button
          onClick={() => handleDrive(0.5, 1)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          右转
        </button>
        <button
          onClick={handleStart}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
        >
          启动
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        键盘：↑↓←→ 控制方向，Space 紧急停止。
      </p>
      {controlFeedback && (
        <p className="mt-3 text-xs text-zinc-400">状态：{controlFeedback}</p>
      )}
      {lastMessage && (
        <p className="mt-1 text-xs text-zinc-500">最近消息：{lastMessage}</p>
      )}
    </section>
  );
}
