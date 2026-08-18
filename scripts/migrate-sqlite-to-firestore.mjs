import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const PROJECT_ID = "whiskey-display-case";
const FIREBASE_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";
const root = process.cwd();
const dbPath = path.join(root, "server", "dev.db");

if (!existsSync(dbPath)) {
  console.log("no local sqlite db at server/dev.db");
  process.exit(0);
}

const tokenPaths = [
  path.join(homedir(), ".config/configstore/firebase-tools.json"),
  process.env.APPDATA
    ? path.join(process.env.APPDATA, "configstore/firebase-tools.json")
    : null,
].filter(Boolean);

const storePath = tokenPaths.find((candidate) => existsSync(candidate));
if (!storePath) {
  throw new Error("Firebase CLI refresh token not found. Run firebase login.");
}

const store = JSON.parse(readFileSync(storePath, "utf8"));
const tokens = store.tokens ?? store;
const refreshToken = tokens.refresh_token ?? tokens.refreshToken;
if (!refreshToken) {
  throw new Error("Firebase CLI refresh token not found. Run firebase login.");
}

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: FIREBASE_CLIENT_ID,
    client_secret: FIREBASE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }),
});
const tokenJson = await tokenRes.json();
if (!tokenJson.access_token) {
  throw new Error(`Token refresh failed: ${tokenJson.error ?? tokenRes.status}`);
}

const headers = {
  Authorization: `Bearer ${tokenJson.access_token}`,
  "Content-Type": "application/json",
};

function str(value) {
  return { stringValue: String(value ?? "") };
}

function num(value) {
  return { doubleValue: Number(value) };
}

function bool(value) {
  return { booleanValue: Boolean(value) };
}

function timestamp(value) {
  return { timestampValue: new Date(value).toISOString() };
}

function parseTags(raw) {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function putDocument(docPath, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Write ${docPath} failed: ${res.status} ${await res.text()}`);
  }
}

const require = createRequire(import.meta.url);
const Database = require(path.join(root, "server/node_modules/better-sqlite3"));
const sqlite = new Database(dbPath, { readonly: true });
const whiskies = sqlite.prepare("SELECT * FROM Whisky").all();
const notes = sqlite.prepare("SELECT * FROM TastingNote").all();

for (const row of whiskies) {
  await putDocument(`whiskies/${row.id}`, {
    userId: str(row.userId),
    name: str(row.name),
    distillery: str(row.distillery),
    abv: num(row.abv),
    openedAt: row.openedAt ? timestamp(row.openedAt) : { nullValue: null },
    status: str(row.status),
    remainingPercent: num(row.remainingPercent ?? 100),
    imageUrl: row.imageUrl ? str(row.imageUrl) : { nullValue: null },
    createdAt: timestamp(row.createdAt ?? Date.now()),
  });
}

for (const row of notes) {
  await putDocument(`whiskies/${row.whiskyId}/notes/${row.id}`, {
    userId: str(row.userId),
    whiskyId: str(row.whiskyId),
    tastedAt: timestamp(row.tastedAt),
    rating: num(row.rating),
    tags: {
      arrayValue: {
        values: parseTags(row.tags).map((tag) => ({ stringValue: tag })),
      },
    },
    memo: str(row.memo ?? ""),
    isPublic: bool(row.isPublic),
    createdAt: timestamp(row.createdAt ?? Date.now()),
  });
}

console.log(`migrated ${whiskies.length} whiskies, ${notes.length} notes`);
