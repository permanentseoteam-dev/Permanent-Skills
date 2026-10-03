"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Sparkles, UserPlus } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { useApp } from "@/components/AppProvider";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

function LoginForm() {
  const { login } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const isInvited = searchParams.get("invited") === "true" || !!ref;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [memberType, setMemberType] = useState<"admin" | "team" | "premium">("team");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await login(email, password, memberType);
      if (!result.ok) {
        setError(result.error || "Could not log in.");
        return;
      }
      router.replace(result.next || "/community");
    } catch {
      setError("Could not log in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={isInvited ? "You're Invited!" : "Welcome back"}
      subtitle={
        isInvited
          ? "Log in to your existing account or create a new one to join"
          : "Log in to Permanent Skill Strategy"
      }
    >
      {isInvited && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles size={14} className="text-emerald-600 shrink-0" />
            <span>Exclusive Invitation Access</span>
          </div>
          <p className="mt-1 text-emerald-700 leading-relaxed">
            Have an account? Log in below. If you are a new member,{" "}
            <Link
              href={`/register${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
              className="font-bold underline hover:text-emerald-950"
            >
              click here to create your account
            </Link>
            .
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Member">
          <select
            className={inputClass}
            value={memberType}
            onChange={(e) => setMemberType(e.target.value as "admin" | "team" | "premium")}
          >
            <option value="admin">Admin</option>
            <option value="team">Team member</option>
            <option value="premium">Premium member</option>
          </select>
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <PrimaryButton type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in..." : "Log in"}
        </PrimaryButton>
      </form>

      <div className="mt-5 space-y-2 border-t border-zinc-100 pt-4 text-center">
        <p className="text-sm text-zinc-600">
          New here?{" "}
          <Link
            href={`/register${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
            className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <UserPlus size={14} /> Create account & Apply to join
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
