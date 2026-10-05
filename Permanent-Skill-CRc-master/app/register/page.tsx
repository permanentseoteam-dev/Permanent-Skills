"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { useApp } from "@/components/AppProvider";
import { Field, PrimaryButton, PasswordInput, inputClass } from "@/components/ui";
import { trackAffiliateClick } from "@/lib/actions";

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
      setError("Passwords do not match.");
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
      setError("Could not create account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Then complete a short application for admin review">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </Field>
        <Field label="Email Address">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoComplete="tel"
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirm password">
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="NOTE: about yourself & previous knowledge">
          <textarea
            className={`${inputClass} min-h-[100px]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us who you are and what you already know."
            minLength={10}
            maxLength={800}
            required
          />
        </Field>
        {ref && <p className="text-xs text-primary">Referred with code {ref}</p>}
        {error && (
          <p className="text-sm text-red-600">
            {error}{" "}
            {error.toLowerCase().includes("already exists") && (
              <Link href="/login" className="font-semibold text-primary">
                Log in
              </Link>
            )}
          </p>
        )}
        <PrimaryButton type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating account..." : "Continue to application"}
        </PrimaryButton>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-primary">
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
