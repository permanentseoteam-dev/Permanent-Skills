import type { ExperimentEvent, ExperimentVariant } from "@/lib/types";

/**
 * Standard Normal Cumulative Distribution Function (Phi).
 * Uses high-precision Hart approximation (error < 1e-7).
 */
export function normalCdf(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2.0);
  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * erf);
}

/**
 * Chi-Square Cumulative Distribution Function for 1 degree of freedom.
 * For df=1, Chi-Square is equivalent to Z^2 where Z ~ N(0,1).
 * Therefore, p-value = 2 * (1 - normalCdf(sqrt(chi2))).
 */
export function chiSquarePValueDf1(chi2: number): number {
  if (chi2 <= 0) return 1;
  const z = Math.sqrt(chi2);
  return 2 * (1 - normalCdf(z));
}

export interface MetricAnalysis {
  metricName: string;
  controlCount: number;
  treatmentCount: number;
  controlTotal: number;
  treatmentTotal: number;
  controlRate: number; // 0 to 1
  treatmentRate: number; // 0 to 1
  relativeLift: number; // in %
  absoluteDifference: number;
  standardError: number;
  zScore: number;
  pValue: number;
  ci95Lower: number;
  ci95Upper: number;
  isStatisticallySignificant: boolean;
  verdict: "Winner" | "Inconclusive" | "Negative";
}

export interface SrmAnalysis {
  controlExposures: number;
  treatmentExposures: number;
  expectedRatio: number;
  chiSquare: number;
  pValue: number;
  hasSrm: boolean; // Flagged if p < 0.01
}

export interface ExperimentSummary {
  experimentId: string;
  totalEvents: number;
  uniqueUsers: number;
  srm: SrmAnalysis;
  primaryMetric: MetricAnalysis; // Post Creation Conversion Rate
  secondaryMetrics: {
    composerOpenRate: MetricAnalysis;
    engagementRate: MetricAnalysis;
  };
  overallVerdict: string;
}

export function calculateExperimentStats(events: ExperimentEvent[]): ExperimentSummary {
  // 1. Group events by visitor/user to ensure unique participant analysis
  const controlVisitors = new Set<string>();
  const treatmentVisitors = new Set<string>();

  const controlPosters = new Set<string>();
  const treatmentPosters = new Set<string>();

  const controlOpeners = new Set<string>();
  const treatmentOpeners = new Set<string>();

  const controlEngagers = new Set<string>();
  const treatmentEngagers = new Set<string>();

  for (const ev of events) {
    const participant = ev.userId || ev.visitorId;

    if (ev.variant === "control") {
      controlVisitors.add(participant);
      if (ev.eventName === "post_submit") controlPosters.add(participant);
      if (ev.eventName === "composer_open") controlOpeners.add(participant);
      if (ev.eventName === "like_click" || ev.eventName === "comment_submit" || ev.eventName === "post_submit") {
        controlEngagers.add(participant);
      }
    } else if (ev.variant === "treatment") {
      treatmentVisitors.add(participant);
      if (ev.eventName === "post_submit") treatmentPosters.add(participant);
      if (ev.eventName === "composer_open") treatmentOpeners.add(participant);
      if (ev.eventName === "like_click" || ev.eventName === "comment_submit" || ev.eventName === "post_submit") {
        treatmentEngagers.add(participant);
      }
    }
  }

  const nC = controlVisitors.size;
  const nT = treatmentVisitors.size;

  // 2. SRM (Sample Ratio Mismatch) Check (50/50 expected)
  const totalExposures = nC + nT;
  const expectedPerVariant = totalExposures / 2;
  let chiSquare = 0;
  let srmPValue = 1;

  if (totalExposures > 0) {
    chiSquare =
      Math.pow(nC - expectedPerVariant, 2) / expectedPerVariant +
      Math.pow(nT - expectedPerVariant, 2) / expectedPerVariant;
    srmPValue = chiSquarePValueDf1(chiSquare);
  }

  const srm: SrmAnalysis = {
    controlExposures: nC,
    treatmentExposures: nT,
    expectedRatio: 0.5,
    chiSquare: Number(chiSquare.toFixed(4)),
    pValue: Number(srmPValue.toFixed(4)),
    hasSrm: totalExposures >= 20 && srmPValue < 0.01,
  };

  // 3. Helper to compute two-proportion Z-test
  function analyzeProportion(
    name: string,
    cC: number,
    cT: number,
    totC: number,
    totT: number
  ): MetricAnalysis {
    const pC = totC > 0 ? cC / totC : 0;
    const pT = totT > 0 ? cT / totT : 0;
    const absDiff = pT - pC;
    const relLift = pC > 0 ? ((pT - pC) / pC) * 100 : pT > 0 ? 100 : 0;

    let z = 0;
    let pVal = 1;
    let seDiff = 0;

    if (totC > 0 && totT > 0) {
      // Pooled proportion for hypothesis testing
      const pPool = (cC + cT) / (totC + totT);
      const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / totC + 1 / totT));

      // Separate standard error for confidence interval
      seDiff = Math.sqrt((pC * (1 - pC)) / totC + (pT * (1 - pT)) / totT);

      if (sePool > 0) {
        z = absDiff / sePool;
        pVal = 2 * (1 - normalCdf(Math.abs(z)));
      }
    }

    const isSig = totC >= 5 && totT >= 5 && pVal < 0.05;
    let verdict: "Winner" | "Inconclusive" | "Negative" = "Inconclusive";
    if (isSig) {
      verdict = absDiff > 0 ? "Winner" : "Negative";
    }

    return {
      metricName: name,
      controlCount: cC,
      treatmentCount: cT,
      controlTotal: totC,
      treatmentTotal: totT,
      controlRate: Number(pC.toFixed(4)),
      treatmentRate: Number(pT.toFixed(4)),
      relativeLift: Number(relLift.toFixed(2)),
      absoluteDifference: Number(absDiff.toFixed(4)),
      standardError: Number(seDiff.toFixed(4)),
      zScore: Number(z.toFixed(3)),
      pValue: Number(pVal.toFixed(4)),
      ci95Lower: Number((absDiff - 1.96 * seDiff).toFixed(4)),
      ci95Upper: Number((absDiff + 1.96 * seDiff).toFixed(4)),
      isStatisticallySignificant: isSig,
      verdict,
    };
  }

  // Primary OEC: Post Creation Rate
  const primaryMetric = analyzeProportion(
    "Post Creation Rate (PCR)",
    controlPosters.size,
    treatmentPosters.size,
    nC,
    nT
  );

  // Secondary: Composer Open Rate
  const composerOpenRate = analyzeProportion(
    "Composer Open Rate",
    controlOpeners.size,
    treatmentOpeners.size,
    nC,
    nT
  );

  // Secondary: Total Engagement Rate
  const engagementRate = analyzeProportion(
    "Total Engagement Rate",
    controlEngagers.size,
    treatmentEngagers.size,
    nC,
    nT
  );

  // Overall experiment verdict synthesis
  let overallVerdict = "Data Collection In Progress (Underpowered)";
  if (srm.hasSrm) {
    overallVerdict = "CRITICAL: Sample Ratio Mismatch (SRM) Detected! Check assignment pipeline.";
  } else if (primaryMetric.isStatisticallySignificant) {
    if (primaryMetric.verdict === "Winner") {
      overallVerdict = `Statistically Significant Win! Treatment achieved a +${primaryMetric.relativeLift}% lift in Post Creation (p = ${primaryMetric.pValue}).`;
    } else {
      overallVerdict = `Statistically Significant Loss. Treatment resulted in a ${primaryMetric.relativeLift}% drop (p = ${primaryMetric.pValue}). Recommend rollback.`;
    }
  } else if (nC + nT >= 50) {
    overallVerdict = `Inconclusive with ${nC + nT} participants. No statistically significant difference observed yet (p = ${primaryMetric.pValue}).`;
  }

  return {
    experimentId: "EXP-COMM-COMPOSER-V1",
    totalEvents: events.length,
    uniqueUsers: nC + nT,
    srm,
    primaryMetric,
    secondaryMetrics: {
      composerOpenRate,
      engagementRate,
    },
    overallVerdict,
  };
}
