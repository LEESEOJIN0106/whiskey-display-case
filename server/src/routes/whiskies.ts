import { Router } from "express";
import { z } from "zod";
import type { TastingNote, Whisky, WhiskyStatus } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { getAiringInfo } from "../utils/airing.js";

const router = Router();

type WhiskyWithNotes = Whisky & { notes?: TastingNote[] };

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function serializeNote(note: TastingNote) {
  return { ...note, tags: parseTags(note.tags) };
}

function serializeWhisky(whisky: WhiskyWithNotes) {
  return {
    ...whisky,
    ...getAiringInfo(whisky.openedAt, whisky.status),
    notes: whisky.notes?.map(serializeNote),
  };
}

function resolveOpenedAt(
  status: WhiskyStatus,
  incoming?: string | null,
  previous: Date | null = null
) {
  if (status === "UNOPENED") return null;

  const openedAt =
    incoming !== undefined ? (incoming ? new Date(incoming) : null) : previous;

  if (status === "OPENED" && !openedAt) return new Date();
  return openedAt;
}

function findOwnedWhisky(id: string, userId: string) {
  return prisma.whisky.findFirst({ where: { id, userId } });
}

const whiskyFields = {
  name: z.string().min(1),
  distillery: z.string().min(1),
  abv: z.number().positive().max(100),
  openedAt: z.union([z.string().datetime(), z.null()]).optional(),
  status: z.enum(["UNOPENED", "OPENED", "FINISHED"]).optional(),
  remainingPercent: z.number().int().min(0).max(100).optional(),
  imageUrl: z.union([z.string().url(), z.null()]).optional(),
};

const createWhiskySchema = z.object(whiskyFields);
const updateWhiskySchema = z.object({
  name: whiskyFields.name.optional(),
  distillery: whiskyFields.distillery.optional(),
  abv: whiskyFields.abv.optional(),
  openedAt: whiskyFields.openedAt,
  status: whiskyFields.status,
  remainingPercent: whiskyFields.remainingPercent,
  imageUrl: whiskyFields.imageUrl,
});

const createNoteSchema = z.object({
  tastedAt: z.string().datetime(),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string()).default([]),
  memo: z.string().default(""),
  isPublic: z.boolean().default(false),
});

router.get("/", async (req, res) => {
  const collection = await prisma.whisky.findMany({
    where: { userId: req.user!.uid },
    orderBy: { createdAt: "desc" },
  });
  res.json(collection.map(serializeWhisky));
});

router.post("/", async (req, res) => {
  const parsed = createWhiskySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const status = payload.status ?? "UNOPENED";
  const whisky = await prisma.whisky.create({
    data: {
      userId: req.user!.uid,
      name: payload.name,
      distillery: payload.distillery,
      abv: payload.abv,
      status,
      openedAt: resolveOpenedAt(status, payload.openedAt),
      remainingPercent: payload.remainingPercent ?? 100,
      imageUrl: payload.imageUrl ?? null,
    },
  });

  res.status(201).json(serializeWhisky(whisky));
});

router.get("/:id", async (req, res) => {
  const whisky = await prisma.whisky.findFirst({
    where: { id: req.params.id, userId: req.user!.uid },
    include: { notes: { orderBy: { tastedAt: "desc" } } },
  });

  if (!whisky) {
    return res.status(404).json({ error: "Whisky not found" });
  }

  res.json(serializeWhisky(whisky));
});

router.patch("/:id", async (req, res) => {
  const parsed = updateWhiskySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await findOwnedWhisky(req.params.id, req.user!.uid);
  if (!existing) {
    return res.status(404).json({ error: "Whisky not found" });
  }

  const payload = parsed.data;
  const status = payload.status ?? existing.status;
  const whisky = await prisma.whisky.update({
    where: { id: existing.id },
    data: {
      name: payload.name,
      distillery: payload.distillery,
      abv: payload.abv,
      status,
      openedAt: resolveOpenedAt(status, payload.openedAt, existing.openedAt),
      remainingPercent: payload.remainingPercent,
      imageUrl: payload.imageUrl,
    },
  });

  res.json(serializeWhisky(whisky));
});

router.delete("/:id", async (req, res) => {
  const existing = await findOwnedWhisky(req.params.id, req.user!.uid);
  if (!existing) {
    return res.status(404).json({ error: "Whisky not found" });
  }

  await prisma.whisky.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

router.post("/:id/notes", async (req, res) => {
  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const whisky = await findOwnedWhisky(req.params.id, req.user!.uid);
  if (!whisky) {
    return res.status(404).json({ error: "Whisky not found" });
  }

  const { tastedAt, rating, tags, memo, isPublic } = parsed.data;
  const note = await prisma.tastingNote.create({
    data: {
      whiskyId: whisky.id,
      userId: req.user!.uid,
      tastedAt: new Date(tastedAt),
      rating,
      tags: JSON.stringify(tags),
      memo,
      isPublic,
    },
  });

  res.status(201).json(serializeNote(note));
});

export default router;
