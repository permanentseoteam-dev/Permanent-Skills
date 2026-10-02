import { NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import type { ExperimentEvent, ExperimentVariant } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      experimentId: string;
      variant: ExperimentVariant;
      userId?: string;
      visitorId: string;
      eventName: "exposure" | "composer_open" | "post_submit" | "like_click" | "comment_submit";
      metadata?: Record<string, unknown>;
    };

    if (!body.experimentId || !body.variant || !body.eventName) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const event: ExperimentEvent = {
      id: `ev-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`,
      experimentId: body.experimentId,
      variant: body.variant,
      userId: body.userId || undefined,
      visitorId: body.visitorId || "anonymous",
      eventName: body.eventName,
      metadata: body.metadata,
      timestamp: new Date().toISOString(),
    };

    await updateDb((db) => {
      if (!db.experimentEvents) db.experimentEvents = [];
      db.experimentEvents.push(event);
      // Keep up to 10,000 events in persistent memory
      if (db.experimentEvents.length > 10000) {
        db.experimentEvents = db.experimentEvents.slice(-8000);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Telemetry failed to log" }, { status: 500 });
  }
}
