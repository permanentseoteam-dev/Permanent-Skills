import { getVisitorId } from "./bucketing";
import { COMMUNITY_EXPERIMENT } from "./config";
import type { ExperimentVariant } from "@/lib/types";

const loggedExposures = new Set<string>();

export function trackExperimentEvent(
  eventName: "exposure" | "composer_open" | "post_submit" | "like_click" | "comment_submit",
  variant: ExperimentVariant,
  userId?: string,
  metadata?: Record<string, unknown>,
  experimentId: string = COMMUNITY_EXPERIMENT.id
) {
  if (typeof window === "undefined") return;

  const visitorId = getVisitorId();

  // Deduplicate exposure logging per session to prevent inflate impressions
  if (eventName === "exposure") {
    const dedupeKey = `${experimentId}:${variant}:${visitorId}:${userId || "anon"}`;
    if (loggedExposures.has(dedupeKey)) return;
    loggedExposures.add(dedupeKey);
  }

  const payload = {
    experimentId,
    variant,
    userId,
    visitorId,
    eventName,
    metadata,
  };

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/experiment/telemetry", blob);
    } else {
      fetch("/api/experiment/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently in telemetry
  }
}
