"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Plus,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, Field, PrimaryButton, inputClass } from "@/components/ui";

const TOPIC_SUGGESTIONS = [
  "AI & Autonomous Agents",
  "Automations (Make & n8n)",
  "Client Acquisition & Growth",
  "Web & App Development",
  "VIP Mastermind Cohort",
  "Digital Products & Assets",
];

export default function CreateCommunityPage() {
  const router = useRouter();
  const { createCommunity, user } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStaff = user?.role === "admin" || user?.role === "manager";

  // Auto-generate preview slug
  const previewSlug = useMemo(() => {
    if (!name.trim()) return "your-community-slug";
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [name]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!name.trim() || name.trim().length < 3) {
      setError("Community name must be at least 3 characters long.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await createCommunity({
        name: name.trim(),
        description: description.trim() || `${name.trim()} community discussion hub and resources.`,
        isPrivate,
      });

      if (!result.ok) {
        setError(result.error || "Could not create community. A group with this name may already exist.");
        setBusy(false);
        return;
      }

      // Successfully created and activated
      router.push("/community");
    } catch {
      setError("An unexpected error occurred while setting up the community.");
      setBusy(false);
    }
  }

  // Access check: only admin and manager roles can create communities
  if (user && !isStaff) {
    return (
      <div className="mx-auto max-w-lg px-2 sm:px-0 pt-6 sm:pt-12 text-center space-y-4">
        <Card className="p-6 sm:p-8 border-amber-200 bg-amber-50/50 space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shadow-2xs">
            <Lock size={26} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-950">Staff Permission Required</h2>
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed max-w-md mx-auto">
              Creating new community hubs is reserved for Community Administrators and Operations Managers. As an active Academy member, you can explore, join, and interact across all available public and enrolled groups.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <PrimaryButton
              onClick={() => router.push("/discover")}
              className="w-full sm:w-auto text-xs font-bold gap-1.5 justify-center rounded-xl px-5 py-2.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Compass size={14} /> Explore All Communities
            </PrimaryButton>
            <button
              onClick={() => router.push("/community")}
              className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              Return to Community Feed
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/discover"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition"
            >
              <ArrowLeft size={13} /> Discover Hubs
            </Link>
            <span className="text-zinc-300">•</span>
            <span className="rounded-md bg-zinc-900 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Community Builder
            </span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-zinc-950">Create a New Community</h1>
          <p className="mt-0.5 text-xs text-zinc-500 leading-normal max-w-2xl">
            Launch a dedicated discussion space for collaboration, live workshop cohorts, or specialized skill development.
          </p>
        </div>

        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition self-start sm:self-auto cursor-pointer"
        >
          <Compass size={14} className="text-zinc-400" />
          <span>Browse Hubs</span>
        </Link>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-2xl p-4 text-xs font-semibold bg-red-50 text-red-800 border border-red-200 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN / STACKED CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM COLUMN (7 COLS ON DESKTOP) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 sm:p-7 border border-zinc-200 shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Layers size={16} className="text-primary" /> Hub Configuration
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set the name, mission, and privacy permissions for your group.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
              {/* Community Name Field */}
              <Field label="Community Name *">
                <input
                  className={inputClass}
                  placeholder="e.g. AI Autonomous Agents & Automations"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={64}
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span className="truncate">URL: /community?c={previewSlug}</span>
                  <span className="shrink-0">{name.length}/64</span>
                </div>
              </Field>

              {/* Quick Topic Suggestions */}
              <div>
                <span className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Quick Focus Topics & Specializations:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {TOPIC_SUGGESTIONS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        if (!name) setName(topic);
                        else if (!description.includes(topic)) {
                          setDescription((prev) => (prev ? `${prev} Focused on ${topic}.` : `Dedicated space for ${topic}.`));
                        }
                      }}
                      className="rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 transition active:scale-95 cursor-pointer"
                    >
                      + {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Community Description Field */}
              <Field label="Description & Mission *">
                <textarea
                  className={`${inputClass} min-h-[110px] leading-relaxed`}
                  placeholder="What will members learn, build, or discuss in this community? Outline the objectives, guidelines, and benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={300}
                />
                <div className="mt-1 flex items-center justify-end text-[11px] text-zinc-400">
                  <span>{description.length}/300 characters</span>
                </div>
              </Field>

              {/* Privacy & Access Controls */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">Privacy & Access Rules *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition cursor-pointer active:scale-98 ${
                      isPrivate
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-zinc-950 shadow-2xs"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <div className={`p-1.5 rounded-lg ${isPrivate ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600"}`}>
                        <Lock size={14} />
                      </div>
                      <span>Private / Invitation</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-normal pl-0.5">
                      Restricted to approved members or VIP students. Discussions are private.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition cursor-pointer active:scale-98 ${
                      !isPrivate
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-zinc-950 shadow-2xs"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <div className={`p-1.5 rounded-lg ${!isPrivate ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600"}`}>
                        <Globe size={14} />
                      </div>
                      <span>Public Open Space</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-normal pl-0.5">
                      Open to all registered Academy members. Discussions appear in the public catalog.
                    </p>
                  </button>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => router.push("/discover")}
                  className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer order-2 sm:order-1"
                >
                  Cancel
                </button>
                <PrimaryButton
                  type="submit"
                  disabled={busy}
                  className="w-full sm:w-auto justify-center rounded-xl px-6 py-2.5 text-xs font-bold gap-1.5 shadow-sm active:scale-95 cursor-pointer order-1 sm:order-2"
                >
                  {busy ? "Launching Community..." : "Launch Community Hub"}
                </PrimaryButton>
              </div>
            </form>
          </Card>
        </div>

        {/* PREVIEW & FEATURES COLUMN (5 COLS ON DESKTOP) */}
        <div className="lg:col-span-5 space-y-6">
          {/* LIVE PREVIEW CARD */}
          <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-4 bg-gradient-to-b from-white to-zinc-50/60">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" /> Live Hub Preview
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 font-mono">
                Catalog Display
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white font-black text-lg shadow-sm">
                    {name.trim() ? name.trim().charAt(0).toUpperCase() : "P"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-base text-zinc-950 truncate">
                      {name.trim() || "Community Name"}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono truncate">
                      /{previewSlug}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                    isPrivate
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {isPrivate ? <Lock size={10} /> : <Globe size={10} />}
                  <span>{isPrivate ? "Private" : "Public"}</span>
                </span>
              </div>

              <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
                {description.trim() ||
                  "A brief overview of your community goals, mission, and member collaboration will appear here."}
              </p>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                  <Users size={12} className="text-zinc-400" /> 1 Member (Founder)
                </span>
                <span className="rounded-lg bg-primary/10 text-primary font-bold px-2.5 py-1 text-[11px]">
                  Active
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 text-center leading-normal">
              Once created, you will be automatically added as the community founder and switched to its live discussion feed.
            </p>
          </Card>

          {/* COMMUNITY CAPABILITIES CHECKLIST */}
          <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm space-y-3 bg-zinc-50/50">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <Zap size={14} className="text-primary" /> Included with Every Community Hub
            </h3>
            <div className="space-y-2 text-xs text-zinc-600">
              <div className="flex items-start gap-2">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Dedicated Discussion & Posts Feed with 5 categorized topics (Chat, Wins, Replays, Team, Reviews)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Integrated live meeting room & calendar event synchronization</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Moderation controls for post approvals, comments, and member permissions</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Seamless inclusion in the global mobile & desktop Community Switcher</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
