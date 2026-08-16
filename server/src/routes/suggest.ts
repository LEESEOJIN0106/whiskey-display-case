import { Router } from "express";
import { POPULAR_WHISKIES } from "../data/popular-whiskies.js";
import { normalize, uniqueBy } from "../utils/text.js";

const router = Router();

export type SuggestItem = {
  kind: "entity" | "query";
  label: string;
  name: string;
  distillery: string;
  subtitle?: string;
  imageUrl?: string | null;
};

function localSuggestions(query: string): SuggestItem[] {
  const needle = normalize(query);
  if (!needle) return [];

  return POPULAR_WHISKIES.filter((whisky) =>
    normalize(
      `${whisky.name} ${whisky.distillery} ${whisky.aliases.join(" ")}`
    ).includes(needle)
  )
    .slice(0, 8)
    .map((whisky) => ({
      kind: "query" as const,
      label: whisky.name,
      name: whisky.name,
      distillery: whisky.distillery,
    }));
}

function decodeSuggestBody(buffer: ArrayBuffer, charset?: string | null) {
  const tryDecode = (encoding: string) => {
    try {
      return new TextDecoder(encoding).decode(buffer);
    } catch {
      return null;
    }
  };

  const preferred = charset ? tryDecode(charset) : null;
  if (preferred && !preferred.includes("\uFFFD")) return preferred;

  const utf8 = tryDecode("utf-8") ?? "";
  if (!utf8.includes("\uFFFD")) return utf8;

  return tryDecode("euc-kr") ?? utf8;
}

function isReadableLabel(text: string) {
  if (!text || text.includes("\uFFFD")) return false;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) return false;
  return /[\p{L}\p{N}]/u.test(text);
}

async function googleSuggestions(query: string): Promise<SuggestItem[]> {
  const url = new URL("https://suggestqueries.google.com/complete/search");
  url.searchParams.set("client", "firefox");
  url.searchParams.set("hl", "ko");
  url.searchParams.set("ie", "utf8");
  url.searchParams.set("oe", "utf8");
  url.searchParams.set("q", `${query} 위스키`);

  const response = await fetch(url, {
    headers: { "User-Agent": "whisky-log/1.0" },
  });
  if (!response.ok) return [];

  const charset = /charset=([^;]+)/i
    .exec(response.headers.get("content-type") ?? "")?.[1]
    ?.trim();
  const text = decodeSuggestBody(await response.arrayBuffer(), charset);
  const [, suggestions] = JSON.parse(text) as [string, string[]];
  if (!Array.isArray(suggestions)) return [];

  const items: SuggestItem[] = [];
  for (const label of suggestions) {
    const cleaned = label
      .replace(/\s*위스키\s*/gi, " ")
      .replace(/\s*whisky\s*/gi, " ")
      .replace(/\s*whiskey\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!isReadableLabel(cleaned)) continue;

    items.push({
      kind: "query",
      label: cleaned,
      name: cleaned,
      distillery: cleaned.split(/\s+/)[0] ?? cleaned,
    });
    if (items.length >= 8) break;
  }

  return items;
}

router.get("/whiskies", async (req, res) => {
  const query = String(req.query.q ?? "").trim();
  if (!query) {
    return res.json({ results: [] as SuggestItem[] });
  }

  const remote = await googleSuggestions(query).catch(() => [] as SuggestItem[]);
  const results = uniqueBy(
    [...remote, ...localSuggestions(query)],
    (item) => `${item.kind}:${normalize(item.label)}`
  ).slice(0, 10);

  res.json({ results });
});

export default router;
