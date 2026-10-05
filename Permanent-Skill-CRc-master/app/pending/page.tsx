"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Hourglass,
  LogOut,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { PrimaryButton } from "@/components/ui";
import { AuthCard } from "@/components/AuthCard";

export default function PendingPage() {
  const { user, refresh, logout } = useApp();
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const isApproved =
    user?.status === "approved" ||
    user?.role === "admin" ||
    user?.role === "manager";

  // Real-time automatic polling every 3.5 seconds
  useEffect(() => {
    if (isApproved) return;

    const interval = setInterval(async () => {
      await refresh();
      setLastChecked(new Date());
    }, 3500);

    return () => clearInterval(interval);
  }, [refresh, isApproved]);

  // Automatic redirect upon approval
  useEffect(() => {
    if (!isApproved) return;

    const timer = setTimeout(() => {
      router.replace("/community");
    }, 2000);

    return () => clearTimeout(timer);
  }, [isApproved, router]);

  async function handleManualCheck() {
    setIsChecking(true);
    try {
      await refresh();
      setLastChecked(new Date());
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  }

  function handleReload() {
    if (isApproved) {
      window.location.href = "/community";
    } else {
      window.location.reload();
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  // Render Approved State
  if (isApproved) {
    return (
      <AuthCard
        title="Application Approved!"
        subtitle="Welcome to Permanent Skill Strategy"
      >
        <div className="space-y-3.5 sm:space-y-4">
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/90 p-4 sm:p-5 text-center shadow-xs">
            <div className="mx-auto mb-2.5 sm:mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50">
              <CheckCircle2 size={28} className="sm:w-8 sm:h-8 text-emerald-600" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200 mb-2">
              <Sparkles size={12} className="text-emerald-600" /> Status: Approved & Active
            </div>

            <h2 className="text-sm sm:text-base font-bold text-emerald-950">
              Congratulations, {user?.name || "Member"}!
            </h2>
            <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed px-1 sm:px-2">
              Your application has been approved by the admin team. You now have full access to our community, courses, and resources.
            </p>

            <div className="mt-3.5 sm:mt-4 rounded-xl bg-white/90 p-2.5 sm:p-3 border border-emerald-200 text-xs text-emerald-900 font-medium">
              <p className="animate-pulse text-[11px] sm:text-xs">⚡ Redirecting you to your dashboard automatically...</p>
              <p className="mt-1 text-[10px] sm:text-[11px] text-emerald-700">
                If your window does not redirect in a few seconds, reload your window or click below:
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1 sm:pt-2">
            <PrimaryButton
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-xs active:scale-[0.99]"
              onClick={() => router.replace("/community")}
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={15} />
            </PrimaryButton>

            <button
              type="button"
              onClick={handleReload}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} className="text-zinc-500" />
              <span>Reload Window</span>
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  // Render Pending State with "Be Patient" Message
  return (
    <AuthCard
      title="Application Under Review"
      subtitle="We review every applicant before granting full platform access"
    >
      <div className="space-y-3.5 sm:space-y-4">
        {/* Main "Be Patient" Card */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/90 to-amber-100/50 p-4 sm:p-5 text-center shadow-xs">
          <div className="mx-auto mb-2.5 sm:mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-4 ring-amber-50">
            <Hourglass size={24} className="sm:w-7 sm:h-7 text-amber-600 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/70 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold text-amber-900 ring-1 ring-amber-300/80 mb-2">
            <RefreshCw size={11} className={isChecking ? "animate-spin text-amber-700" : "text-amber-700"} /> Status: Pending Review
          </div>

          <h2 className="text-sm sm:text-base font-bold text-amber-950 px-1">
            Please be patient while we review your request
          </h2>

          <p className="mt-1.5 sm:mt-2 text-xs text-amber-900 leading-relaxed text-left sm:text-center px-1">
            Thank you for applying, <strong className="font-semibold text-amber-950">{user?.name || "there"}</strong>! Our administrative team manually reviews each application to keep the community high-signal, engaging, and valuable.
          </p>

          {/* Live Sync Status Pill */}
          <div className="mt-3.5 sm:mt-4 rounded-xl bg-white/85 p-2.5 sm:p-3 border border-amber-200 text-left text-xs text-amber-900 space-y-1.5">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 text-[10px] sm:text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live Auto-Sync Active
              </span>
              <span className="text-[10px] text-zinc-500">
                Last checked: {lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-normal">
              This window automatically checks for updates in real time. Once approved, you will be redirected to the dashboard automatically.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isChecking}
            className="w-full rounded-xl bg-primary py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white hover:bg-primary-dark transition cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 active:scale-[0.99]"
          >
            <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
            <span>{isChecking ? "Checking Approval Status..." : "Check Status Now"}</span>
          </button>

          <button
            type="button"
            onClick={handleReload}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} className="text-zinc-500" />
            <span>Reload Window</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </AuthCard>
  );
}
