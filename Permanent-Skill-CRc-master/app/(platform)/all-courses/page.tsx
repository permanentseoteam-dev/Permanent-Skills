"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Lock,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, PrimaryButton, GoldButton, ProgressBar, Modal } from "@/components/ui";
import { UpgradeModal } from "@/components/UpgradeModal";
import { getLevel } from "@/lib/levels";
import { formatMoney } from "@/lib/format";
import type { Course } from "@/lib/types";

type FilterTab = "all" | "in_progress" | "completed" | "unlocked" | "vip" | "team";
type SortOption = "default" | "progress_desc" | "lessons_desc" | "level_asc" | "level_desc" | "title_asc";

export default function AllCoursesPage() {
  const { courses, progress, user, purchaseCourse } = useApp();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [purchasingCourse, setPurchasingCourse] = useState<Course | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const userLevelData = getLevel(user?.points || 0);
  const userLevel = userLevelData.level;

  // Aggregate stats
  const stats = useMemo(() => {
    let totalLessonsCount = 0;
    let completedLessonsCount = 0;
    let inProgressCoursesCount = 0;
    let completedCoursesCount = 0;

    courses.forEach((c) => {
      const cTotal = c.lessons.length;
      totalLessonsCount += cTotal;
      const row = progress.find((p) => p.courseId === c.id && p.userId === user?.id);
      const cDone = row?.completedLessonIds.length || 0;
      completedLessonsCount += cDone;

      if (cTotal > 0 && cDone === cTotal) {
        completedCoursesCount++;
      } else if (cDone > 0) {
        inProgressCoursesCount++;
      }
    });

    const overallPct = totalLessonsCount ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    return {
      totalCourses: courses.length,
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount,
      inProgressCourses: inProgressCoursesCount,
      completedCourses: completedCoursesCount,
      overallPct,
    };
  }, [courses, progress, user]);

  // Filter & sort logic
  const filteredCourses = useMemo(() => {
    let list = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const titleMatch = c.title.toLowerCase().includes(q);
        const descMatch = c.description.toLowerCase().includes(q);
        const badgeMatch = c.badge?.toLowerCase().includes(q);
        const lessonMatch = c.lessons.some((l) =>
          l.title.toLowerCase().includes(q) || l.module?.toLowerCase().includes(q)
        );
        return titleMatch || descMatch || badgeMatch || lessonMatch;
      });
    }

    // Category filter
    list = list.filter((c) => {
      const row = progress.find((p) => p.courseId === c.id && p.userId === user?.id);
      const doneCount = row?.completedLessonIds.length || 0;
      const totalCount = c.lessons.length;
      const isPurchased = user?.purchasedCourseIds?.includes(c.id);
      const isLevelUnlocked = !c.isPremiumOnly && (c.unlockLevel <= 1 || userLevel >= c.unlockLevel);
      const isAccessible = user?.role === "admin" || user?.role === "manager" || user?.isPremium || isPurchased || isLevelUnlocked;

      if (selectedFilter === "in_progress") {
        return doneCount > 0 && doneCount < totalCount;
      }
      if (selectedFilter === "completed") {
        return totalCount > 0 && doneCount === totalCount;
      }
      if (selectedFilter === "unlocked") {
        return isAccessible;
      }
      if (selectedFilter === "vip") {
        return c.isPremiumOnly || c.badge === "PREMIUM" || c.badge === "VIP";
      }
      if (selectedFilter === "team") {
        return (
          c.badge?.toLowerCase().includes("team") ||
          c.title.toLowerCase().includes("team") ||
          c.slug.toLowerCase().includes("team") ||
          c.id.toLowerCase().includes("team") ||
          c.description.toLowerCase().includes("team")
        );
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      const rowA = progress.find((p) => p.courseId === a.id && p.userId === user?.id);
      const rowB = progress.find((p) => p.courseId === b.id && p.userId === user?.id);
      const pctA = a.lessons.length ? ((rowA?.completedLessonIds.length || 0) / a.lessons.length) * 100 : 0;
      const pctB = b.lessons.length ? ((rowB?.completedLessonIds.length || 0) / b.lessons.length) * 100 : 0;

      if (sortBy === "progress_desc") return pctB - pctA;
      if (sortBy === "lessons_desc") return b.lessons.length - a.lessons.length;
      if (sortBy === "level_asc") return (a.unlockLevel || 1) - (b.unlockLevel || 1);
      if (sortBy === "level_desc") return (b.unlockLevel || 1) - (a.unlockLevel || 1);
      if (sortBy === "title_asc") return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [courses, progress, user, searchQuery, selectedFilter, sortBy, userLevel]);

  // Handle Purchase Confirmation
  async function confirmPurchase() {
    if (!purchasingCourse) return;
    setBusyId(purchasingCourse.id);
    setSuccessMsg(null);
    try {
      const res = await purchaseCourse(purchasingCourse.id);
      if (res.ok) {
        setSuccessMsg(`"${purchasingCourse.title}" unlocked successfully! You now have permanent lifetime access.`);
        setPurchasingCourse(null);
      }
    } finally {
      setBusyId(null);
    }
  }

  // Helper to render classroom-style lock banner matching ClassroomView
  function renderCourseBanner(course: Course) {
    const isLevel1 = course.unlockLevel === 1 && !course.isPremiumOnly;
    const isPremiumOnly = !!course.isPremiumOnly;
    const glow = course.glowColor || "yellow";
    const watermark = course.watermark || `> ${course.slug}_`;

    if (isLevel1 || glow === "yellow") {
      return (
        <div
          className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#786c12] p-4 flex flex-col items-center justify-center select-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.22) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        >
          {/* Terminal Watermark behind */}
          <div className="absolute inset-x-0 bottom-4 text-center font-mono text-2xl sm:text-3xl font-black text-black/35 tracking-tight pointer-events-none select-none">
            {watermark}
          </div>

          {/* Center Black Lock Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/90 text-white shadow-xl border border-white/20">
              <Lock size={20} className="stroke-[2.5]" />
            </div>
            <span className="mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
              Unlock at Level 1
            </span>
          </div>
        </div>
      );
    }

    // Glow Configurations
    let glowBg = "bg-emerald-500/25";
    let ringBorder = "border-emerald-400/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
    let lockIcon = <Lock size={20} className="stroke-[2.5]" />;

    if (glow === "green") {
      glowBg = "bg-emerald-500/25";
      ringBorder = "border-emerald-400/90 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]";
    } else if (glow === "blue") {
      glowBg = "bg-sky-500/25";
      ringBorder = "border-sky-400/90 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)]";
    } else if (glow === "orange") {
      glowBg = "bg-orange-500/30";
      ringBorder = "border-orange-400/90 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.45)]";
      lockIcon = <Flame size={20} className="stroke-[2.5]" />;
    } else if (glow === "red") {
      glowBg = "bg-rose-500/25";
      ringBorder = "border-rose-400/90 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
    } else if (glow === "purple") {
      glowBg = "bg-purple-500/30";
      ringBorder = "border-purple-400/90 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]";
    }

    return (
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black p-4 flex flex-col items-center justify-center select-none">
        {/* Radial Glow */}
        <div className={`absolute h-28 w-28 rounded-full ${glowBg} blur-2xl pointer-events-none`} />

        {/* Terminal Watermark behind */}
        <div className="absolute inset-x-0 bottom-4 text-center font-mono text-2xl sm:text-3xl font-black text-white/10 tracking-tight pointer-events-none select-none">
          {watermark}
        </div>

        {/* Center Glowing Lock Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950/90 border-2 ${ringBorder} transition-transform group-hover:scale-105`}
          >
            {lockIcon}
          </div>

          <span className="mt-2 text-xs sm:text-[13px] font-extrabold text-white drop-shadow-md">
            {isPremiumOnly
              ? "👑 Unlock with VIP"
              : `Unlock at Level ${course.unlockLevel}`}
          </span>

          {!isPremiumOnly && (
            <span className="text-[10.5px] text-zinc-400 font-medium">
              or Upgrade to VIP
            </span>
          )}
        </div>
      </div>
    );
  }

  // Helper to get total duration
  function getCourseDuration(c: Course) {
    let totalMinutes = 0;
    c.lessons.forEach((l) => {
      const parts = (l.duration || "10:00").split(":");
      if (parts.length === 2) {
        totalMinutes += parseInt(parts[0], 10) || 0;
      }
    });
    if (totalMinutes === 0) return `${c.lessons.length * 12} mins`;
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
  }

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Header with Learning Portfolio Summary */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50/50 to-primary/5 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900">All Courses & Masterminds</h1>
                <p className="text-xs text-zinc-500 font-medium">
                  Complete training library. Earn community points to unlock courses for free, or unlock instantly via VIP.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!user?.isPremium && (
              <GoldButton
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Sparkles size={14} /> Upgrade to VIP ($9/mo)
              </GoldButton>
            )}

            {user?.role === "admin" && (
              <Link href="/admin">
                <PrimaryButton className="inline-flex items-center gap-1.5 text-xs">
                  <Plus size={14} /> Course Editor
                </PrimaryButton>
              </Link>
            )}
          </div>
        </div>

        {/* Learning Scorecard Strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-zinc-200/80">
          <div className="rounded-xl bg-white p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Courses</span>
              <Layers size={14} className="text-primary" />
            </div>
            <div className="text-xl font-extrabold text-zinc-900">{stats.totalCourses}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Curriculum modules</div>
          </div>

          <div className="rounded-xl bg-white p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Video Lessons</span>
              <Play size={14} className="text-primary" />
            </div>
            <div className="text-xl font-extrabold text-zinc-900">{stats.totalLessons}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Step-by-step videos</div>
          </div>

          <div className="rounded-xl bg-white p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Lessons Completed</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-emerald-600">
              {stats.completedLessons} <span className="text-xs font-semibold text-zinc-400">({stats.overallPct}%)</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{stats.completedCourses} courses finished</div>
          </div>

          <div className="rounded-xl bg-white p-3.5 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Your Rank</span>
              <Trophy size={14} className="text-amber-500" />
            </div>
            <div className="text-base font-extrabold text-zinc-900 truncate">
              {userLevelData.name}
            </div>
            <div className="text-[11px] text-amber-600 font-bold mt-0.5">
              Level {userLevel} ({user?.points || 0} pts)
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-emerald-600 shrink-0" />
            {successMsg}
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="rounded p-1 text-emerald-600 hover:bg-emerald-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Search, Filter Tabs & Sorting Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search courses, lessons, topics, or modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9.5 pr-8 text-xs font-medium text-zinc-800 placeholder-zinc-400 shadow-2xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs font-semibold text-zinc-500 shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs outline-none focus:border-primary cursor-pointer"
          >
            <option value="default">Default Order</option>
            <option value="progress_desc">Highest Progress</option>
            <option value="lessons_desc">Most Lessons</option>
            <option value="level_asc">Level: Low to High</option>
            <option value="level_desc">Level: High to Low</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200/80 text-xs scrollbar-none">
        {[
          { id: "all", label: "All Courses", count: courses.length },
          { id: "unlocked", label: "Unlocked", count: courses.filter((c) => user?.role === "admin" || user?.role === "manager" || user?.isPremium || user?.purchasedCourseIds?.includes(c.id) || (!c.isPremiumOnly && (c.unlockLevel <= 1 || userLevel >= c.unlockLevel))).length },
          { id: "in_progress", label: "In Progress", count: stats.inProgressCourses },
          { id: "completed", label: "Completed", count: stats.completedCourses },
          { id: "vip", label: "VIP Masterminds", count: courses.filter((c) => c.isPremiumOnly || c.badge === "PREMIUM" || c.badge === "VIP").length },
          { id: "team", label: "Team", icon: "/team-icon.png", count: courses.filter((c) => c.badge?.toLowerCase().includes("team") || c.title.toLowerCase().includes("team") || c.slug.toLowerCase().includes("team") || c.id.toLowerCase().includes("team") || c.description.toLowerCase().includes("team")).length },
        ].map((tab) => {
          const isActive = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as FilterTab)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-bold transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {"icon" in tab && tab.icon && (
                <img
                  src={tab.icon}
                  alt=""
                  className="h-3.5 w-3.5 rounded object-cover shrink-0"
                />
              )}
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
          <BookOpen className="mx-auto mb-3 text-zinc-300" size={36} />
          <h3 className="text-base font-bold text-zinc-900">No courses found</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            We couldn&apos;t find any courses matching your active search query or filter selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
            className="mt-4 inline-flex items-center rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const row = progress.find((p) => p.courseId === course.id && p.userId === user?.id);
            const total = course.lessons.length;
            const completedCount = row?.completedLessonIds.length || 0;
            const pct = total ? Math.round((completedCount / total) * 100) : 0;

            const isPurchased = user?.purchasedCourseIds?.includes(course.id);
            const isLevelUnlocked = !course.isPremiumOnly && (course.unlockLevel <= 1 || userLevel >= course.unlockLevel);
            const isAccessible = user?.role === "admin" || user?.role === "manager" || user?.isPremium || isPurchased || isLevelUnlocked;
            const price = course.price || 49;
            const duration = getCourseDuration(course);

            return (
              <Card
                key={course.id}
                className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-zinc-200/90"
              >
                {/* Course Banner */}
                {!isAccessible ? (
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (course.isPremiumOnly) {
                        setUpgradeOpen(true);
                      } else {
                        setPurchasingCourse(course);
                      }
                    }}
                    title="Click to unlock this course"
                  >
                    {renderCourseBanner(course)}
                  </div>
                ) : (
                  <Link
                    href={`/classroom/${course.slug}`}
                    className={`relative h-44 sm:h-48 bg-gradient-to-br ${course.accent || "from-zinc-900 to-zinc-950"} p-5 text-white flex flex-col justify-between overflow-hidden select-none cursor-pointer`}
                  >
                    {/* Subtle Glow overlay */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="rounded-md bg-black/40 backdrop-blur-xs px-2.5 py-1 text-[10px] font-black tracking-wider text-white uppercase border border-white/15">
                        {course.badge || "MODULE"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 backdrop-blur-xs px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                        <ShieldCheck size={13} /> {user?.role === "admin" ? "⚡ Unlocked for Admin" : "Unlocked"}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h2 className="text-base sm:text-lg font-black leading-snug group-hover:text-primary-light transition-colors line-clamp-1">
                        {course.title}
                      </h2>
                      <div className="mt-1 flex items-center gap-3 text-xs text-white/80 font-medium">
                        <span className="flex items-center gap-1">
                          <Play size={12} /> {total} Lessons
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {duration}
                        </span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Card Body */}
                {isAccessible ? (
                  <Link
                    href={`/classroom/${course.slug}`}
                    className="flex flex-1 flex-col justify-between p-5 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  >
                    <div>
                      <p className="min-h-[40px] text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-1.5">
                          <span className="text-zinc-500">Progress ({completedCount}/{total})</span>
                          <span className={pct === 100 ? "text-emerald-600" : "text-primary"}>
                            {pct}% {pct === 100 && "✓"}
                          </span>
                        </div>
                        <ProgressBar value={pct} />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    onClick={() => {
                      if (course.isPremiumOnly) {
                        setUpgradeOpen(true);
                      } else {
                        setPurchasingCourse(course);
                      }
                    }}
                    className="flex flex-1 flex-col justify-between p-5 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  >
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {course.title}
                      </h3>
                      <p className="min-h-[40px] text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 border border-zinc-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-zinc-800">
                            {course.isPremiumOnly
                              ? "👑 VIP Mastermind"
                              : `Unlocks at Level ${course.unlockLevel}`}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {course.isPremiumOnly
                              ? "Requires active VIP subscription ($9/mo)"
                              : `You are Level ${userLevel} (${userLevelData.name})`}
                          </div>
                        </div>
                        <Lock size={15} className="text-zinc-400 shrink-0" />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Gamification Roadmap & Points Callout Banner */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-900 via-zinc-950 to-primary/30 p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/30 px-3 py-1 text-xs font-bold text-primary-light ring-1 ring-primary/40">
            <Flame size={14} className="text-amber-400" /> Unlock Courses by Leveling Up
          </div>
          <h2 className="text-lg font-black tracking-tight">Want to unlock all courses without purchasing?</h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Post your business wins, answer peer questions, and climb the Leaderboard. Each level you reach unlocks exclusive new course modules and resources automatically!
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/leaderboards">
            <PrimaryButton className="inline-flex items-center gap-1.5 text-xs">
              <Trophy size={14} /> View Leaderboard
            </PrimaryButton>
          </Link>
          <Link href="/community">
            <button className="rounded-lg bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer border border-white/20">
              Go to Community
            </button>
          </Link>
        </div>
      </div>

      {/* 5. Course Curriculum & Syllabus Preview Modal */}
      {previewCourse && (
        <Modal
          open={!!previewCourse}
          onClose={() => setPreviewCourse(null)}
          title={previewCourse.title}
          wide
        >
          <div className="space-y-5">
            {/* Course Meta Banner */}
            <div className={`rounded-xl bg-gradient-to-br ${previewCourse.accent || "from-zinc-900 to-zinc-950"} p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div>
                <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  {previewCourse.badge || "MODULE"}
                </span>
                <p className="mt-1 text-xs text-white/80">{previewCourse.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-semibold text-white/90">
                  {previewCourse.lessons.length} Lessons • {getCourseDuration(previewCourse)}
                </div>
                <div className="text-[11px] text-white/70">
                  {previewCourse.isPremiumOnly ? "VIP Exclusive" : `Requires Level ${previewCourse.unlockLevel}`}
                </div>
              </div>
            </div>

            {/* Lessons Syllabus List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Curriculum & Lesson Breakdown
              </h4>

              <div className="space-y-2">
                {previewCourse.lessons.map((lesson, idx) => {
                  const isDone = progress
                    .find((p) => p.courseId === previewCourse.id && p.userId === user?.id)
                    ?.completedLessonIds.includes(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 hover:bg-white transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 text-xs font-bold text-zinc-700 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 truncate">
                            {lesson.title}
                          </div>
                          {lesson.module && (
                            <div className="text-[11px] text-zinc-500 truncate">
                              {lesson.module}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-zinc-500">
                          {lesson.duration || "10:00"}
                        </span>
                        {isDone && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
              <button
                onClick={() => setPreviewCourse(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                {user?.role === "admin" ||
                user?.role === "manager" ||
                user?.isPremium ||
                user?.purchasedCourseIds?.includes(previewCourse.id) ||
                (!previewCourse.isPremiumOnly && (previewCourse.unlockLevel <= 1 || userLevel >= previewCourse.unlockLevel)) ? (
                  <Link href={`/classroom/${previewCourse.slug}`}>
                    <PrimaryButton className="inline-flex items-center gap-1.5 text-xs">
                      <Play size={14} /> Open in Classroom
                    </PrimaryButton>
                  </Link>
                ) : previewCourse.isPremiumOnly ? (
                  <GoldButton
                    onClick={() => {
                      setPreviewCourse(null);
                      setUpgradeOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs"
                  >
                    <Sparkles size={14} /> Upgrade to VIP ($9/mo)
                  </GoldButton>
                ) : (
                  <GoldButton
                    onClick={() => {
                      const c = previewCourse;
                      setPreviewCourse(null);
                      setPurchasingCourse(c);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs"
                  >
                    <Sparkles size={14} /> Unlock Course — {formatMoney(previewCourse.price || 49)}
                  </GoldButton>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Purchase Confirmation Modal */}
      {purchasingCourse && (
        <Modal
          open={!!purchasingCourse}
          onClose={() => setPurchasingCourse(null)}
          title="Unlock Course Access"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200">
              <div className="text-sm font-bold text-zinc-900">{purchasingCourse.title}</div>
              <p className="text-xs text-zinc-500 mt-1">{purchasingCourse.description}</p>
              
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-900">
                  {formatMoney(purchasingCourse.price || 49)}
                </span>
                <span className="text-xs font-semibold text-zinc-500">One-time payment • Lifetime Access</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-700">
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Full access to all {purchasingCourse.lessons.length} video lessons & modules
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Downloadable Word Notes, swipe files & resources
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Lesson discussion forums & instructor feedback
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Future curriculum updates included at no extra charge
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200/80 text-[11.5px] text-amber-900">
              <span className="font-bold">💡 Free Unlock Alternative:</span> You can also unlock this course for free by participating in community discussions to reach <strong>Level {purchasingCourse.unlockLevel}</strong> (Currently Level {userLevel}).
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPurchasingCourse(null)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <GoldButton
                className="flex-1 text-xs py-2.5"
                disabled={busyId === purchasingCourse.id}
                onClick={confirmPurchase}
              >
                {busyId === purchasingCourse.id ? "Processing..." : `Confirm ${formatMoney(purchasingCourse.price || 49)}`}
              </GoldButton>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Upgrade Modal */}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
