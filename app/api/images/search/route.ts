import { requireUser } from "@/lib/firebase-admin";
import { searchWebImages } from "@/lib/image-search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireUser(request);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return Response.json({ error: "q is required" }, { status: 400 });
  }

  const query = /위스키|whisky|whiskey/i.test(q) ? q : `${q} 위스키`;
  const results = await searchWebImages(query);
  return Response.json({ results });
}
