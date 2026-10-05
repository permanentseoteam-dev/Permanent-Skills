"use client";

import { useRouter } from "next/navigation";
import { Award, BookOpen, Crown, Flame, Lock, Trophy, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { LEVELS, getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";
import type { Course } from "@/lib/types";

interface LockedCourseModalProps {
  course: Course | null;
  open: boolean;
  onClose: () => void;
  onUpgradeClick?: () => void;
}

export function LockedCourseModal({
  course,
  open,
  onClose,
  onUpgradeClick,
}: LockedCourseModalProps) {
  const router = useRouter();
  const { user } = useApp();

  if (!open || !course) return null;

  const userPoints = user?.points || 0;
  const userLevel = getLevel(userPoints).level;
  const targetLevel = course.unlockLevel || 1;
  const targetLevelObj = LEVELS.find((l) => l.level === targetLevel);
  const pointsForTarget = targetLevelObj ? targetLevelObj.min : 0;
  const pointsNeeded = Math.max(0, pointsForTarget - userPoints);
  const isVipCourse = Boolean(
    course.isPremiumOnly ||
    course.badge?.toUpperCase() === "VIP" ||
    course.badge?.toUpperCase() === "PREMIUM"
  );

  const glow = course.glowColor || "yellow";
  const watermark = course.watermark || `> ${course.slug}_`;

  function handleLeaderboardClick() {
    onClose();
    router.push("/leaderboards");
  }

  function handleAboutCourseClick() {
    if (!course) return;
    onClose();
    router.push(`/about?course=${course.id}`);
  }

  // Glow color mapping for banner background fallback
  const glowBgMap: Record<string, string> = {
    yellow: "bg-amber-400/25",
    green: "bg-emerald-500/25",
    blue: "bg-sky-500/25",
    orange: "bg-orange-500/30",
    red: "bg-rose-500/25",
    purple: "bg-purple-500/30",
  };

  const glowRingMap: Record<string, string> = {
    yellow: "border-white/30 text-white shadow-[0_0_20px_rgba(251,191,36,0.4)]",
    green: "border-emerald-400/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    blue: "border-sky-400/90 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)]",
    orange: "border-orange-400/90 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.45)]",
    red: "border-rose-400/90 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]",
    purple: "border-purple-400/90 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop Click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-zinc-200/90 animate-in zoom-in-95 duration-200">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition cursor-pointer shadow-md"
          title="Close Modal"
        >
          <X size={16} />
        </button>

        {/* 1. TOP BANNER HEADER (Matching Skool Theme & Reference Image) */}
        {course.thumbnail ? (
          <div
            className="relative h-48 sm:h-56 w-full overflow-hidden p-4 flex flex-col items-center justify-center select-none bg-cover bg-center"
            style={{
              backgroundImage: `url(${course.thumbnail})`,
            }}
          >
            {/* Dark Contrast Overlay */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />

            {/* Terminal Watermark behind */}
            {watermark && (
              <div className="absolute inset-x-0 bottom-3 text-center font-mono text-2xl sm:text-3xl font-black text-white/20 tracking-tight pointer-events-none select-none">
                {watermark}
              </div>
            )}

            {/* Center Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/85 text-white shadow-xl border-2 border-white/30 mb-2">
                <Lock size={22} className="sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white drop-shadow-md leading-snug">
                {course.title}
              </h2>
              <span className="mt-1 text-xs sm:text-sm font-extrabold text-white/90 drop-shadow">
                {isVipCourse
                  ? "👑 Unlock with VIP Membership"
                  : `Unlock at Level ${course.unlockLevel || 1}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none">
            {/* Ambient Radial Glow */}
            <div
              className={`absolute h-32 w-32 rounded-full ${glowBgMap[glow] || "bg-amber-400/25"} blur-2xl pointer-events-none`}
            />

            {/* Terminal Watermark behind */}
            {watermark && (
              <div className="absolute inset-x-0 bottom-3 text-center font-mono text-2xl sm:text-3xl font-black text-white/10 tracking-tight pointer-events-none select-none">
                {watermark}
              </div>
            )}

            {/* Center Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
              <div
                className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-zinc-950/90 border-2 ${
                  glowRingMap[glow] || "border-white/30 text-white"
                } shadow-xl mb-2`}
              >
                {glow === "orange" ? (
                  <Flame size={22} className="sm:w-6 sm:h-6 stroke-[2.5]" />
                ) : (
                  <Lock size={22} className="sm:w-6 sm:h-6 stroke-[2.5]" />
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white drop-shadow-md leading-snug">
                {course.title}
              </h2>
              <span className="mt-1 text-xs sm:text-sm font-extrabold text-white/90 drop-shadow">
                {isVipCourse
                  ? "👑 Unlock with VIP Membership"
                  : `Unlock at Level ${course.unlockLevel || 1}`}
              </span>
            </div>
          </div>
        )}

        {/* 2. CARD BODY & ACTION BUTTONS */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Course Description */}
          {course.description && (
            <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
              {course.description}
            </p>
          )}

          {/* Level Progress Status Box */}
          <div className="rounded-xl bg-zinc-50 p-3 sm:p-3.5 border border-zinc-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-zinc-900">Your Current Level:</span>
                <span className="text-zinc-600 ml-1.5 font-semibold">
                  Level {userLevel} ({userPoints} pts)
                </span>
              </div>
            </div>
            {!isVipCourse && pointsNeeded > 0 && (
              <span className="font-extrabold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md text-[11px]">
                {pointsNeeded} pts needed
              </span>
            )}
          </div>

          {/* Primary Action Button: CHECK LEVEL ON LEADERBOARDS (Themed yellow/gold) */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleLeaderboardClick}
              className="w-full rounded-xl bg-[#f6c358] hover:bg-[#f3b940] active:bg-[#eab335] text-zinc-950 font-black py-3 px-4 text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Trophy size={16} className="text-zinc-900" />
              <span>CHECK LEVEL ON LEADERBOARDS</span>
            </button>

            {/* Secondary Action: About Course Button (Redirects directly to the specific course about page) */}
            <button
              type="button"
              onClick={handleAboutCourseClick}
              className="w-full rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 font-bold py-2.5 px-4 text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <BookOpen size={15} className="text-primary" />
              <span>About Course</span>
            </button>

            {/* VIP Upgrade Button if VIP Course or Standalone Price */}
            {isVipCourse ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onUpgradeClick) onUpgradeClick();
                  else router.push("/about?plan=vip");
                }}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2.5 px-4 text-xs sm:text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown size={15} />
                <span>👑 Upgrade to VIP ($9/mo)</span>
              </button>
            ) : course.price ? (
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 px-1">
                <span>Or unlock instantly:</span>
                <button
                  type="button"
                  onClick={handleAboutCourseClick}
                  className="font-bold text-primary hover:underline"
                >
                  Buy Standalone Access ({formatMoney(course.price)}) →
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
