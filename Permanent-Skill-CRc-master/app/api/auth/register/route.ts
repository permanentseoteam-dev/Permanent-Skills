import { register } from "@/lib/actions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      notes?: string;
      ref?: string;
    };
    const result = await register({
      name: String(body.name || ""),
      email: String(body.email || ""),
      password: String(body.password || ""),
      phone: String(body.phone || ""),
      notes: String(body.notes || ""),
      ref: body.ref ? String(body.ref) : undefined,
    });
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return Response.json({ ok: false, error: "Could not create account. Please try again." }, { status: 500 });
  }
}
