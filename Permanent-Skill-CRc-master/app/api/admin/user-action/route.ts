import { approveUser, rejectUser, deleteMember, updateMember, releaseMemberLogin } from "@/lib/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, userId, ...rest } = body;

    if (!action || !userId) {
      return Response.json({ ok: false, error: "Action and userId are required." }, { status: 400 });
    }

    let result;
    switch (action) {
      case "approve":
        result = await approveUser(userId);
        break;
      case "reject":
        result = await rejectUser(userId);
        break;
      case "delete":
        result = await deleteMember(userId);
        break;
      case "update":
        result = await updateMember({ userId, ...rest });
        break;
      case "releaseLogin":
        result = await releaseMemberLogin(userId);
        break;
      default:
        return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    return Response.json(result, { status: 200 });
  } catch (err) {
    console.error("Error in /api/admin/user-action:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
