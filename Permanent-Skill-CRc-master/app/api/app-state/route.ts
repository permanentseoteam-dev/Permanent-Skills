import { getAppState } from "@/lib/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const state = await getAppState();
    return Response.json(state, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error in /api/app-state GET handler:", error);
    return Response.json({ error: "Failed to fetch app state" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const state = await getAppState();
    return Response.json(state, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error in /api/app-state POST handler:", error);
    return Response.json({ error: "Failed to fetch app state" }, { status: 500 });
  }
}
