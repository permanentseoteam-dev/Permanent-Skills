import { logout } from "@/lib/actions";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await logout();
    return Response.json(result);
  } catch {
    return Response.json({ ok: true });
  }
}
