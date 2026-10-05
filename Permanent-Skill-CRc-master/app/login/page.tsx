"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, Check, LogOut, Shield, Sparkles, Star, UserPlus, UserRound, Users } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { useApp } from "@/components/AppProvider";
import { Avatar, Field, PasswordInput, PrimaryButton, UserRoleBadge, inputClass } from "@/components/ui";
import type { Role } from "@/lib/types";

function LoginForm() {
  const { user, login, logout, quickSwitchRole } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const isInvited = searchParams.get("invited") === "true" || !!ref;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<Role | null>(null);

  async function handleQuickRole(role: Role) {
    if (busy || switchingRole) return;
    setSwitchingRole(role);
    setError("");
    try {
      const res = await quickSwitchRole(role);
      if (!res.ok) {
        setError(res.error || "Could not switch role.");
        return;
      }
      router.replace(res.next || (role === "admin" ? "/admin" : "/community"));
    } catch {
      setError("Could not switch role. Please try manual login.");
    } finally {
      setSwitchingRole(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await login(email, password, rememberMe);
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
          : "Log in or choose a role to access Permanent Skill Strategy"
      }
    >
      {/* 1. Active Session Prompt (if user is already logged in) */}
      {user && (
        <div className="mb-5 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-indigo-50/40 to-primary/10 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Avatar user={user} size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-zinc-900 truncate">{user.name}</span>
                <UserRoleBadge role={user.role} isPremium={user.isPremium} size="xs" />
              </div>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-zinc-600 leading-relaxed">
            You are currently signed in as <strong>{user.role}</strong>. Would you like to continue to your dashboard, or log in with another account?
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(user.role === "admin" ? "/admin" : "/community")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition cursor-pointer"
            >
              <span>Continue as {user.name.split(" ")[0]}</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                setEmail("");
                setPassword("");
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              <LogOut size={13} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Quick Demo Role Selector */}
      <div className="mb-5 rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            ⚡ Quick Role Login / Switcher
          </span>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            1-Click Login
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!!switchingRole}
            onClick={() => handleQuickRole("admin")}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white p-2.5 text-left hover:border-zinc-900 hover:shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-amber-400">
              <Shield size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900">Admin</p>
              <p className="text-[10px] text-zinc-500 truncate">Full management</p>
            </div>
          </button>

          <button
            type="button"
            disabled={!!switchingRole}
            onClick={() => handleQuickRole("manager")}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white p-2.5 text-left hover:border-blue-600 hover:shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Star size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900">Manager</p>
              <p className="text-[10px] text-zinc-500 truncate">Student support</p>
            </div>
          </button>

          <button
            type="button"
            disabled={!!switchingRole}
            onClick={() => handleQuickRole("member")}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white p-2.5 text-left hover:border-primary hover:shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <UserRound size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900">Student</p>
              <p className="text-[10px] text-zinc-500 truncate">Member access</p>
            </div>
          </button>

          <button
            type="button"
            disabled={!!switchingRole}
            onClick={() => handleQuickRole("team_member")}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white p-2.5 text-left hover:border-emerald-600 hover:shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900">Team Member</p>
              <p className="text-[10px] text-zinc-500 truncate">Staff channel</p>
            </div>
          </button>
        </div>

        {switchingRole && (
          <p className="text-center text-xs font-semibold text-primary animate-pulse">
            Logging in as {switchingRole}...
          </p>
        )}
      </div>

      <div className="relative my-4 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <span className="relative bg-white px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Or sign in manually
        </span>
      </div>

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
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="e.g. admin@permanentseo.com"
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </Field>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <span>Remember me</span>
          </label>
        </div>

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

