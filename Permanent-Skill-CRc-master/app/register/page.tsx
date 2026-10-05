"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { useApp } from "@/components/AppProvider";
import { Field, PrimaryButton, PasswordInput, inputClass } from "@/components/ui";
import { trackAffiliateClick } from "@/lib/actions";

import { ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const { register } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ref) return;
    void trackAffiliateClick(ref).catch(() => undefined);
  }, [ref]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setError("Passwords do not match. Please re-enter them carefully.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await register(name, email, password, phone, notes, ref || undefined);
      if (!result.ok) {
        setError(result.error || "Could not create account.");
        return;
      }
      router.replace(result.next || "/apply");
    } catch {
      setError("Could not create account. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Complete this quick registration to begin your member application"
      stepBadge="Step 1 of 2 · Account Registration"
    >
      <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
        <Field label="Full name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Email Address">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Phone Number">
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +1 (555) 019-2834"
            autoComplete="tel"
            required
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Password">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Field>

          <Field label="Confirm password">
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </Field>
        </div>

        <Field
          label="About yourself & previous experience"
          hint={`${notes.length}/800`}
        >
          <textarea
            className={`${inputClass} min-h-[85px] sm:min-h-[95px] resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Briefly tell us who you are, what skills you have, or what you are looking to learn..."
            minLength={10}
            maxLength={800}
            required
          />
        </Field>

        {ref && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50/90 border border-emerald-200/90 px-3 py-2 text-xs font-medium text-emerald-800">
            <Sparkles size={14} className="text-emerald-600 shrink-0" />
            <span>Referred with code <strong className="font-bold text-emerald-950">{ref}</strong></span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{error}</span>
              {error.toLowerCase().includes("already exists") && (
                <div className="mt-1">
                  <Link href="/login" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                    Log in to your existing account <ArrowRight size={12} />
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
          <span>{busy ? "Creating account..." : "Continue to Application"}</span>
          {!busy && <ArrowRight size={15} />}
        </PrimaryButton>
      </form>

      <p className="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-zinc-600">
        Already a member?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
