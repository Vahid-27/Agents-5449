import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const blogSessions = sqliteTable("blog_sessions", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  product: text("product").notNull(),
  productUrl: text("product_url"),
  productContext: text("product_context"), // JSON string
  blogType: text("blog_type"),
  targetAudience: text("target_audience"),
  funnelStage: text("funnel_stage"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  currentAgent: integer("current_agent").default(0),
  status: text("status").default("in_progress"),
});

export const agentOutputs = sqliteTable("agent_outputs", {
  id: text("id").primaryKey(),          // {sessionId}_{agentNum}_{version}
  sessionId: text("session_id").notNull().references(() => blogSessions.id, { onDelete: "cascade" }),
  agentNum: integer("agent_num").notNull(),
  version: integer("version").default(1),
  isActive: integer("is_active").default(1), // 1 = current version shown in UI
  output: text("output"),
  parsedData: text("parsed_data"),
  status: text("status").default("idle"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
