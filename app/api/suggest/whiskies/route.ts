import { requireUser } from "@/lib/firebase-admin";
import { suggestWhiskies } from "@/lib/whisky-suggest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireUser(request);
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const results = await suggestWhiskies(query);
  return Response.json({ results });
}
