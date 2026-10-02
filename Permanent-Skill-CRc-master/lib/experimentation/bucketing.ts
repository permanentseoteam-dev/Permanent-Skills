import { COMMUNITY_EXPERIMENT } from "./config";
import type { ExperimentVariant } from "@/lib/types";

/**
 * 32-bit FNV-1a non-cryptographic hash function.
 * Produces uniform, deterministic distribution with zero dependencies.
 */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

const VISITOR_ID_KEY = "ps_experiment_visitor_id";
const OVERRIDE_PREFIX = "ps_exp_override_";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr-visitor";
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = "v_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return "fallback-visitor";
  }
}

export function getQAOverride(experimentId: string = COMMUNITY_EXPERIMENT.id): ExperimentVariant | null {
  if (typeof window === "undefined") return null;
  try {
    // 1. Check URL parameters (?exp_override=control or ?exp_override=treatment)
    const params = new URLSearchParams(window.location.search);
    const paramVal = params.get("exp_override") || params.get(`${experimentId}_override`);
    if (paramVal === "control" || paramVal === "treatment") {
      localStorage.setItem(OVERRIDE_PREFIX + experimentId, paramVal);
      return paramVal;
    }

    // 2. Check localStorage manual toggle
    const stored = localStorage.getItem(OVERRIDE_PREFIX + experimentId);
    if (stored === "control" || stored === "treatment") {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function setQAOverride(experimentId: string, variant: ExperimentVariant | null): void {
  if (typeof window === "undefined") return;
  try {
    if (variant === null) {
      localStorage.removeItem(OVERRIDE_PREFIX + experimentId);
    } else {
      localStorage.setItem(OVERRIDE_PREFIX + experimentId, variant);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Deterministically assigns a user/visitor to control or treatment.
 * Ensures consistent assignment across sessions with zero layout shift.
 */
export function assignVariant(
  userId?: string,
  experimentId: string = COMMUNITY_EXPERIMENT.id,
  overrideVariant?: ExperimentVariant | null
): ExperimentVariant {
  // Respect QA override if provided or stored
  const explicitOverride = overrideVariant ?? getQAOverride(experimentId);
  if (explicitOverride) {
    return explicitOverride;
  }

  const subject = userId || getVisitorId();
  const hashVal = fnv1a(`${subject}_${experimentId}`);
  const bucket = hashVal % 100; // 0 to 99

  // 50% split: 0-49 -> control, 50-99 -> treatment
  return bucket < 50 ? "control" : "treatment";
}
