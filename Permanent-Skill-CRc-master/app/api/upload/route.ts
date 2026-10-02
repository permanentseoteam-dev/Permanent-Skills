import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { isAdminSession } from "@/lib/actions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await isAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Choose a video file." }, { status: 400 });
  }
  if (file.size > 80 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "Video must be under 80MB." }, { status: 400 });
  }

  const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
  if (file.type && !allowed.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "Upload an MP4, WebM, or MOV file." }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".mp4";
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/videos/${name}` });
}
