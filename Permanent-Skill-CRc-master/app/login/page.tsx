"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { useApp } from "@/components/AppProvider";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [memberType, setMemberType] = useState<"team" | "premium">("team");
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
    <AuthCard title="Welcome back" subtitle="Log in to Permanent Skill Strategy">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Member">
          <select
            className={inputClass}
            value={memberType}
            onChange={(e) => setMemberType(e.target.value as "team" | "premium")}
          >
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
      <p className="mt-4 text-center text-sm text-zinc-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-primary">
          Apply to join
        </Link>
      </p>
    </AuthCard>
  );
}
