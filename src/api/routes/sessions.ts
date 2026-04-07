import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { blogSessions, agentOutputs } from "../database/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const sessionRoutes = new Hono<{ Bindings: Env }>();
const db = (env: Env) => drizzle(env.DB);

// ─── Create session ───────────────────────────────────────────────────────────
sessionRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const id = nanoid();
  const now = new Date();
  await db(c.env).insert(blogSessions).values({
    id,
    topic: body.topic,
    product: body.product || "talsy.ai",
    productUrl: body.productUrl || null,
    productContext: body.productContext ? JSON.stringify(body.productContext) : null,
    blogType: body.blogType || null,
    targetAudience: body.targetAudience || null,
    funnelStage: body.funnelStage || null,
    createdAt: now,
    updatedAt: now,
    currentAgent: body.currentAgent || 0,
    status: "in_progress",
  });
  return c.json({ id });
});

// ─── List sessions ────────────────────────────────────────────────────────────
sessionRoutes.get("/", async (c) => {
  const sessions = await db(c.env)
    .select()
    .from(blogSessions)
    .orderBy(desc(blogSessions.updatedAt))
    .limit(100);
  return c.json(sessions);
});

// ─── Get session + active agent outputs ──────────────────────────────────────
sessionRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [session] = await db(c.env).select().from(blogSessions).where(eq(blogSessions.id, id));
  if (!session) return c.json({ error: "Not found" }, 404);

  // Only return active versions
  const outputs = await db(c.env)
    .select()
    .from(agentOutputs)
    .where(and(eq(agentOutputs.sessionId, id), eq(agentOutputs.isActive, 1)));
  return c.json({ session, outputs });
});

// ─── Get all versions for a specific agent ────────────────────────────────────
sessionRoutes.get("/:id/agents/:agentNum/versions", async (c) => {
  const sessionId = c.req.param("id");
  const agentNum = parseInt(c.req.param("agentNum"));
  const versions = await db(c.env)
    .select()
    .from(agentOutputs)
    .where(and(eq(agentOutputs.sessionId, sessionId), eq(agentOutputs.agentNum, agentNum)))
    .orderBy(desc(agentOutputs.version));
  return c.json(versions);
});

// ─── Activate a specific version (both URL patterns for compatibility) ────────
sessionRoutes.post("/:id/agents/:agentNum/versions/:version/activate", async (c) => {
  const sessionId = c.req.param("id");
  const agentNum = parseInt(c.req.param("agentNum"));
  const version = parseInt(c.req.param("version"));

  const allVersions = await db(c.env)
    .select()
    .from(agentOutputs)
    .where(and(eq(agentOutputs.sessionId, sessionId), eq(agentOutputs.agentNum, agentNum)));

  for (const v of allVersions) {
    await db(c.env)
      .update(agentOutputs)
      .set({ isActive: v.version === version ? 1 : 0 })
      .where(eq(agentOutputs.id, v.id));
  }
  return c.json({ ok: true });
});

sessionRoutes.post("/:id/agents/:agentNum/activate/:version", async (c) => {
  const sessionId = c.req.param("id");
  const agentNum = parseInt(c.req.param("agentNum"));
  const version = parseInt(c.req.param("version"));

  // Deactivate all versions for this agent
  const allVersions = await db(c.env)
    .select()
    .from(agentOutputs)
    .where(and(eq(agentOutputs.sessionId, sessionId), eq(agentOutputs.agentNum, agentNum)));

  for (const v of allVersions) {
    await db(c.env)
      .update(agentOutputs)
      .set({ isActive: v.version === version ? 1 : 0 })
      .where(eq(agentOutputs.id, v.id));
  }
  return c.json({ ok: true });
});

// ─── Update session ───────────────────────────────────────────────────────────
sessionRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const allowed: any = { updatedAt: new Date() };
  if (body.currentAgent !== undefined) allowed.currentAgent = body.currentAgent;
  if (body.status)                     allowed.status = body.status;
  if (body.blogType)                   allowed.blogType = body.blogType;
  if (body.targetAudience)             allowed.targetAudience = body.targetAudience;
  if (body.funnelStage)                allowed.funnelStage = body.funnelStage;
  if (body.productContext)             allowed.productContext = JSON.stringify(body.productContext);
  await db(c.env).update(blogSessions).set(allowed).where(eq(blogSessions.id, id));
  return c.json({ ok: true });
});

// ─── Delete session ───────────────────────────────────────────────────────────
sessionRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db(c.env).delete(agentOutputs).where(eq(agentOutputs.sessionId, id));
  await db(c.env).delete(blogSessions).where(eq(blogSessions.id, id));
  return c.json({ ok: true });
});

// ─── Save agent output (versioned) ───────────────────────────────────────────
sessionRoutes.post("/:id/agents/:agentNum", async (c) => {
  const sessionId = c.req.param("id");
  const agentNum = parseInt(c.req.param("agentNum"));
  const body = await c.req.json();
  const now = new Date();

  // Get current max version for this agent
  const existing = await db(c.env)
    .select()
    .from(agentOutputs)
    .where(and(eq(agentOutputs.sessionId, sessionId), eq(agentOutputs.agentNum, agentNum)))
    .orderBy(desc(agentOutputs.version));

  const nextVersion = existing.length > 0 ? (existing[0].version ?? 1) + 1 : 1;

  // Deactivate all previous versions
  for (const row of existing) {
    await db(c.env)
      .update(agentOutputs)
      .set({ isActive: 0 })
      .where(eq(agentOutputs.id, row.id));
  }

  // Prune: keep only last 4 old versions (delete oldest if > 4 exist)
  if (existing.length >= 5) {
    const toDelete = existing.slice(4);
    for (const row of toDelete) {
      await db(c.env).delete(agentOutputs).where(eq(agentOutputs.id, row.id));
    }
  }

  // Insert new active version
  await db(c.env).insert(agentOutputs).values({
    id: `${sessionId}_${agentNum}_v${nextVersion}`,
    sessionId,
    agentNum,
    version: nextVersion,
    isActive: 1,
    output: body.output || null,
    parsedData: body.parsedData ? JSON.stringify(body.parsedData) : null,
    status: body.status || "done",
    updatedAt: now,
  });

  // Update session metadata
  const patch = body.sessionPatch || {};
  await db(c.env).update(blogSessions).set({
    updatedAt: now,
    currentAgent: agentNum,
    ...(patch.blogType || patch.blog_type ? { blogType: patch.blogType || patch.blog_type } : {}),
    ...(patch.targetAudience || patch.target_audience ? { targetAudience: patch.targetAudience || patch.target_audience } : {}),
    ...(patch.funnelStage || patch.funnel_stage ? { funnelStage: patch.funnelStage || patch.funnel_stage } : {}),
    ...(patch.productContext ? { productContext: JSON.stringify(patch.productContext) } : {}),
    ...(patch.status ? { status: patch.status } : {}),
  }).where(eq(blogSessions.id, sessionId));

  return c.json({ ok: true, version: nextVersion });
});

// ─── Save checkpoint (partial output during streaming) ───────────────────────
sessionRoutes.post("/:id/agents/:agentNum/checkpoint", async (c) => {
  const sessionId = c.req.param("id");
  const agentNum = parseInt(c.req.param("agentNum"));
  const { output } = await c.req.json();

  // Update the current active version's output without creating a new version
  const existing = await db(c.env)
    .select()
    .from(agentOutputs)
    .where(and(
      eq(agentOutputs.sessionId, sessionId),
      eq(agentOutputs.agentNum, agentNum),
      eq(agentOutputs.isActive, 1)
    ));

  if (existing.length > 0) {
    await db(c.env)
      .update(agentOutputs)
      .set({ output, status: "running", updatedAt: new Date() })
      .where(eq(agentOutputs.id, existing[0].id));
  } else {
    // No active version yet — create a running placeholder
    const version = 1;
    await db(c.env).insert(agentOutputs).values({
      id: `${sessionId}_${agentNum}_v${version}`,
      sessionId,
      agentNum,
      version,
      isActive: 1,
      output,
      parsedData: null,
      status: "running",
      updatedAt: new Date(),
    }).catch(() => { /* ignore duplicate */ });
  }

  return c.json({ ok: true });
});
