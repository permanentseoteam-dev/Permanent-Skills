import { NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";
import { calculateExperimentStats } from "@/lib/experimentation/stats";
import { COMMUNITY_EXPERIMENT } from "@/lib/experimentation/config";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const expId = url.searchParams.get("experimentId") || COMMUNITY_EXPERIMENT.id;

    const db = readDb();
    const allEvents = db.experimentEvents || [];
    const filtered = allEvents.filter((e) => e.experimentId === expId);

    const stats = calculateExperimentStats(filtered);
    return NextResponse.json({ ok: true, stats, experiment: COMMUNITY_EXPERIMENT });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to compute stats" }, { status: 500 });
  }
}

// Support reset or seeding synthetic samples for data science demonstration
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "reset";

    await updateDb((db) => {
      if (!db.experimentEvents) db.experimentEvents = [];

      if (action === "reset") {
        db.experimentEvents = db.experimentEvents.filter(
          (e) => e.experimentId !== COMMUNITY_EXPERIMENT.id
        );
      } else if (action === "seed_sample") {
        // Seed a realistic sample: e.g. 100 control visitors (8 post) vs 100 treatment visitors (18 post)
        // Demonstrating statistical lift for QA validation
        const sampleEvents = [];
        const now = Date.now();

        // Control: 100 users, 8 posts (8% conversion)
        for (let i = 1; i <= 100; i++) {
          const vId = `sim_c_${i}`;
          sampleEvents.push({
            id: `seed-c-${i}`,
            experimentId: COMMUNITY_EXPERIMENT.id,
            variant: "control" as const,
            visitorId: vId,
            eventName: "exposure" as const,
            timestamp: new Date(now - i * 60000).toISOString(),
          });
          if (i <= 20) {
            sampleEvents.push({
              id: `seed-co-${i}`,
              experimentId: COMMUNITY_EXPERIMENT.id,
              variant: "control" as const,
              visitorId: vId,
              eventName: "composer_open" as const,
              timestamp: new Date(now - i * 60000 + 5000).toISOString(),
            });
          }
          if (i <= 8) {
            sampleEvents.push({
              id: `seed-cp-${i}`,
              experimentId: COMMUNITY_EXPERIMENT.id,
              variant: "control" as const,
              visitorId: vId,
              eventName: "post_submit" as const,
              timestamp: new Date(now - i * 60000 + 15000).toISOString(),
            });
          }
        }

        // Treatment: 100 users, 18 posts (18% conversion, +125% lift)
        for (let i = 1; i <= 100; i++) {
          const vId = `sim_t_${i}`;
          sampleEvents.push({
            id: `seed-t-${i}`,
            experimentId: COMMUNITY_EXPERIMENT.id,
            variant: "treatment" as const,
            visitorId: vId,
            eventName: "exposure" as const,
            timestamp: new Date(now - i * 60000).toISOString(),
          });
          if (i <= 35) {
            sampleEvents.push({
              id: `seed-to-${i}`,
              experimentId: COMMUNITY_EXPERIMENT.id,
              variant: "treatment" as const,
              visitorId: vId,
              eventName: "composer_open" as const,
              timestamp: new Date(now - i * 60000 + 5000).toISOString(),
            });
          }
          if (i <= 18) {
            sampleEvents.push({
              id: `seed-tp-${i}`,
              experimentId: COMMUNITY_EXPERIMENT.id,
              variant: "treatment" as const,
              visitorId: vId,
              eventName: "post_submit" as const,
              timestamp: new Date(now - i * 60000 + 15000).toISOString(),
            });
          }
        }

        db.experimentEvents.push(...sampleEvents);
      }
    });

    return NextResponse.json({ ok: true, message: `Experiment events ${action} successful` });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Operation failed" }, { status: 500 });
  }
}
