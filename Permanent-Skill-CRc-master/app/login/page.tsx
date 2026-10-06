"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Clock,
  KeyRound,
  LogOut,
  Mail,
  Pause,
  Play,
  Shield,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  UserRound,
  X,
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
import type { Role } from "@/lib/types";

interface SavedAccount {
  email: string;
  name: string;
  role?: Role;
  isPremium?: boolean;
  avatarColor?: string;
  lastUsed: number;
}

const SAVED_ACCOUNTS_KEY = "pss_saved_accounts";

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
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Auto-login countdown timer state (4 seconds)
  const [countdown, setCountdown] = useState<number>(4);
  const [isAutoLoginPaused, setIsAutoLoginPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved accounts from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedAccount[];
        if (Array.isArray(parsed)) {
          setSavedAccounts(parsed.sort((a, b) => b.lastUsed - a.lastUsed));
        }
      }
    } catch {}
  }, []);

  // Save/update current user into saved accounts when signed in
  useEffect(() => {
    if (user && user.email) {
      const userEmail = user.email;
      setSavedAccounts((prev) => {
        const existingIdx = prev.findIndex((a) => a.email.toLowerCase() === userEmail.toLowerCase());
        const updatedItem: SavedAccount = {
          email: userEmail,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
          avatarColor: user.avatarColor,
          lastUsed: Date.now(),
        };
        let nextList: SavedAccount[];
        if (existingIdx >= 0) {
          nextList = [...prev];
          nextList[existingIdx] = updatedItem;
        } else {
          nextList = [updatedItem, ...prev];
        }
        try {
          localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(nextList));
        } catch {}
        return nextList;
      });
    }
  }, [user]);

  // Handle countdown for auto-redirect when an active session exists
  useEffect(() => {
    if (!user || showManualForm || isAutoLoginPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          const dest = user.role === "admin" ? "/admin" : "/community";
          router.replace(dest);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, showManualForm, isAutoLoginPaused, router]);

  function handleContinue() {
    if (!user) return;
    if (timerRef.current) clearInterval(timerRef.current);
    router.replace(user.role === "admin" ? "/admin" : "/community");
  }

  function handleCancelAutoLogin() {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAutoLoginPaused(true);
    setShowManualForm(true);
    setError("");
  }

  async function handleLogoutAndSwitch() {
    if (timerRef.current) clearInterval(timerRef.current);
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

  function handleSelectSavedAccount(account: SavedAccount) {
    setEmail(account.email);
    setPassword("");
    setError("");
  }

  function handleRemoveSavedAccount(e: React.MouseEvent, targetEmail: string) {
    e.stopPropagation();
    setSavedAccounts((prev) => {
      const nextList = prev.filter((a) => a.email.toLowerCase() !== targetEmail.toLowerCase());
      try {
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(nextList));
      } catch {}
      return nextList;
    });
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

  const isAutoLoginActive = Boolean(user) && !showManualForm;

  return (
    <AuthCard
      title={
        isAutoLoginActive
          ? "Welcome Back"
          : isInvited
          ? "You're Invited!"
          : "Sign in"
      }
      subtitle={
        isAutoLoginActive
          ? `Continuing to your session for ${user?.name}`
          : isInvited
          ? "Log in to your account or create a new one to join"
          : "Enter your credentials to access your dashboard and community."
      }
    >
      {/* AUTO-LOGIN COUNTDOWN CARD */}
      {isAutoLoginActive && user && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition hover:border-primary/40">
            {/* Countdown Progress Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-zinc-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((4 - countdown) / 4) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-3.5 sm:gap-4 mt-1">
              <Avatar user={user} size={48} className="border-2 border-primary/25 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-zinc-950 truncate">{user.name}</span>
                  <UserRoleBadge role={user.role} isPremium={user.isPremium} size="xs" />
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Auto-signing in in {countdown}s</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-primary-dark transition cursor-pointer active:scale-[0.99]"
              >
                <span>Continue now</span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
              <button
                type="button"
                onClick={handleCancelAutoLogin}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              >
                <UserRound size={14} className="shrink-0 text-zinc-500" />
                <span>Use another account</span>
              </button>
              <button
                type="button"
                onClick={handleLogoutAndSwitch}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 sm:py-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
                title="Sign out active session"
              >
                <LogOut size={13} className="shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD LOGIN FORM & REMEMBERED ACCOUNTS PICKER */}
      {(!user || showManualForm) && (
        <>
          {user && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-zinc-600 truncate">
                  Logged in as: <strong className="text-zinc-900">{user.email}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManualForm(false);
                  setCountdown(4);
                  setIsAutoLoginPaused(false);
                }}
                className="font-bold text-primary hover:underline shrink-0 text-xs cursor-pointer"
              >
                Resume session
              </button>
            </div>
          )}

          {/* SAVED / REMEMBERED ACCOUNTS QUICK CHIPS */}
          {savedAccounts.length > 0 && (
            <div className="mb-4 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Remembered Accounts on this Device
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                {savedAccounts.map((acc) => {
                  const isCurrentSelected = email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectSavedAccount(acc)}
                      className={`group relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition cursor-pointer ${
                        isCurrentSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-zinc-200 bg-zinc-50/60 hover:bg-white hover:border-zinc-300 shadow-2xs"
                      }`}
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white uppercase shadow-xs"
                        style={{ backgroundColor: acc.avatarColor || "#6366f1" }}
                      >
                        {acc.name?.slice(0, 2) || acc.email.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-900 truncate leading-tight">{acc.name || acc.email}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{acc.email}</p>
                      </div>
                      <span
                        onClick={(e) => handleRemoveSavedAccount(e, acc.email)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition rounded-md hover:bg-zinc-200/60"
                        title="Remove from saved accounts"
                      >
                        <X size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isInvited && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 sm:p-3.5 text-xs text-emerald-800 leading-relaxed">
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
                <span>Remember this device</span>
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
