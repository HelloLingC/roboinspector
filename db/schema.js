/** Drizzle schema */
import { relations } from "drizzle-orm";
import {
  bigserial,
  bigint as pgBigInt,
  bytea,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const robotStatusEnum = pgEnum("robot_status", ["online", "offline", "error"]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const robot = pgTable(
  "robot",
  {
    id: serial("id").primaryKey(),
    robotCode: varchar("robot_code", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }),
    status: robotStatusEnum("status").notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: false, mode: "date" }),
    ipAddress: varchar("ip_address", { length: 50 }),
  },
  (table) => [uniqueIndex("robot_robot_code_unique").on(table.robotCode)]
);

export const robotPositionLog = pgTable("robot_position_log", {
  id: bigserial("id").primaryKey(),
  robotId: integer("robot_id")
    .notNull()
    .references(() => robot.id),
  time: timestamp("time", { withTimezone: false, mode: "date" }).notNull(),
  posX: doublePrecision("pos_x").notNull(),
  posY: doublePrecision("pos_y").notNull(),
  angle: doublePrecision("angle").notNull(),
});

export const detectedPerson = pgTable("detected_person", {
  id: bigserial("id").primaryKey(),
  trackId: varchar("track_id", { length: 64 }).notNull(),
  firstSeen: timestamp("first_seen", { withTimezone: false, mode: "date" }),
  lastSeen: timestamp("last_seen", { withTimezone: false, mode: "date" }),
  totalSeen: integer("total_seen").default(1).notNull(),
});

export const personDetectionLog = pgTable("person_detection_log", {
  id: bigserial("id").primaryKey(),
  personId: pgBigInt("person_id", { mode: "number" })
    .notNull()
    .references(() => detectedPerson.id),
  robotId: integer("robot_id")
    .notNull()
    .references(() => robot.id),
  detectTime: timestamp("detect_time", { withTimezone: false, mode: "date" }).notNull(),
  confidence: doublePrecision("confidence").notNull(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  width: doublePrecision("width").notNull(),
  height: doublePrecision("height").notNull(),
});

export const detectionMedia = pgTable("detection_media", {
  id: bigserial("id").primaryKey(),
  detectionId: pgBigInt("detection_id", { mode: "number" })
    .notNull()
    .references(() => personDetectionLog.id),
  mediaType: mediaTypeEnum("media_type").notNull(),
  imageData: bytea("image_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false, mode: "date" }).defaultNow().notNull(),
});

export const robotRelations = relations(robot, ({ many }) => ({
  positionLogs: many(robotPositionLog),
  detections: many(personDetectionLog),
}));

export const robotPositionLogRelations = relations(robotPositionLog, ({ one }) => ({
  robot: one(robot, {
    fields: [robotPositionLog.robotId],
    references: [robot.id],
  }),
}));

export const detectedPersonRelations = relations(detectedPerson, ({ many }) => ({
  detections: many(personDetectionLog),
}));

export const personDetectionLogRelations = relations(personDetectionLog, ({ one, many }) => ({
  person: one(detectedPerson, {
    fields: [personDetectionLog.personId],
    references: [detectedPerson.id],
  }),
  robot: one(robot, {
    fields: [personDetectionLog.robotId],
    references: [robot.id],
  }),
  media: many(detectionMedia),
}));

export const detectionMediaRelations = relations(detectionMedia, ({ one }) => ({
  detection: one(personDetectionLog, {
    fields: [detectionMedia.detectionId],
    references: [personDetectionLog.id],
  }),
}));

