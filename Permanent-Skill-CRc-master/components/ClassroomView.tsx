"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  FileText,
  Flame,
  Lock,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { WordDocumentNotes } from "@/components/WordDocumentNotes";
import { LessonComments } from "@/components/LessonComments";
import { StaffRoleFavicon, Modal, GoldButton, PrimaryButton } from "@/components/ui";
import { getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";
import { getVideoThumbnail, renderNotes, toEmbed } from "@/lib/video";
import type { Course, Lesson } from "@/lib/types";

interface ClassroomViewProps {
  initialCourseSlug?: string;
}

export function ClassroomView({ initialCourseSlug }: ClassroomViewProps) {
  const { courses, progress, user, completeLesson } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [lockedCoursePrompt, setLockedCoursePrompt] = useState<Course | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"overview" | "word-notes" | "comments">("overview");

  // Available courses
  const availableCourses = courses.length > 0 ? courses : [];

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (initialCourseSlug) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug);
      if (found) return found.id;
    }
    return null;
  });

  // Sync selected course when initialCourseSlug changes from navigation
  useEffect(() => {
    if (initialCourseSlug) {
      const found = availableCourses.find((c) => c.slug === initialCourseSlug);
      if (found) {
        setSelectedCourseId(found.id);
        setActiveLessonId(null);
        setPlaying(false);
      }
    }
  }, [initialCourseSlug, availableCourses]);

  const activeCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return availableCourses.find((c) => c.id === selectedCourseId) || null;
  }, [availableCourses, selectedCourseId]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "manager";
  const userLevelData = getLevel(user?.points || 0);
  const userLevel = userLevelData.level;

  // Strict Course Unlock Verification
  const isCourseUnlocked = (course: Course) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (user.isPremium) return true;
    if (user.purchasedCourseIds?.includes(course.id)) return true;
    if (course.isPremiumOnly) return false;
    return course.unlockLevel <= 1 || userLevel >= course.unlockLevel;
  };

  const locked = useMemo(() => {
    if (!activeCourse) return false;
    return !isCourseUnlocked(activeCourse);
  }, [activeCourse, user, isAdmin, userLevel]);

  // Group lessons by module
  const modules = useMemo(() => {
    if (!activeCourse) return [];
    const order: string[] = [];
    const map = new Map<string, Lesson[]>();
    for (const lesson of activeCourse.lessons) {
      const name = lesson.module || "Module 1: Introduction";
      if (!map.has(name)) {
        map.set(name, []);
        order.push(name);
      }
      map.get(name)!.push(lesson);
    }
    return order.map((name) => ({ name, lessons: map.get(name)! }));
  }, [activeCourse]);

  // Active lesson
  const activeLesson: Lesson | null = useMemo(() => {
    if (!activeCourse || activeCourse.lessons.length === 0) return null;
    if (activeLessonId) {
      const found = activeCourse.lessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    return activeCourse.lessons[0];
  }, [activeCourse, activeLessonId]);

  // Progress calculations for active course
  const row = progress.find(
    (p) => p.courseId === activeCourse?.id && p.userId === user?.id
  );
  const completedIds = row?.completedLessonIds || [];
  const totalLessons = activeCourse?.lessons.length || 0;
  const completedCount = totalLessons
    ? activeCourse!.lessons.filter((l) => completedIds.includes(l.id)).length
    : 0;
  const pct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  const isCurrentCompleted = activeLesson
    ? completedIds.includes(activeLesson.id)
    : false;

  const currentIndex = activeCourse && activeLesson
    ? activeCourse.lessons.findIndex((l) => l.id === activeLesson.id)
    : -1;

  const embed = activeLesson ? toEmbed(activeLesson.videoUrl) : null;

  function handleSelectLesson(id: string) {
    setActiveLessonId(id);
    setPlaying(false);
  }

  function handleToggleComplete() {
    if (!activeCourse || !activeLesson) return;
    completeLesson(activeCourse.id, activeLesson.id);
  }

  // Helper to render course banner with distinct Admin & User UI/UX states
  function renderCourseBanner(course: Course) {
    const watermark = course.watermark || `> ${course.slug}_`;
    const isUnlocked = isCourseUnlocked(course);

    // =========================================================================
    // 1. ADMIN BANNER UI/UX: Distinct, Glowing Admin Badge
    // =========================================================================
    if (isAdmin) {
      return (
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/40 p-4 flex flex-col items-center justify-center select-none border-b border-emerald-500/20">
          {/* Radial Emerald Glow */}
          <div className="absolute h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

          {/* Top Left Module Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="rounded-md bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[10px] font-black tracking-wider text-white uppercase border border-white/15">
              {course.badge || "MODULE"}
            </span>
          </div>

          {/* Top Right Admin Tag */}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/50 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-300 tracking-wider shadow-sm">
              <Sparkles size={11} className="text-amber-400" /> ADMIN
            </span>
          </div>

          {/* Terminal Watermark behind */}
          <div className="absolute inset-x-0 bottom-3 text-center font-mono text-2xl sm:text-3xl font-black text-white/10 tracking-tight pointer-events-none select-none">
            {watermark}
          </div>

          {/* Center Unlocked for Admin Emblem */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/90 border-2 border-emerald-400 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-110">
              <ShieldCheck size={22} className="stroke-[2.5]" />
            </div>

            <span className="mt-2 text-xs sm:text-[13px] font-black text-emerald-400 tracking-wide drop-shadow-md flex items-center gap-1">
              ⚡ Unlocked for Admin
            </span>

            <span className="text-[10.5px] text-zinc-300 font-medium">
              Full administrative access
            </span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 2. REGULAR USER UNLOCKED BANNER UI/UX
    // =========================================================================
    if (isUnlocked) {
      return (
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-primary/30 p-4 flex flex-col items-center justify-center select-none border-b border-primary/20">
          <div className="absolute h-32 w-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

          {/* Top Left Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="rounded-md bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[10px] font-black tracking-wider text-white uppercase border border-white/15">
              {course.badge || "MODULE"}
            </span>
          </div>

          {/* Top Right Status */}
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <Check size={11} strokeWidth={3} /> UNLOCKED
            </span>
          </div>

          {/* Watermark */}
          <div className="absolute inset-x-0 bottom-3 text-center font-mono text-2xl sm:text-3xl font-black text-white/10 tracking-tight pointer-events-none select-none">
            {watermark}
          </div>

          {/* Center Play Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 border-2 border-primary text-primary shadow-[0_0_20px_rgba(80,81,249,0.4)] transition-transform group-hover:scale-110">
              <Play size={20} className="fill-primary ml-0.5" />
            </div>

            <span className="mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
              {user?.isPremium
                ? "Unlocked with Premium"
                : user?.purchasedCourseIds?.includes(course.id)
                ? "Course Purchased"
                : `Level ${course.unlockLevel} Achieved`}
            </span>

            <span className="text-[10.5px] text-zinc-300 font-medium">
              Click to open course
            </span>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 3. REGULAR USER LOCKED BANNER UI/UX
    // =========================================================================
    const glow = course.glowColor || "yellow";
    let glowBg = "bg-emerald-500/20";
    let ringBorder = "border-emerald-400/80 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]";
    let lockIcon = <Lock size={20} className="stroke-[2.5]" />;

    if (glow === "yellow" || course.unlockLevel === 1) {
      glowBg = "bg-amber-500/20";
      ringBorder = "border-amber-400/80 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.35)]";
    } else if (glow === "blue") {
      glowBg = "bg-sky-500/20";
      ringBorder = "border-sky-400/80 text-sky-400 shadow-[0_0_18px_rgba(14,165,233,0.35)]";
    } else if (glow === "orange") {
      glowBg = "bg-orange-500/25";
      ringBorder = "border-orange-400/80 text-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.4)]";
      lockIcon = <Flame size={20} className="stroke-[2.5]" />;
    } else if (glow === "red") {
      glowBg = "bg-rose-500/20";
      ringBorder = "border-rose-400/80 text-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.35)]";
    } else if (glow === "purple") {
      glowBg = "bg-purple-500/25";
      ringBorder = "border-purple-400/80 text-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.4)]";
    }

    return (
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none border-b border-white/10">
        {/* Radial Glow */}
        <div className={`absolute h-28 w-28 rounded-full ${glowBg} blur-2xl pointer-events-none`} />

        {/* Top Left Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-md bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[10px] font-black tracking-wider text-white/70 uppercase border border-white/10">
            {course.badge || "MODULE"}
          </span>
        </div>

        {/* Top Right Status */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/70 border border-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-zinc-400">
            <Lock size={10} /> LOCKED
          </span>
        </div>

        {/* Watermark */}
        <div className="absolute inset-x-0 bottom-3 text-center font-mono text-2xl sm:text-3xl font-black text-white/10 tracking-tight pointer-events-none select-none">
          {watermark}
        </div>

        {/* Center Lock Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950/90 border-2 ${ringBorder} transition-transform group-hover:scale-105`}
          >
            {lockIcon}
          </div>

          <span className="mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
            {course.isPremiumOnly
              ? "Unlock with Premium"
              : `Unlock at Level ${course.unlockLevel}`}
          </span>

          <span className="text-[10.5px] text-zinc-400 font-medium">
            {course.isPremiumOnly
              ? "VIP Exclusive"
              : `Your Level: ${userLevel} • Or Buy Premium`}
          </span>
        </div>
      </div>
    );
  }

  // 1. PRIMARY VIEW: Classroom Course Grid
  if (!activeCourse) {
    return (
      <div className="space-y-6">
        {/* Admin Callout Banner */}
        {isAdmin && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 p-4 sm:p-5 text-white shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  Administrator Classroom Access
                  <span className="rounded-md bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.2 text-[10px] font-black text-emerald-300">
                    ALL UNLOCKED
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  All course modules, lesson videos, notes, and discussion threads are completely unlocked for your admin account.
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition shrink-0"
            >
              Course Manager →
            </Link>
          </div>
        )}

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableCourses.map((course) => {
            const cRow = progress.find(
              (p) => p.courseId === course.id && p.userId === user?.id
            );
            const cCompleted = cRow?.completedLessonIds || [];
            const cTotal = course.lessons.length;
            const cDone = cTotal
              ? course.lessons.filter((l) => cCompleted.includes(l.id)).length
              : 0;
            const cPct = cTotal ? Math.round((cDone / cTotal) * 100) : 0;
            const isUnlocked = isCourseUnlocked(course);

            return (
              <div
                key={course.id}
                onClick={() => {
                  if (!isUnlocked) {
                    setLockedCoursePrompt(course);
                    return;
                  }
                  setSelectedCourseId(course.id);
                  setActiveLessonId(null);
                  setPlaying(false);
                }}
                className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${
                  isAdmin
                    ? "border-emerald-500/30 hover:border-emerald-500/70 bg-white"
                    : isUnlocked
                    ? "border-zinc-200/90 hover:border-primary/50 bg-white"
                    : "border-zinc-200/80 hover:border-zinc-400 bg-white/95 opacity-95 hover:opacity-100"
                }`}
              >
                {/* Course Banner */}
                {renderCourseBanner(course)}

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] sm:text-base font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      {isAdmin && (
                        <span className="shrink-0 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs sm:text-[13px] text-zinc-600 line-clamp-2 leading-relaxed min-h-[36px]">
                      {course.description}
                    </p>
                  </div>

                  {/* Clean Pill Progress Bar */}
                  <div className="mt-4">
                    <div className="relative h-5 w-full overflow-hidden rounded-full bg-[#e5e7eb] flex items-center shadow-inner">
                      {cPct > 0 && (
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-500"
                          style={{ width: `${cPct}%` }}
                        />
                      )}
                      <span className="absolute left-3 text-[11px] font-bold text-zinc-700">
                        {cPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Locked Course Requirement Dialog */}
        {lockedCoursePrompt && (
          <Modal
            open={!!lockedCoursePrompt}
            onClose={() => setLockedCoursePrompt(null)}
            title="Course Locked"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 border border-amber-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
                  <Lock size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-950">
                    {lockedCoursePrompt.title}
                  </div>
                  <div className="text-xs text-amber-800 mt-0.5">
                    {lockedCoursePrompt.isPremiumOnly
                      ? "This is a Premium VIP mastermind course."
                      : `Requires Level ${lockedCoursePrompt.unlockLevel} or Premium VIP.`}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-zinc-600">
                <p>
                  Your current account status: <strong>Level {userLevel} ({userLevelData.name})</strong> with <strong>{user?.points || 0} community points</strong>.
                </p>
                {!lockedCoursePrompt.isPremiumOnly && (
                  <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200 text-zinc-700">
                    <strong>💡 How to unlock for free:</strong> Earn points by posting wins, discussing strategies, and answering peer questions in the Community to reach <strong>Level {lockedCoursePrompt.unlockLevel}</strong>.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLockedCoursePrompt(null)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Close
                </button>
                <GoldButton
                  className="flex-1 text-xs py-2.5"
                  onClick={() => {
                    setLockedCoursePrompt(null);
                    setUpgradeOpen(true);
                  }}
                >
                  <Sparkles size={14} className="mr-1 inline" /> Upgrade to VIP ($9/mo)
                </GoldButton>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // 2. DETAILED MODULE / COURSE LESSON VIEW
  return (
    <div className="space-y-6">
      {/* Navigation Bar: Back to Classroom & Course Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/90 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedCourseId(null);
              setActiveLessonId(null);
              setPlaying(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition cursor-pointer shadow-xs"
          >
            <ChevronLeft size={16} /> Back to Classroom
          </button>

          <span className="text-zinc-300">/</span>

          <h1 className="text-sm font-bold text-zinc-900 line-clamp-1 flex items-center gap-2">
            {activeCourse.title}
            {isAdmin && (
              <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.2 text-[10px] font-black text-emerald-600">
                ⚡ ADMIN ACCESS
              </span>
            )}
          </h1>
        </div>

        {/* Course Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {availableCourses.map((c, idx) => {
            const isSelected = c.id === activeCourse.id;
            const cRow = progress.find(
              (p) => p.courseId === c.id && p.userId === user?.id
            );
            const cDone = c.lessons.filter((l) =>
              cRow?.completedLessonIds.includes(l.id)
            ).length;
            const cPct = c.lessons.length
              ? Math.round((cDone / c.lessons.length) * 100)
              : 0;

            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCourseId(c.id);
                  setActiveLessonId(null);
                  setPlaying(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-primary/30 hover:text-primary"
                }`}
                title={c.title}
              >
                <span>{idx + 1}</span>
                <span className="text-[10px] opacity-80">{cPct}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {locked ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">
            {activeCourse.isPremiumOnly
              ? "Premium VIP Mastermind Course"
              : `Unlock at Level ${activeCourse.unlockLevel}`}
          </h2>
          <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
            {activeCourse.isPremiumOnly
              ? "This course is reserved exclusively for Premium VIP members."
              : `This course requires Level ${activeCourse.unlockLevel}. You are currently Level ${userLevel} (${userLevelData.name}) with ${user?.points || 0} points.`}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <GoldButton
              onClick={() => setUpgradeOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs py-2.5 px-5 shadow-xs"
            >
              <Sparkles size={14} /> Upgrade to VIP ($9/mo)
            </GoldButton>
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Earn Points in Community
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left Sidebar */}
          <aside className="order-2 lg:order-1 space-y-6">
            {/* Store Theme Pill Progress Bar */}
            <div
              className="relative h-8 w-full overflow-hidden rounded-full bg-[#e2e4e9] flex items-center shadow-inner"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              title={`Course Progress: ${pct}%`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-[#6366f1] to-[#7c83ff] transition-all duration-400 ease-out shadow-xs"
                style={{ width: `${pct}%` }}
              />

              <span
                className={`absolute inset-y-0 left-4 flex items-center text-xs font-black tracking-wide transition-colors ${
                  pct > 15 ? "text-white drop-shadow-xs" : "text-zinc-800"
                }`}
              >
                {pct}%
              </span>
            </div>

            {/* Prominent Lesson Navigation List */}
            <div className="space-y-6">
              {modules.map((mod) => (
                <div key={mod.name} className="space-y-2.5">
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                    {mod.name}
                  </h2>

                  <div className="space-y-1.5">
                    {mod.lessons.map((item) => {
                      const isActive = activeLesson?.id === item.id;
                      const isDone = completedIds.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectLesson(item.id)}
                          className={`group flex w-full items-center justify-between text-left transition-all cursor-pointer ${
                            isActive
                              ? "rounded-xl bg-primary/10 border border-primary/25 px-4 py-2.5 font-bold text-primary shadow-2xs"
                              : "rounded-xl px-4 py-2.5 text-[14.5px] font-medium text-zinc-800 hover:bg-white hover:text-primary hover:shadow-xs border border-transparent hover:border-zinc-200"
                          }`}
                        >
                          <span
                            className={`truncate leading-snug ${
                              isActive
                                ? "font-bold text-primary text-[14.5px]"
                                : "text-zinc-800 group-hover:text-primary"
                            }`}
                            title={item.title}
                          >
                            {item.title}
                          </span>

                          {isDone && (
                            <span
                              className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-xs bg-primary text-white"
                              title="Completed"
                            >
                              <Check size={11} strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Main Card */}
          <main className="order-1 lg:order-2 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm md:p-8 space-y-8">
            {activeLesson ? (
              <div className="space-y-8">
                {/* Header: Lesson Title + Circular Completion Checkmark Button */}
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
                    {activeLesson.videoTitle || activeLesson.title}
                  </h1>

                  {/* Circular Completion Toggle Button */}
                  <button
                    onClick={handleToggleComplete}
                    aria-label={
                      isCurrentCompleted
                        ? "Mark as uncompleted"
                        : "Mark as completed"
                    }
                    title={
                      isCurrentCompleted
                        ? "Completed! Click to unmark"
                        : "Click to mark as completed"
                    }
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                      isCurrentCompleted
                        ? "border-2 border-primary bg-primary text-white shadow-sm hover:bg-primary-dark hover:border-primary-dark hover:scale-105"
                        : "border-2 border-zinc-400 text-zinc-400 hover:border-primary hover:text-primary hover:scale-105"
                    }`}
                  >
                    <Check size={17} strokeWidth={3} />
                  </button>
                </div>

                {/* 16:9 Video Player Container */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-200 shadow-inner group">
                  {playing ? (
                    embed?.type === "file" ? (
                      <video
                        key={embed.src}
                        src={embed.src}
                        controls
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : embed ? (
                      <iframe
                        key={embed.src}
                        src={`${embed.src}?autoplay=1`}
                        title={activeLesson.videoTitle || activeLesson.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                        No video source available.
                      </div>
                    )
                  ) : (
                    /* Dynamic Video Preview Overlay */
                    <div
                      onClick={() => setPlaying(true)}
                      className="relative h-full w-full cursor-pointer select-none bg-zinc-950 overflow-hidden"
                    >
                      {getVideoThumbnail(activeLesson.videoUrl) ? (
                        <img
                          src={getVideoThumbnail(activeLesson.videoUrl)!}
                          alt={activeLesson.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-primary/20 flex flex-col items-center justify-center p-6 text-center">
                          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/30 mb-2">
                            {activeCourse.badge || "LESSON"}
                          </span>
                          <h2 className="max-w-md text-lg font-bold text-white line-clamp-2">
                            {activeLesson.title}
                          </h2>
                        </div>
                      )}

                      {/* Subtle Vignette */}
                      <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />

                      {/* Center Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/65 text-white backdrop-blur-xs transition group-hover:scale-110 group-hover:bg-primary shadow-2xl">
                          <Play size={26} fill="currentColor" className="ml-1" />
                        </div>
                      </div>

                      {/* Bottom-right Duration Badge */}
                      <div className="absolute bottom-3 right-3 rounded bg-black/85 px-2.5 py-1 font-mono text-xs font-bold text-white shadow-xs">
                        {activeLesson.duration || "0:34"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Section Navigator Tabs */}
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab("overview")}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                      activeBottomTab === "overview"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    <BookOpen size={14} /> Lesson Overview & Swipe Files
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab("word-notes")}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                      activeBottomTab === "word-notes"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    <FileText size={14} /> Word Document Notes
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab("comments")}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                      activeBottomTab === "comments"
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    <MessageSquare size={14} /> Discussion & Comments
                  </button>
                </div>

                {/* 1. SECTION 1: Lesson Description & Notes */}
                {activeBottomTab === "overview" && (
                  <div className="space-y-4 rounded-2xl border border-zinc-200/90 bg-white p-6 md:p-8 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-[10px] font-black text-white">
                          PSS
                        </span>
                        <span className="text-xs font-bold text-zinc-900">Permanent Skills Academy</span>
                        <StaffRoleFavicon role="admin" size="xs" />
                      </div>
                      <span className="text-[11px] text-zinc-400 font-medium">Official Course Material</span>
                    </div>
                    <div className="prose max-w-none text-[15px] leading-relaxed text-zinc-800">
                      {renderNotes(activeLesson.notes || "No notes provided for this lesson.")}
                    </div>
                  </div>
                )}

                {/* 2. SECTION 2: Word Document Notes Sheet */}
                {activeBottomTab === "word-notes" && (
                  <div className="space-y-2">
                    <WordDocumentNotes
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                    />
                  </div>
                )}

                {/* 3. SECTION 3: Lesson Comments */}
                {activeBottomTab === "comments" && (
                  <div>
                    <LessonComments
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                    />
                  </div>
                )}

                {/* Previous / Next Navigation */}
                <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                  <button
                    disabled={currentIndex <= 0}
                    onClick={() => {
                      if (currentIndex > 0) {
                        handleSelectLesson(activeCourse.lessons[currentIndex - 1].id);
                      }
                    }}
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    ← Previous Lesson
                  </button>

                  <div className="text-xs font-bold text-zinc-400">
                    Lesson {currentIndex + 1} of {totalLessons}
                  </div>

                  <button
                    disabled={currentIndex >= totalLessons - 1}
                    onClick={() => {
                      if (currentIndex < totalLessons - 1) {
                        handleSelectLesson(activeCourse.lessons[currentIndex + 1].id);
                      }
                    }}
                    className="text-sm font-bold text-primary hover:text-primary-dark disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    Next Lesson →
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500">
                <p>No lessons available in this course.</p>
              </div>
            )}
          </main>
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
