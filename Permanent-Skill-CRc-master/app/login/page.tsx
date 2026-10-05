"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  User,
  UserPlus,
  UserRound,
} from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { useApp } from "@/components/AppProvider";
import {
  Avatar,
  Field,
  PasswordInput,
  PrimaryButton,
  UserRoleBadge,
  inputClass,
} from "@/components/ui";

function LoginForm() {
  const { user, login, logout } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const isInvited = searchParams.get("invited") === "true" || !!ref;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  async function handleContinue() {
    if (!user) return;
    router.push(user.role === "admin" ? "/admin" : "/community");
  }

  async function handleSwitchAccount() {
    setShowManualForm(true);
    setError("");
  }

  async function handleLogoutAndSwitch() {
    setBusy(true);
    try {
      await logout();
      setEmail("");
      setPassword("");
      setShowManualForm(true);
    } finally {
      setBusy(false);
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
        setError(result.error || "Invalid email or password.");
        return;
      }
      router.replace(result.next || "/community");
    } catch {
      setError("Could not log in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Google-style Choose an account card when user is already signed in
  const isAccountChooserActive = Boolean(user) && !showManualForm;

  return (
    <AuthCard
      title={
        isAccountChooserActive
          ? "Choose an account"
          : isInvited
          ? "You're Invited!"
          : "Sign in"
      }
      subtitle={
        isAccountChooserActive
          ? "to continue to Permanent Skill Strategy"
          : isInvited
          ? "Log in to your account or create a new one to join"
          : "Enter your credentials. Your role and permissions will be automatically detected."
      }
    >
      {/* GOOGLE-STYLE ACCOUNT CHOOSER CARD */}
      {isAccountChooserActive && user && (
        <div className="space-y-3.5 sm:space-y-4">
          <div className="group rounded-2xl border border-zinc-200/90 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <Avatar user={user} size={44} className="border-2 border-primary/20 shrink-0 sm:w-12 sm:h-12" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-zinc-950 truncate max-w-[140px] sm:max-w-none">{user.name}</span>
                  <UserRoleBadge role={user.role} isPremium={user.isPremium} size="xs" />
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-700 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Signed in</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 sm:mt-4 pt-3 sm:pt-3.5 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-primary-dark transition cursor-pointer active:scale-[0.99]"
              >
                <span className="truncate">Continue as {user.name.split(" ")[0]}</span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
              <button
                type="button"
                onClick={handleLogoutAndSwitch}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer disabled:opacity-50"
              >
                <LogOut size={13} className="shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50/80 transition cursor-pointer"
          >
            <UserRound size={15} className="text-zinc-500 shrink-0" />
            <span>Use another account</span>
          </button>
        </div>
      )}

      {/* STANDARD GOOGLE-STYLE EMAIL & PASSWORD LOGIN FORM */}
      {(!user || showManualForm) && (
        <>
          {user && (
            <div className="mb-3.5 sm:mb-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 rounded-xl bg-zinc-50/90 border border-zinc-200 px-3 py-2 text-xs">
              <span className="text-zinc-600 truncate max-w-full">
                Signed in as: <strong className="text-zinc-900">{user.email}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="font-bold text-primary hover:underline shrink-0 text-xs"
              >
                Back to saved account
              </button>
            </div>
          )}

          {isInvited && (
            <div className="mb-3.5 sm:mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 sm:p-3.5 text-xs text-emerald-800 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles size={14} className="text-emerald-600 shrink-0" />
                <span>Exclusive Invitation Access</span>
              </div>
              <p className="mt-1 text-emerald-700">
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

          <form onSubmit={onSubmit} className="space-y-3.5 sm:space-y-4">
            <Field label="Email address">
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="e.g. name@example.com"
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

            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 font-medium py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            {error && (
              <p className="text-xs sm:text-sm text-red-600 bg-red-50/80 border border-red-200 rounded-xl p-2.5 sm:p-3 leading-relaxed">
                {error}
              </p>
            )}

            <PrimaryButton type="submit" className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-bold" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </PrimaryButton>
          </form>

          <div className="mt-4 sm:mt-5 space-y-2 border-t border-zinc-100 pt-3.5 sm:pt-4 text-center">
            <p className="text-xs sm:text-sm text-zinc-600">
              New here?{" "}
              <Link
                href={`/register${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <UserPlus size={14} /> Create account & Apply to join
              </Link>
            </p>
          </div>
        </>
      )}
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
