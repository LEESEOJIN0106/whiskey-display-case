"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { getAiringInfo } from "./airing";
import type { ImageSuggestion, TastingNote, Whisky, WhiskyNameSuggestion } from "./types";

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value && "toDate" in value) {
    return (value as Timestamp).toDate().toISOString();
  }
  return null;
}

function serializeWhisky(
  id: string,
  data: Record<string, unknown>,
  notes?: TastingNote[]
): Whisky {
  const status = String(data.status ?? "UNOPENED") as Whisky["status"];
  const openedAt = toIso(data.openedAt);
  return {
    id,
    userId: String(data.userId ?? ""),
    name: String(data.name ?? ""),
    distillery: String(data.distillery ?? ""),
    abv: Number(data.abv ?? 0),
    openedAt,
    status,
    remainingPercent: Number(data.remainingPercent ?? 100),
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
    createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
    ...getAiringInfo(openedAt, status),
    notes,
  };
}

function serializeNote(id: string, data: Record<string, unknown>): TastingNote {
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  return {
    id,
    whiskyId: String(data.whiskyId ?? ""),
    userId: String(data.userId ?? ""),
    tastedAt: toIso(data.tastedAt) ?? new Date().toISOString(),
    rating: Number(data.rating ?? 0),
    tags,
    memo: String(data.memo ?? ""),
    isPublic: Boolean(data.isPublic),
    createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

async function getOwnedWhisky(id: string) {
  const uid = requireUid();
  const ref = doc(db, "whiskies", id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().userId !== uid) {
    throw new Error("Whisky not found");
  }
  return { uid, ref, snap };
}

async function fetchNotes(whiskyId: string, uid: string) {
  try {
    const notesSnap = await getDocs(
      query(
        collection(db, "whiskies", whiskyId, "notes"),
        where("userId", "==", uid)
      )
    );
    return notesSnap.docs
      .map((item) => serializeNote(item.id, item.data()))
      .sort((a, b) => (a.tastedAt < b.tastedAt ? 1 : -1));
  } catch {
    return [] as TastingNote[];
  }
}

export async function fetchWhiskies() {
  const uid = requireUid();
  const snapshot = await getDocs(
    query(collection(db, "whiskies"), where("userId", "==", uid))
  );
  return snapshot.docs
    .map((item) => serializeWhisky(item.id, item.data()))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function fetchWhisky(id: string) {
  const { uid, snap } = await getOwnedWhisky(id);
  const notes = await fetchNotes(id, uid);
  return serializeWhisky(id, snap.data(), notes);
}

export async function createWhisky(payload: {
  name: string;
  distillery?: string;
  abv: number;
  openedAt?: string | null;
  status?: "UNOPENED" | "OPENED" | "FINISHED";
  remainingPercent?: number;
  imageUrl?: string | null;
}) {
  const uid = requireUid();
  const status = payload.status ?? "UNOPENED";
  let openedAt: Date | null = payload.openedAt ? new Date(payload.openedAt) : null;
  if (status === "UNOPENED") openedAt = null;
  if (status === "OPENED" && !openedAt) openedAt = new Date();

  const ref = await addDoc(collection(db, "whiskies"), {
    userId: uid,
    name: payload.name,
    distillery: payload.distillery?.trim() || "",
    abv: payload.abv,
    status,
    openedAt,
    remainingPercent: Math.round(payload.remainingPercent ?? 100),
    imageUrl: payload.imageUrl ?? null,
    createdAt: serverTimestamp(),
  });
  const created = await getDoc(ref);
  return serializeWhisky(ref.id, created.data() ?? { ...payload, userId: uid, status });
}

export async function deleteWhisky(id: string) {
  const { uid, ref } = await getOwnedWhisky(id);

  try {
    const notesSnap = await getDocs(
      query(
        collection(db, "whiskies", id, "notes"),
        where("userId", "==", uid)
      )
    );
    const batch = writeBatch(db);
    notesSnap.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(ref);
    await batch.commit();
  } catch {
    await deleteDoc(ref);
  }

  return { ok: true as const };
}

export async function updateWhisky(
  id: string,
  payload: Partial<{
    name: string;
    distillery?: string;
    abv: number;
    openedAt: string | null;
    status: "UNOPENED" | "OPENED" | "FINISHED";
    remainingPercent: number;
    imageUrl: string | null;
  }>
) {
  const { ref, snap } = await getOwnedWhisky(id);
  const existing = serializeWhisky(id, snap.data());
  const status = payload.status ?? existing.status;
  let openedAt: Date | null =
    payload.openedAt !== undefined
      ? payload.openedAt
        ? new Date(payload.openedAt)
        : null
      : existing.openedAt
        ? new Date(existing.openedAt)
        : null;
  if (status === "UNOPENED") openedAt = null;
  if (status === "OPENED" && !openedAt) openedAt = new Date();

  await updateDoc(ref, {
    name: payload.name ?? existing.name,
    distillery: payload.distillery ?? existing.distillery ?? "",
    abv: payload.abv ?? existing.abv,
    status,
    openedAt,
    remainingPercent: Math.round(
      payload.remainingPercent ?? existing.remainingPercent
    ),
    imageUrl: payload.imageUrl === undefined ? existing.imageUrl : payload.imageUrl,
  });
  const updated = await getDoc(ref);
  return serializeWhisky(id, updated.data() ?? {});
}

export async function recordPour(id: string, percent: number) {
  const { ref, snap } = await getOwnedWhisky(id);
  const existing = serializeWhisky(id, snap.data());
  if (existing.status !== "OPENED") {
    throw new Error("개봉한 병만 한 잔을 기록할 수 있습니다.");
  }

  const next = Math.max(0, Math.min(100, existing.remainingPercent - percent));
  const status = next === 0 ? "FINISHED" : "OPENED";
  await updateDoc(ref, {
    remainingPercent: Math.round(next),
    status,
  });
  const updated = await getDoc(ref);
  return serializeWhisky(id, updated.data() ?? {});
}

export async function createNote(
  whiskyId: string,
  payload: {
    tastedAt: string;
    rating: number;
    tags: string[];
    memo: string;
    isPublic: boolean;
  }
) {
  const uid = requireUid();
  await getOwnedWhisky(whiskyId);
  const ref = await addDoc(collection(db, "whiskies", whiskyId, "notes"), {
    userId: uid,
    whiskyId,
    tastedAt: new Date(payload.tastedAt),
    rating: Math.round(payload.rating),
    tags: payload.tags.slice(0, 20).map((tag) => tag.slice(0, 40)),
    memo: payload.memo.slice(0, 4000),
    isPublic: payload.isPublic,
    createdAt: serverTimestamp(),
  });
  const created = await getDoc(ref);
  return serializeNote(ref.id, created.data() ?? { ...payload, userId: uid, whiskyId });
}

export function searchWhiskyImages(queryText: string) {
  return api<{ results: ImageSuggestion[] }>(
    `/api/images/search?q=${encodeURIComponent(queryText)}`
  );
}

export function suggestWhiskyNames(queryText: string) {
  return api<{ results: WhiskyNameSuggestion[] }>(
    `/api/suggest/whiskies?q=${encodeURIComponent(queryText)}`
  );
}
