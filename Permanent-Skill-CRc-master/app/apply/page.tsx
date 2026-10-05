"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Field, PrimaryButton, inputClass } from "@/components/ui";
import { AuthCard } from "@/components/AuthCard";
import type { Application } from "@/lib/types";

const empty: Application = {
  fullName: "",
  phone: "",
  country: "",
  city: "",
  profession: "",
  experience: "",
  website: "",
  goals: "",
  howHeard: "",
  notes: "",
};

import Link from "next/link";
import { ArrowRight, AlertCircle, Send, Sparkles } from "lucide-react";

export default function ApplyPage() {
  const { apply, user } = useApp();
  const router = useRouter();
  const [form, setForm] = useState<Application>({ ...empty, fullName: user?.name || "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      fullName: f.fullName || user.name || "",
      phone: f.phone || user.phone || "",
      notes: user.notes || f.notes || "",
    }));
  }, [user]);

  function set<K extends keyof Application>(key: K, value: Application[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apply(form);
      if (!result.ok) {
        setError(result.error || "Could not submit application.");
        return;
      }
      router.replace(result.next || "/pending");
    } catch {
      setError("Could not submit application. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Member Application"
      subtitle="Admin reviews every request before full platform access is granted"
      stepBadge="Step 2 of 2 · Application Details"
      maxWidth="max-w-md sm:max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name">
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Alex Morgan"
              autoComplete="name"
              required
            />
          </Field>

          <Field label="Phone Number">
            <input
              className={inputClass}
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              autoComplete="tel"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Country">
            <input
              className={inputClass}
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="e.g. United States"
              required
            />
          </Field>

          <Field label="City">
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="e.g. San Francisco"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Website or Portfolio" hint="Optional">
            <input
              className={inputClass}
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://yourportfolio.com"
            />
          </Field>

          <Field label="How did you hear about us?" hint="Optional">
            <input
              className={inputClass}
              value={form.howHeard}
              onChange={(e) => set("howHeard", e.target.value)}
              placeholder="e.g. YouTube, Twitter, Referral"
            />
          </Field>
        </div>

        <Field
          label="What do you want to achieve here?"
          hint={`${form.goals.length}/500`}
        >
          <textarea
            className={`${inputClass} min-h-[85px] sm:min-h-[105px] resize-y`}
            value={form.goals}
            onChange={(e) => set("goals", e.target.value)}
            placeholder="Tell us about your learning goals, current background, and what systems you want to build with our community..."
            maxLength={500}
            required
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{error}</span>
              {error.toLowerCase().includes("log in") && (
                <div className="mt-1">
                  <Link href="/login" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                    Log in here <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <PrimaryButton
          type="submit"
          className="w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          disabled={busy}
        >
          <span>{busy ? "Submitting application..." : "Submit for Admin Approval"}</span>
          {!busy && <Send size={14} />}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
