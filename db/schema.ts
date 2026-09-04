import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const catEvents = sqliteTable("cat_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  occurredAt: text("occurred_at").notNull(),
  note: text("note").notNull().default(""),
  nextDueAt: text("next_due_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("cat_events_occurred_at_idx").on(table.occurredAt)]);
