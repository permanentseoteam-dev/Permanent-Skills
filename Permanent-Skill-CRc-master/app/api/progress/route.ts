import { completeLesson } from "@/lib/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, lessonId } = body || {};
    if (!courseId || !lessonId) {
      return Response.json({ ok: false, error: "Missing courseId or lessonId" }, { status: 400 });
    }

    const result = await completeLesson(courseId, lessonId);
    return Response.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in /api/progress POST handler:", error);
    return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
