import { login } from "@/lib/actions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      memberType?: "team" | "premium";
    };
    const email = String(body.email || "");
    const password = String(body.password || "");
    const memberType = body.memberType;
    if (!email || !password) {
      return Response.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }
    const result = await login(email, password, memberType);
    return Response.json(result, { status: result.ok ? 200 : 401 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not log in. Please try again.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
