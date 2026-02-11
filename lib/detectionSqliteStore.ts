import "server-only";

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { DetectionPersonRecord, DetectionRecord } from "@/types/robot";

const DEFAULT_DB_PATH = path.join(process.cwd(), "db", "detections.sqlite");
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH ?? DEFAULT_DB_PATH;
const DEFAULT_LIMIT = 100;

const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_count INTEGER NOT NULL,
  frame_width INTEGER,
  frame_height INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detection_persons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  detection_id INTEGER NOT NULL REFERENCES detections(id) ON DELETE CASCADE,
  track_id INTEGER,
  confidence REAL NOT NULL,
  bbox_x1 REAL NOT NULL,
  bbox_y1 REAL NOT NULL,
  bbox_x2 REAL NOT NULL,
  bbox_y2 REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

type DetectionRow = {
  id: number;
  timestamp: string;
  total_count: number;
  frame_width: number | null;
  frame_height: number | null;
  created_at: string;
};

type DetectionPersonRow = {
  id: number;
  detection_id: number;
  track_id: number | null;
  confidence: number;
  bbox_x1: number;
  bbox_y1: number;
  bbox_x2: number;
  bbox_y2: number;
  created_at: string;
};

function ensureDatabaseDirectory() {
  const dbDir = path.dirname(SQLITE_DB_PATH);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

function mapDetectionRow(row: DetectionRow): DetectionRecord {
  return {
    id: row.id,
    timestamp: row.timestamp,
    totalCount: row.total_count,
    frameWidth: row.frame_width,
    frameHeight: row.frame_height,
    createdAt: row.created_at,
    persons: [],
  };
}

function mapPersonRow(row: DetectionPersonRow): DetectionPersonRecord {
  return {
    id: row.id,
    detectionId: row.detection_id,
    trackId: row.track_id,
    confidence: row.confidence,
    bboxX1: row.bbox_x1,
    bboxY1: row.bbox_y1,
    bboxX2: row.bbox_x2,
    bboxY2: row.bbox_y2,
    createdAt: row.created_at,
  };
}

export function getDetectionsWithPersons(limit = DEFAULT_LIMIT): DetectionRecord[] {
  ensureDatabaseDirectory();
  const db = new DatabaseSync(SQLITE_DB_PATH);

  try {
    db.exec(CREATE_SCHEMA_SQL);
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : DEFAULT_LIMIT;

    const detectionRows = db
      .prepare(
        `SELECT id, timestamp, total_count, frame_width, frame_height, created_at
         FROM detections
         ORDER BY timestamp DESC, id DESC
         LIMIT ?`
      )
      .all(normalizedLimit) as DetectionRow[];

    if (detectionRows.length === 0) {
      return [];
    }

    const detections = detectionRows.map(mapDetectionRow);
    const detectionIds = detections.map((item) => item.id);
    const detectionsById = new Map(detections.map((item) => [item.id, item]));
    const placeholders = detectionIds.map(() => "?").join(", ");

    const personRows = db
      .prepare(
        `SELECT id, detection_id, track_id, confidence, bbox_x1, bbox_y1, bbox_x2, bbox_y2, created_at
         FROM detection_persons
         WHERE detection_id IN (${placeholders})
         ORDER BY detection_id DESC, id DESC`
      )
      .all(...detectionIds) as DetectionPersonRow[];

    for (const row of personRows) {
      const detection = detectionsById.get(row.detection_id);
      if (!detection) {
        continue;
      }
      detection.persons.push(mapPersonRow(row));
    }

    return detections;
  } finally {
    db.close();
  }
}

export const detectionSqlitePath = SQLITE_DB_PATH;
