"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Globe, Lock, Plus, Shield, Sparkles, Users } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, Field, PrimaryButton, inputClass } from "@/components/ui";

export default function CreateCommunityPage() {
  const router = useRouter();
  const { createCommunity, user } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const result = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        isPrivate,
      });

      if (!result.ok) {
        setError(result.error || "Could not create community.");
        return;
      }

      router.push("/discover");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const isStaff = user?.role === "admin" || user?.role === "manager";

  if (user && !isStaff) {
    return (
      <div className="mx-auto max-w-lg pt-8 text-center space-y-4 px-4">
        <Card className="p-8 border-amber-200 bg-amber-50/50 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Lock size={24} />
          </div>
          <h2 className="text-lg font-black text-zinc-900">Administrator Access Required</h2>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
            Community creation is reserved for verified Community Administrators and Operations Managers.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <PrimaryButton onClick={() => router.push("/discover")} className="w-full sm:w-auto text-xs px-4 py-2">
              Explore Communities
            </PrimaryButton>
            <button
              onClick={() => router.push("/community")}
              className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              Back to Feed
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-12">
      {/* Back Link */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition"
        >
          <ArrowLeft size={14} /> Back to Communities
        </Link>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">Create a Community Hub</h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Scaffold a dedicated group space for mastermind discussions, cohort projects, and live collaborative workshops.
        </p>
      </div>

      <Card className="p-5 sm:p-6 border border-zinc-200 shadow-sm bg-white">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Community Name *">
            <input
              className={inputClass}
              placeholder="e.g. Autonomous AI Agents Mastermind"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
            />
          </Field>

          <Field label="Description / Focus Area">
            <textarea
              className={`${inputClass} min-h-[90px]`}
              placeholder="What is the mission, core topics, and target audience for this group?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Privacy & Access Control
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition cursor-pointer ${
                  isPrivate
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Lock size={15} /> Private Mastermind
                </div>
                <span className="text-xs opacity-75 leading-relaxed">
                  Only enrolled and approved members can access posts and live sessions.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition cursor-pointer ${
                  !isPrivate
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Globe size={15} /> Public Community
                </div>
                <span className="text-xs opacity-75 leading-relaxed">
                  Open for all platform members to join, read discussions, and post.
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="pt-2">
            <PrimaryButton
              type="submit"
              disabled={busy || !name.trim()}
              className="w-full justify-center rounded-xl py-2.5 text-xs font-bold shadow-sm"
            >
              {busy ? "Creating Community..." : "Launch Community Hub"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
