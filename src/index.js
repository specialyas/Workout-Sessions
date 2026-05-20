import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";

/** Prisma not-found errors (e.g. delete/update by missing id). */
const PRISMA_NOT_FOUND = "P2025";

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

// --- Health ---

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Sessions CRUD ---

app.get("/sessions", async (_req, res) => {
  const sessions = await prisma.session.findMany({
    orderBy: { logged_at: "desc" },
  });
  res.json(sessions);
});

app.get("/sessions/:id", async (req, res) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
  });
  if (!session) {
    return res.status(404).json({ error: "session not found" });
  }
  res.json(session);
});

/**
 * Validates body for POST and PUT. Returns `{ data }` or `{ error }`.
 * Omits `logged_at` from `data` when not provided so create uses the DB default (`now()`).
 */
function buildSessionCreateData(body) {
  const { exercise, sets, reps, weight_kg, notes, logged_at } = body;

  if (
    exercise === undefined ||
    sets === undefined ||
    reps === undefined ||
    weight_kg === undefined
  ) {
    return {
      error:
        "exercise, sets, reps, and weight_kg are required",
    };
  }

  const setsNum = Number(sets);
  const repsNum = Number(reps);
  const weightNum = Number(weight_kg);

  if (
    !Number.isInteger(setsNum) ||
    !Number.isInteger(repsNum) ||
    Number.isNaN(weightNum)
  ) {
    return {
      error:
        "sets and reps must be integers; weight_kg must be a number",
    };
  }

  const data = {
    exercise: String(exercise),
    sets: setsNum,
    reps: repsNum,
    weight_kg: weightNum,
    notes: notes != null ? String(notes) : null,
  };

  if (logged_at != null) {
    const d = new Date(logged_at);
    if (Number.isNaN(d.getTime())) {
      return { error: "logged_at must be a valid date" };
    }
    data.logged_at = d;
  }

  return { data };
}

app.post("/sessions", async (req, res) => {
  const parsed = buildSessionCreateData(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const session = await prisma.session.create({ data: parsed.data });
  res.status(201).json(session);
});

app.put("/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "session not found" });
  }

  const parsed = buildSessionCreateData(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const data = { ...parsed.data };
  // Full replace: if client omits `logged_at`, keep the existing timestamp (PUT does not clear it).
  if (req.body.logged_at === undefined) {
    data.logged_at = existing.logged_at;
  }

  const session = await prisma.session.update({ where: { id }, data });
  res.json(session);
});

app.patch("/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const data = {};

  if (body.exercise !== undefined) {
    data.exercise = String(body.exercise);
  }
  if (body.sets !== undefined) {
    const n = Number(body.sets);
    if (!Number.isInteger(n)) {
      return res.status(400).json({ error: "sets must be an integer" });
    }
    data.sets = n;
  }
  if (body.reps !== undefined) {
    const n = Number(body.reps);
    if (!Number.isInteger(n)) {
      return res.status(400).json({ error: "reps must be an integer" });
    }
    data.reps = n;
  }
  if (body.weight_kg !== undefined) {
    const n = Number(body.weight_kg);
    if (Number.isNaN(n)) {
      return res.status(400).json({ error: "weight_kg must be a number" });
    }
    data.weight_kg = n;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes == null ? null : String(body.notes);
  }
  if (body.logged_at !== undefined) {
    // Column is non-null; reject explicit null instead of letting Prisma fail obscurely.
    if (body.logged_at == null) {
      return res.status(400).json({ error: "logged_at cannot be null" });
    }
    const d = new Date(body.logged_at);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: "logged_at must be a valid date" });
    }
    data.logged_at = d;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "no fields to update" });
  }

  try {
    const session = await prisma.session.update({ where: { id }, data });
    res.json(session);
  } catch (e) {
    if (e.code === PRISMA_NOT_FOUND) {
      return res.status(404).json({ error: "session not found" });
    }
    throw e;
  }
});

app.delete("/sessions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.session.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === PRISMA_NOT_FOUND) {
      return res.status(404).json({ error: "session not found" });
    }
    throw e;
  }
});

// Four-argument middleware: Express invokes this when a route throws or calls `next(err)`.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
