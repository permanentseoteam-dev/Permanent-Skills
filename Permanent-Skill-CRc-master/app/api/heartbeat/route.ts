import { heartbeat } from "@/lib/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await heartbeat();
    return Response.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in /api/heartbeat POST handler:", error);
    return Response.json({ ok: false, error: "Heartbeat failed" }, { status: 500 });
  }
}
