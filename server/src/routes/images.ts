import { Router } from "express";
import { POPULAR_WHISKIES } from "../data/popular-whiskies.js";
import { normalize, uniqueBy } from "../utils/text.js";

const router = Router();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type ImageSuggestion = {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  source: string;
  sourceUrl: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function englishAlias(query: string) {
  const needle = normalize(query);
  if (!needle) return null;

  const match = POPULAR_WHISKIES.find((whisky) => {
    const haystack = normalize(
      `${whisky.name} ${whisky.distillery} ${whisky.aliases.join(" ")}`
    );
    return haystack.includes(needle) || needle.includes(normalize(whisky.name));
  });

  return match?.aliases.find((alias) => /[A-Za-z]/.test(alias)) ?? null;
}

async function fetchText(url: string, extraHeaders?: HeadersInit) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        ...extraHeaders,
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return "";
    return response.text();
  } catch {
    return "";
  }
}

function parseBingImages(html: string, query: string): ImageSuggestion[] {
  const images: ImageSuggestion[] = [];
  const re = /&quot;murl&quot;:&quot;(https?:[^&]+)&quot;/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = re.exec(html))) {
    const chunk = html.slice(match.index, match.index + 900);
    const original = decodeHtml(match[1] ?? "");
    if (!original) continue;

    const thumb = decodeHtml(
      chunk.match(/&quot;turl&quot;:&quot;(https?:[^&]+)&quot;/)?.[1] ?? original
    );
    const title = decodeHtml(
      chunk.match(/&quot;t&quot;:&quot;([^&]*)&quot;/)?.[1] ?? query
    ).replace(/[\u0000-\u001F]/g, "");
    const page =
      decodeHtml(
        html
          .slice(Math.max(0, match.index - 500), match.index)
          .match(/https?:\/\/[^&"]+/)?.[0] ?? ""
      ) || original;

    images.push({
      id: `bing-${index}-${original}`,
      url: thumb || original,
      thumbUrl: thumb || original,
      alt: title || query,
      source: "Bing",
      sourceUrl: page,
    });
    index += 1;
    if (images.length >= 8) break;
  }

  return images;
}

async function searchBingImages(query: string) {
  const url = new URL("https://www.bing.com/images/async");
  url.searchParams.set("q", query);
  url.searchParams.set("first", "0");
  url.searchParams.set("count", "8");
  url.searchParams.set("mmasync", "1");
  url.searchParams.set("adlt", "strict");

  const html = await fetchText(url.toString());
  return parseBingImages(html, query);
}

async function searchCommonsImages(query: string): Promise<ImageSuggestion[]> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime");
  url.searchParams.set("iiurlwidth", "800");

  const text = await fetchText(url.toString(), {
    Accept: "application/json",
    "User-Agent": "WhiskyLog/1.0 (local whisky cellar)",
  });
  if (!text) return [];

  try {
    const payload = JSON.parse(text) as {
      query?: {
        pages?: Record<
          string,
          {
            pageid: number;
            title: string;
            imageinfo?: Array<{
              url?: string;
              thumburl?: string;
              descriptionurl?: string;
              mime?: string;
            }>;
          }
        >;
      };
    };

    return Object.values(payload.query?.pages ?? {}).flatMap((page) => {
      const info = page.imageinfo?.[0];
      const imageUrl = info?.url ?? info?.thumburl;
      if (!imageUrl) return [];
      if (info?.mime && !info.mime.startsWith("image/")) return [];
      if (info?.mime === "image/svg+xml") return [];
      if (!/bottle|label|whisky|whiskey|malt/i.test(page.title)) return [];

      return [
        {
          id: `commons-${page.pageid}`,
          url: imageUrl,
          thumbUrl: info?.thumburl ?? imageUrl,
          alt: page.title.replace(/^File:/, ""),
          source: "Wikimedia Commons",
          sourceUrl:
            info?.descriptionurl ??
            `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
        },
      ];
    });
  } catch {
    return [];
  }
}

async function searchWebImages(query: string) {
  const alias = englishAlias(query);
  const extraQuery =
    alias && normalize(alias) !== normalize(query)
      ? `${alias} whisky bottle`
      : null;

  const [primary, extra, commons] = await Promise.all([
    searchBingImages(query),
    extraQuery ? searchBingImages(extraQuery) : Promise.resolve([]),
    searchCommonsImages(alias ? `${alias} whisky` : query),
  ]);

  return uniqueBy(
    [...primary, ...extra, ...commons],
    (image) => image.url.split("?")[0] ?? image.url
  ).slice(0, 8);
}

router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    return res.status(400).json({ error: "q is required" });
  }

  const query = /위스키|whisky|whiskey/i.test(q) ? q : `${q} 위스키`;
  const results = await searchWebImages(query);
  res.json({ results });
});

export default router;
