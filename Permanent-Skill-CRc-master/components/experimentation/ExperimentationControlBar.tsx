"use client";

import { useEffect, useState } from "react";
import { FlaskConical, TrendingUp, CheckCircle, AlertTriangle, RefreshCw, X, ChevronRight, BarChart2 } from "lucide-react";
import { getQAOverride, setQAOverride } from "@/lib/experimentation/bucketing";
import { COMMUNITY_EXPERIMENT } from "@/lib/experimentation/config";
import type { ExperimentSummary } from "@/lib/experimentation/stats";
import type { ExperimentVariant } from "@/lib/types";

interface Props {
  currentVariant: ExperimentVariant;
  onVariantChange: (v: ExperimentVariant) => void;
}

export function ExperimentationControlBar({ currentVariant, onVariantChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ExperimentSummary | null>(null);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/experiment/stats?experimentId=${COMMUNITY_EXPERIMENT.id}`);
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (modalOpen) {
      fetchStats();
    }
  }, [modalOpen]);

  function handleSelectVariant(variant: ExperimentVariant) {
    setQAOverride(COMMUNITY_EXPERIMENT.id, variant);
    onVariantChange(variant);
  }

  async function handleSimulate() {
    setLoading(true);
    try {
      await fetch("/api/experiment/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_sample" }),
      });
      await fetchStats();
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    try {
      await fetch("/api/experiment/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      await fetchStats();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating QA / Experimentation Pill Badge */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl border border-zinc-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
          <FlaskConical size={15} className="text-primary animate-pulse" />
          <span className="hidden sm:inline">A/B Test:</span>
        </div>

        {/* Toggle Pills */}
        <div className="flex rounded-xl bg-zinc-100 p-0.5 text-xs font-medium">
          <button
            onClick={() => handleSelectVariant("control")}
            className={`rounded-lg px-2.5 py-1 transition ${
              currentVariant === "control"
                ? "bg-white font-bold text-zinc-950 shadow-xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            A (Control)
          </button>
          <button
            onClick={() => handleSelectVariant("treatment")}
            className={`rounded-lg px-2.5 py-1 transition ${
              currentVariant === "treatment"
                ? "bg-amber-400 font-bold text-zinc-950 shadow-xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            B (Treatment)
          </button>
        </div>

        {/* Open Stats Modal */}
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition"
          title="Open Data Science Dashboard"
        >
          <BarChart2 size={13} />
          <span>Stats</span>
        </button>
      </div>

      {/* Experimentation Statistical Dashboard Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical size={20} className="text-primary" />
                  <h2 className="text-lg font-bold text-zinc-900">
                    A/B Experimentation & Statistical Report
                  </h2>
                </div>
                <p className="mt-1 text-xs text-zinc-500 font-mono">
                  ID: {COMMUNITY_EXPERIMENT.id} | Status: ACTIVE (50/50 Split)
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X size={18} />
              </button>
            </div>

            {loading && !stats ? (
              <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
                <RefreshCw size={18} className="animate-spin mr-2" /> Computing statistical models...
              </div>
            ) : stats ? (
              <div className="mt-5 space-y-5">
                {/* Decision Verdict Banner */}
                <div
                  className={`rounded-2xl p-4 border ${
                    stats.primaryMetric.verdict === "Winner"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                      : stats.srm.hasSrm
                      ? "bg-red-50/80 border-red-200 text-red-950"
                      : "bg-blue-50/80 border-blue-200 text-blue-950"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {stats.primaryMetric.verdict === "Winner" ? (
                      <CheckCircle size={16} className="text-emerald-600" />
                    ) : stats.srm.hasSrm ? (
                      <AlertTriangle size={16} className="text-red-600" />
                    ) : (
                      <TrendingUp size={16} className="text-blue-600" />
                    )}
                    <span>Executive Verdict</span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-relaxed">
                    {stats.overallVerdict}
                  </p>
                </div>

                {/* Primary Metric: Post Creation Conversion Rate (PCR) */}
                <div className="rounded-2xl border border-zinc-200/90 p-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Primary OEC: {stats.primaryMetric.metricName}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        stats.primaryMetric.isStatisticallySignificant
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {stats.primaryMetric.isStatisticallySignificant
                        ? "Significant (p < 0.05)"
                        : "Not Significant Yet"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {/* Control */}
                    <div className="rounded-xl bg-zinc-50 p-3">
                      <p className="text-xs font-semibold text-zinc-500">Variant A (Control)</p>
                      <p className="mt-1 text-2xl font-black text-zinc-900">
                        {(stats.primaryMetric.controlRate * 100).toFixed(1)}%
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {stats.primaryMetric.controlCount} conversions / {stats.primaryMetric.controlTotal} users
                      </p>
                    </div>

                    {/* Treatment */}
                    <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200/60">
                      <p className="text-xs font-semibold text-amber-900">Variant B (Treatment)</p>
                      <p className="mt-1 text-2xl font-black text-zinc-900">
                        {(stats.primaryMetric.treatmentRate * 100).toFixed(1)}%
                      </p>
                      <p className="mt-0.5 text-xs text-amber-800">
                        {stats.primaryMetric.treatmentCount} conversions / {stats.primaryMetric.treatmentTotal} users
                      </p>
                    </div>
                  </div>

                  {/* Statistical Details Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-zinc-100 pt-3 text-xs">
                    <div>
                      <span className="text-zinc-400 block">Relative Lift</span>
                      <span className={`font-bold text-sm ${stats.primaryMetric.relativeLift > 0 ? "text-emerald-600" : "text-zinc-800"}`}>
                        {stats.primaryMetric.relativeLift > 0 ? "+" : ""}
                        {stats.primaryMetric.relativeLift}%
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block">P-Value (2-tailed)</span>
                      <span className="font-mono font-bold text-sm text-zinc-800">
                        {stats.primaryMetric.pValue.toFixed(4)}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block">Z-Score</span>
                      <span className="font-mono font-bold text-sm text-zinc-800">
                        {stats.primaryMetric.zScore.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-400 block">95% Conf. Interval</span>
                      <span className="font-mono text-zinc-700 text-[11px] block mt-0.5">
                        [{(stats.primaryMetric.ci95Lower * 100).toFixed(1)}%, {(stats.primaryMetric.ci95Upper * 100).toFixed(1)}%]
                      </span>
                    </div>
                  </div>
                </div>

                {/* SRM & Secondary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* SRM Check */}
                  <div className="rounded-xl border border-zinc-200 p-3">
                    <p className="font-bold text-zinc-800 mb-1">Sample Ratio Mismatch (SRM)</p>
                    <p className="text-zinc-500">
                      Ratio: {stats.srm.controlExposures} vs {stats.srm.treatmentExposures} (Expected 50/50)
                    </p>
                    <p className="mt-1 font-mono text-zinc-600">
                      χ² = {stats.srm.chiSquare} | p = {stats.srm.pValue}
                    </p>
                    <span
                      className={`inline-block mt-2 font-bold px-2 py-0.5 rounded ${
                        stats.srm.hasSrm
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {stats.srm.hasSrm ? "⚠️ SRM Detected" : "✓ SRM Passed (No Bias)"}
                    </span>
                  </div>

                  {/* Secondary: Composer Open Rate */}
                  <div className="rounded-xl border border-zinc-200 p-3">
                    <p className="font-bold text-zinc-800 mb-1">Composer Open Rate</p>
                    <p className="text-zinc-600">
                      Control: {(stats.secondaryMetrics.composerOpenRate.controlRate * 100).toFixed(1)}% | 
                      Treatment: {(stats.secondaryMetrics.composerOpenRate.treatmentRate * 100).toFixed(1)}%
                    </p>
                    <p className={`mt-1 font-bold ${stats.secondaryMetrics.composerOpenRate.relativeLift > 0 ? "text-emerald-600" : "text-zinc-600"}`}>
                      Lift: {stats.secondaryMetrics.composerOpenRate.relativeLift > 0 ? "+" : ""}
                      {stats.secondaryMetrics.composerOpenRate.relativeLift}%
                    </p>
                  </div>
                </div>

                {/* Simulation & Controls for QA Verification */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSimulate}
                      disabled={loading}
                      className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition disabled:opacity-50"
                    >
                      🧪 Seed Synthetic Sample (200 Users)
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
                    >
                      Reset Telemetry
                    </button>
                  </div>

                  <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
                  >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
