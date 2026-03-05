import "server-only";

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { StreamPersonDetectionRecord } from "@/types/robot";

const DEFAULT_DB_PATH = path.join(process.cwd(), "..", "agent", "detections.db");
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH ?? DEFAULT_DB_PATH;
const DEFAULT_LIMIT = 50;

const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS person_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stream_url TEXT NOT NULL,
  track_id INTEGER,
  confidence REAL NOT NULL,
  x1 INTEGER NOT NULL,
  y1 INTEGER NOT NULL,
  x2 INTEGER NOT NULL,
  y2 INTEGER NOT NULL,
  crop_jpeg BLOB NOT NULL
);
`;

type StreamPersonDetectionRow = {
  id: number;
  detected_at: string;
  stream_url: string;
  track_id: number | null;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  crop_jpeg: Uint8Array;
};

function ensureDatabaseDirectory() {
  const dbDir = path.dirname(SQLITE_DB_PATH);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

function mapRow(row: StreamPersonDetectionRow): StreamPersonDetectionRecord {
  const base64 = Buffer.from(row.crop_jpeg).toString("base64");

  return {
    id: row.id,
    detectedAt: row.detected_at,
    streamUrl: row.stream_url,
    trackId: row.track_id,
    confidence: row.confidence,
    bboxX1: row.x1,
    bboxY1: row.y1,
    bboxX2: row.x2,
    bboxY2: row.y2,
    cropDataUrl: `data:image/jpeg;base64,${base64}`,
  };
}

export function getStreamPersonDetections(limit = DEFAULT_LIMIT): StreamPersonDetectionRecord[] {
  ensureDatabaseDirectory();
  const db = new DatabaseSync(SQLITE_DB_PATH);

  try {
    db.exec(CREATE_SCHEMA_SQL);
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : DEFAULT_LIMIT;

    const rows = db
      .prepare(
        `SELECT id, detected_at, stream_url, track_id, confidence, x1, y1, x2, y2, crop_jpeg
         FROM person_detections
         ORDER BY detected_at DESC, id DESC
         LIMIT ?`
      )
      .all(normalizedLimit) as StreamPersonDetectionRow[];

    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export const detectionSqlitePath = SQLITE_DB_PATH;
