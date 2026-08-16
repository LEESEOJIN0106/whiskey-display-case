"use client";

import { auth } from "./firebase";
import type { ImageSuggestion, TastingNote, Whisky, WhiskyNameSuggestion } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
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

export function fetchWhiskies() {
  return api<Whisky[]>("/api/whiskies");
}

export function fetchWhisky(id: string) {
  return api<Whisky>(`/api/whiskies/${id}`);
}

export function createWhisky(payload: {
  name: string;
  distillery: string;
  abv: number;
  openedAt?: string | null;
  status?: "UNOPENED" | "OPENED" | "FINISHED";
  remainingPercent?: number;
  imageUrl?: string | null;
}) {
  return api<Whisky>("/api/whiskies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteWhisky(id: string) {
  return api<{ ok: true }>(`/api/whiskies/${id}`, {
    method: "DELETE",
  });
}

export function updateWhisky(
  id: string,
  payload: Partial<{
    name: string;
    distillery: string;
    abv: number;
    openedAt: string | null;
    status: "UNOPENED" | "OPENED" | "FINISHED";
    remainingPercent: number;
    imageUrl: string | null;
  }>
) {
  return api<Whisky>(`/api/whiskies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createNote(
  whiskyId: string,
  payload: {
    tastedAt: string;
    rating: number;
    tags: string[];
    memo: string;
    isPublic: boolean;
  }
) {
  return api<TastingNote>(`/api/whiskies/${whiskyId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchWhiskyImages(query: string) {
  return api<{ results: ImageSuggestion[] }>(
    `/api/images/search?q=${encodeURIComponent(query)}`
  );
}

export function suggestWhiskyNames(query: string) {
  return api<{ results: WhiskyNameSuggestion[] }>(
    `/api/suggest/whiskies?q=${encodeURIComponent(query)}`
  );
}
