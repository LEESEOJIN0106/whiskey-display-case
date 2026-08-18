import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const PROJECT_ID = "whiskey-display-case";
const FIREBASE_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";
const EXTRA_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "10.30.0.37",
  "whiskeylog.vercel.app",
];

const tokenPaths = [
  path.join(homedir(), ".config/configstore/firebase-tools.json"),
  process.env.APPDATA
    ? path.join(process.env.APPDATA, "configstore/firebase-tools.json")
    : null,
].filter(Boolean);

const storePath = tokenPaths.find((candidate) => {
  try {
    readFileSync(candidate);
    return true;
  } catch {
    return false;
  }
});
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

const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;
const getRes = await fetch(configUrl, { headers });
const config = await getRes.json();
if (!getRes.ok) {
  throw new Error(`Get config failed: ${getRes.status} ${JSON.stringify(config)}`);
}

const current = Array.isArray(config.authorizedDomains)
  ? config.authorizedDomains
  : [];
const next = [...new Set([...current, ...EXTRA_DOMAINS])];
console.log("current domains:", current.join(", ") || "(none)");
console.log("next domains:", next.join(", "));

if (next.length === current.length && EXTRA_DOMAINS.every((d) => current.includes(d))) {
  console.log("already authorized");
  process.exit(0);
}

const patchRes = await fetch(`${configUrl}?updateMask=authorizedDomains`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ authorizedDomains: next }),
});
const patched = await patchRes.json();
if (!patchRes.ok) {
  throw new Error(`Patch failed: ${patchRes.status} ${JSON.stringify(patched)}`);
}
console.log("updated domains:", (patched.authorizedDomains ?? []).join(", "));
