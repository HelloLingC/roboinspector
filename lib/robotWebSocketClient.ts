import { ActivityLogEntry, Telemetry, WsStatus } from "@/types/robot";

export type RobotClientLogEntry = Omit<ActivityLogEntry, "id">;

export type RobotWebSocketHandlers = {
  onStatusChange?: (status: WsStatus, alert?: string) => void;
  onMessage?: (message: string) => void;
  onTelemetry?: (telemetry: Telemetry) => void;
  onLog?: (entry: RobotClientLogEntry) => void;
};

export type RobotSendTransport = "ws" | "http";

type RobotWebSocketClientOptions = {
  wsUrl?: string;
  httpUrl?: string;
  handlers?: RobotWebSocketHandlers;
};

export class RobotWebSocketClient {
  private wsUrl?: string;
  private httpUrl?: string;
  private socket: WebSocket | null = null;
  private handlers: RobotWebSocketHandlers;

  constructor({ wsUrl, httpUrl, handlers = {} }: RobotWebSocketClientOptions) {
    this.wsUrl = wsUrl;
    this.httpUrl = httpUrl ?? this.deriveHttpUrl(wsUrl);
    this.handlers = handlers;
  }

  connect() {
    if (this.socket) {
      this.disconnect();
    }

    if (!this.wsUrl) {
      this.emitStatus(
        "disconnected",
        "WebSocket URL is missing. Commands will attempt HTTP fallback if available.",
      );
      this.emitLog({
        ts: Date.now(),
        scope: "system",
        level: "error",
        title: "Missing WebSocket URL",
        detail: "Set NEXT_PUBLIC_PI_WS to enable live telemetry.",
      });
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    this.emitStatus("connecting");
    const socket = new window.WebSocket(this.wsUrl);
    this.socket = socket;

    socket.onopen = () => {
      this.emitStatus("connected");
      this.emitLog({
        ts: Date.now(),
        scope: "session",
        level: "success",
        title: "WebSocket connected",
        detail: this.wsUrl,
      });
    };

    socket.onclose = () => {
      this.emitStatus(
        "disconnected",
        "WebSocket disconnected. Commands will use HTTP fallback",
      );
      this.emitLog({
        ts: Date.now(),
        scope: "session",
        level: "info",
        title: "WebSocket disconnected",
        detail: "Falling back to HTTP until WS resumes.",
      });
    };

    socket.onerror = () => {
      this.emitStatus(
        "disconnected",
        "WebSocket connection failed. Using HTTP fallback; verify NEXT_PUBLIC_PI_WS.",
      );
      this.emitLog({
        ts: Date.now(),
        scope: "session",
        level: "error",
        title: "WebSocket error",
        detail: "Connection failed; using HTTP fallback.",
      });
    };

    socket.onmessage = (event) => {
      this.handlers.onMessage?.(event.data);
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.telemetry) {
          this.handlers.onTelemetry?.({
            ...parsed.telemetry,
            ts: Date.now(),
          });
        }
      } catch {
        // Non-JSON payloads only update the raw log entry.
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async send(payload: Record<string, unknown>): Promise<RobotSendTransport> {
    const json = JSON.stringify(payload);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(json);
      return "ws";
    }

    const fallbackUrl = this.httpUrl;
    if (!fallbackUrl) {
      throw new Error("HTTP fallback unavailable; check NEXT_PUBLIC_PI_WS.");
    }

    const response = await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });

    if (!response.ok) {
      throw new Error(`HTTP fallback failed with status ${response.status}`);
    }

    return "http";
  }

  private deriveHttpUrl(url?: string) {
    if (!url) return undefined;
    if (url.startsWith("wss://")) return url.replace("wss://", "https://");
    if (url.startsWith("ws://")) return url.replace("ws://", "http://");
    if (url.startsWith("ws")) return url.replace(/^ws/i, "http");
    return undefined;
  }

  private emitStatus(status: WsStatus, alert?: string) {
    this.handlers.onStatusChange?.(status, alert);
  }

  private emitLog(entry: RobotClientLogEntry) {
    this.handlers.onLog?.(entry);
  }
}
