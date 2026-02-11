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

export type WsStatus = "disconnected" | "connecting" | "connected";

export type ActivityScope = "detection" | "session" | "system";

export type ActivityLogEntry = {
  id: string;
  ts: number; /** time */
  scope: ActivityScope;
  level: "info" | "success" | "error";
  title: string;
  detail?: string;
};

export type DetectionPersonRecord = {
  id: number;
  detectionId: number;
  trackId: number | null;
  confidence: number;
  bboxX1: number;
  bboxY1: number;
  bboxX2: number;
  bboxY2: number;
  createdAt: string;
};

export type DetectionRecord = {
  id: number;
  timestamp: string;
  totalCount: number;
  frameWidth: number | null;
  frameHeight: number | null;
  createdAt: string;
  persons: DetectionPersonRecord[];
};
