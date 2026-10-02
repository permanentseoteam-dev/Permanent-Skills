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
        setError(result.error || "Could not submit.");
        return;
      }
      router.replace(result.next || "/pending");
    } catch {
      setError("Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Application" subtitle="Admin reviews every request before full access is granted">
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Full name">
          <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
        </Field>
        <Field label="Phone Number">
          <input className={inputClass} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country">
            <input className={inputClass} value={form.country} onChange={(e) => set("country", e.target.value)} required />
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </Field>
        </div>
        <Field label="Website (optional)">
          <input className={inputClass} value={form.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
        <Field label="What do you want to achieve here?">
          <textarea className={`${inputClass} min-h-[90px]`} value={form.goals} onChange={(e) => set("goals", e.target.value)} required />
        </Field>
        <Field label="How did you hear about us?">
          <input className={inputClass} value={form.howHeard} onChange={(e) => set("howHeard", e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <PrimaryButton type="submit" className="w-full" disabled={busy}>
          {busy ? "Submitting..." : "Submit for approval"}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
