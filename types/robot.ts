export type Telemetry = {
  imu?: {
    accel?: { x: number; y: number; z: number };
    gyro?: { x: number; y: number; z: number };
    orientation?: { roll: number; pitch: number; yaw: number };
  };
  ts?: number;
  fps?: number;
};

export type DetectionBox = {
  id?: string | number;
  label?: string;
  confidence?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type DetectionStatus = "idle" | "running" | "error";
export type WsStatus = "disconnected" | "connecting" | "connected";
